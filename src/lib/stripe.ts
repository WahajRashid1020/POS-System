import Stripe from "stripe";

/**
 * Lazily-initialised server-side Stripe client.
 *
 * Initialising on first use (rather than at module load) keeps `next build`
 * from throwing when the secret key isn't present in the build environment.
 * The secret key must never be exposed to the browser.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set in the environment");
    }
    client = new Stripe(key);
  }
  return client;
}
