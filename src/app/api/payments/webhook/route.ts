import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/Order";
import { claimStripeEvent, releaseStripeEvent } from "@/lib/stripe-events";

// Stripe needs the raw, unparsed body to verify the signature.
export const runtime = "nodejs";

// POST /api/payments/webhook
// Source-of-truth confirmation from Stripe. Even if the browser closes right
// after paying, this reconciles the order's payment status.
//
// Stripe can deliver the same event more than once, so each event id is
// claimed before it is processed and a repeat is acknowledged without being
// processed again. If processing fails the claim is released and a 500 is
// returned, so Stripe's retry is processed instead of being skipped.
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

      if (!(await claimStripeEvent(event.id))) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      try {
        await OrderModel.updateOne(
          { paymentIntentId: intent.id },
          { $set: { paymentStatus: "paid" } },
        );
      } catch (error) {
        await releaseStripeEvent(event.id);
        throw error;
      }
    } catch (error) {
      console.error("Webhook DB reconciliation failed:", error);
      return NextResponse.json(
        { error: "Reconciliation failed" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true });
}
