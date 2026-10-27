type OrderLike = Record<string, unknown> & { toJSON?: () => Record<string, unknown> };

/** Fields the screens never use; kept out of API responses. */
const INTERNAL_FIELDS = ["__v", "paymentIntentId"] as const;

/** Plain-object copy of an order without internal fields. */
export function toPublicOrder(order: OrderLike): Record<string, unknown> {
  const plain: Record<string, unknown> =
    typeof order.toJSON === "function" ? { ...order.toJSON() } : { ...order };

  for (const field of INTERNAL_FIELDS) delete plain[field];
  return plain;
}
