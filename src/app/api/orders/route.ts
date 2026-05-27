import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/Order";

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

    const body = await req.json();
    const { items, type, customerName, notes, paymentMethod } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Order must have at least one item" },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.09;
    const total = subtotal + tax;

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
