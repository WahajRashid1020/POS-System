import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/Order";
import { getStripe } from "@/lib/stripe";
import { computeOrderTotals, toCents } from "@/lib/pricing";
import type { CreateOrderInput } from "@/types";

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
    await connectDB();

    const body = (await req.json()) as CreateOrderInput;
    const { items, type, customerName, notes, paymentMethod, paymentIntentId } =
      body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Order must have at least one item" },
        { status: 400 }
      );
    }

    // Totals are computed server-side from the submitted items — never trusted
    // from the client — so they always match what was (or will be) charged.
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
