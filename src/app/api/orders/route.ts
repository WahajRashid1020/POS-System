import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/Order";
import { getStripe } from "@/lib/stripe";
import { computeOrderTotals, toCents } from "@/lib/pricing";
import { priceOrderItems } from "@/lib/catalog";
import { createOrderMetaSchema } from "@/lib/validation";

// GET /api/orders - list orders with optional status filter
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const filter = status ? { status } : {};
    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders - create new order
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }

    // The client says which items and how many; prices and categories come
    // from the server-side menu, so a tampered price can never be charged.
    const priced = priceOrderItems("items" in body ? body.items : undefined);
    if (!priced.ok) {
      return NextResponse.json({ error: priced.error }, { status: 400 });
    }
    const items = priced.items;

    const meta = createOrderMetaSchema.safeParse(body);
    if (!meta.success) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }
    const { type, customerName, notes, paymentMethod, paymentIntentId } =
      meta.data;

    await connectDB();

    const { subtotal, tax, total } = computeOrderTotals(items);

    // For card orders, verify the payment actually succeeded and that Stripe
    // charged the exact amount for this order before recording it as paid.
    let paymentStatus: "unpaid" | "paid" = "unpaid";
    if (paymentMethod === "card") {
      if (!paymentIntentId) {
        return NextResponse.json(
          { error: "Card payment reference is missing" },
          { status: 400 }
        );
      }
      // One payment pays for one order — without this, a single successful
      // charge could be replayed to create unlimited "paid" orders.
      if (await OrderModel.exists({ paymentIntentId })) {
        return NextResponse.json(
          { error: "This payment has already been used for an order" },
          { status: 409 }
        );
      }
      const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
      if (
        intent.status !== "succeeded" ||
        intent.currency !== "eur" ||
        intent.amount !== toCents(total)
      ) {
        return NextResponse.json(
          { error: "Payment could not be verified" },
          { status: 402 }
        );
      }
      paymentStatus = "paid";
    } else if (paymentMethod === "cash") {
      paymentStatus = "paid";
    }

    // Generate order number (daily sequential)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderCount = await OrderModel.countDocuments({
      createdAt: { $gte: today },
    });

    const order = await OrderModel.create({
      orderNumber: orderCount + 1,
      items,
      type: type || "dine-in",
      subtotal,
      tax,
      total,
      paymentMethod,
      paymentStatus,
      paymentIntentId,
      customerName,
      notes,
      status: "pending",
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
