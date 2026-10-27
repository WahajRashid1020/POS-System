import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { computeOrderTotals, toCents } from "@/lib/pricing";
import { priceOrderItems } from "@/lib/catalog";

// POST /api/payments/create-intent
// Creates a Stripe PaymentIntent for the current cart. The client only says
// which items and how many; every price comes from the server-side menu.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawItems =
    typeof body === "object" && body !== null && "items" in body
      ? body.items
      : undefined;

  const priced = priceOrderItems(rawItems);
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error }, { status: 400 });
  }

  try {
    const { total } = computeOrderTotals(priced.items);
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
