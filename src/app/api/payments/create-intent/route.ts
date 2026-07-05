import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { computeOrderTotals, toCents } from "@/lib/pricing";
import type { CreateOrderItemInput } from "@/types";

// POST /api/payments/create-intent
// Creates a Stripe PaymentIntent for the current cart. The amount is computed
// on the server from the submitted items — the client never dictates the price.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = (body?.items ?? []) as CreateOrderItemInput[];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must have at least one item" },
        { status: 400 },
      );
    }

    const { total } = computeOrderTotals(items);
    const amount = toCents(total);

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Invalid order amount" },
        { status: 400 },
      );
    }

    const intent = await getStripe().paymentIntents.create({
      amount,
      currency: "eur",
      // Card-only keeps the flow redirect-free (no return_url needed).
      payment_method_types: ["card"],
      metadata: { source: "quickserve-pos" },
    });

    return NextResponse.json({ clientSecret: intent.client_secret, amount });
  } catch (error) {
    console.error("POST /api/payments/create-intent error:", error);
    return NextResponse.json(
      { error: "Failed to initialise payment" },
      { status: 500 },
    );
  }
}
