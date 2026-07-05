/**
 * Single source of truth for order money math.
 *
 * Both the server (order creation, payment-intent amount) and the client
 * (cart display, payment modal) import from here so a total can never drift
 * between what the customer is shown and what the card is charged.
 */

export const TAX_RATE = 0.09;

export interface OrderTotals {
  subtotal: number;
  tax: number;
  total: number;
}

/** Line items only need a price and quantity to be totalled. */
export interface Priceable {
  price: number;
  quantity: number;
}

export function computeOrderTotals(items: Priceable[]): OrderTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = subtotal * TAX_RATE;
  return { subtotal, tax, total: subtotal + tax };
}

/** Convert a currency amount to integer minor units (cents) for Stripe. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}
