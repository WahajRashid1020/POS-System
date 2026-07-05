import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Browser-side Stripe.js loader.
 *
 * `loadStripe` is memoised into a single promise so the script is fetched
 * once for the whole session rather than on every payment. Only the
 * publishable key is used here — it is safe to ship to the client.
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = loadStripe(key ?? "");
  }
  return stripePromise;
}
