import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { computeOrderTotals, toCents } from "@/lib/pricing";
import { priceOrderItems } from "@/lib/catalog";
import { requireRole } from "@/lib/api-auth";
import { rejectCrossOrigin } from "@/lib/csrf";
import { enforceRateLimit } from "@/lib/rate-limit";

const ROUTE = "POST /api/payments/create-intent";

// POST /api/payments/create-intent
// Creates a Stripe PaymentIntent for the current cart. The client only says
// which items and how many; every price comes from the server-side menu.
export async function POST(req: NextRequest) {
  const crossOrigin = rejectCrossOrigin(req, ROUTE);
  if (crossOrigin) return crossOrigin;

  // Same roles that can take an order at the POS.
  const auth = await requireRole(["admin", "manager", "cashier"], ROUTE);
  if (!auth.ok) return auth.response;

  // Each call creates an object in Stripe, so keep it well below order volume.
  const limited = enforceRateLimit(req, "create-intent", {
    limit: 30,
    windowMs: 60_000,
    userId: auth.userId,
  });
  if (limited) return limited;

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
