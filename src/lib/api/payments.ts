import type { CreateOrderItemInput } from "@/types";
import { apiMutate } from "./client";

export interface CreatePaymentIntentResponse {
  /** Stripe client secret used to confirm the payment in the browser. */
  clientSecret: string;
  /** Amount in minor units (cents) the server will charge. */
  amount: number;
}

/**
 * Ask the server to open a Stripe PaymentIntent for the given cart items.
 * The server recomputes the amount; the client only supplies the items.
 */
export async function createPaymentIntent(
  items: CreateOrderItemInput[],
): Promise<CreatePaymentIntentResponse> {
  return apiMutate<CreatePaymentIntentResponse>(
    "/api/payments/create-intent",
    "POST",
    { items },
    "Failed to initialise payment",
  );
}
