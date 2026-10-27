import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/Order";
import { requireRole } from "@/lib/api-auth";
import { rejectCrossOrigin } from "@/lib/csrf";
import { enforceRateLimit } from "@/lib/rate-limit";
import { OBJECT_ID_PATTERN, updateOrderSchema } from "@/lib/validation";

const ORDER_ROLES = ["admin", "manager", "cashier", "kitchen"] as const;

// Internal fields the screens never use, kept out of API responses.
const ORDER_PROJECTION = { __v: 0, paymentIntentId: 0 };

// PATCH /api/orders/[id] - update order status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const route = "PATCH /api/orders/[id]";

  const crossOrigin = rejectCrossOrigin(req, route);
  if (crossOrigin) return crossOrigin;

  const auth = await requireRole(ORDER_ROLES, route);
  if (!auth.ok) return auth.response;

  // Generous: the kitchen taps through many orders, but a script shouldn't.
  const limited = enforceRateLimit(req, "order-update", {
    limit: 120,
    windowMs: 60_000,
    userId: auth.userId,
  });
  if (limited) return limited;

  try {
    const { id } = await params;
    if (!OBJECT_ID_PATTERN.test(id)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Whitelist: only a valid `status` is accepted, so a client can't rewrite
    // totals, payment fields or inject Mongo operators.
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request: a valid status is required" },
        { status: 400 },
      );
    }
    const { status } = parsed.data;

    await connectDB();

    const update: { status: typeof status; completedAt?: Date } = { status };
    if (status === "completed") {
      update.completedAt = new Date();
    }

    const order = await OrderModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
      projection: ORDER_PROJECTION,
    }).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("PATCH /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}

// GET /api/orders/[id] - get single order
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(ORDER_ROLES, "GET /api/orders/[id]");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    if (!OBJECT_ID_PATTERN.test(id)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    await connectDB();

    const order = await OrderModel.findById(id, ORDER_PROJECTION).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}
