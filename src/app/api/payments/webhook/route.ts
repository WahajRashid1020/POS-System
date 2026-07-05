import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/Order";

// Stripe needs the raw, unparsed body to verify the signature.
export const runtime = "nodejs";

// POST /api/payments/webhook
// Source-of-truth confirmation from Stripe. Even if the browser closes right
// after paying, this reconciles the order's payment status. Idempotent: it
// only flips a matching order to "paid".
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");

  if (!secret || !signature) {
    return NextResponse.json(
      { error: "Webhook is not configured" },
      { status: 400 },
    );
  }

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    try {
      await connectDB();
      await OrderModel.updateOne(
        { paymentIntentId: intent.id },
        { $set: { paymentStatus: "paid" } },
      );
    } catch (error) {
      console.error("Webhook DB reconciliation failed:", error);
    }
  }

  return NextResponse.json({ received: true });
}
