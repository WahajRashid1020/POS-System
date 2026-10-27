import { z } from "zod";
import { SEED_MENU_ITEMS } from "@/lib/seed-data";

export const MAX_LINE_ITEMS = 50;
export const MAX_QUANTITY = 99;

/**
 * What a client is allowed to say about a cart line: which item, how many, and
 * a note. Anything else it sends (price, category, ...) is stripped by the
 * schema, so a tampered price never reaches the money math.
 */
const requestedLineSchema = z.object({
  menuItem: z.object({ name: z.string().min(1).max(100) }),
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
  notes: z.string().trim().max(200).optional(),
});

const requestedItemsSchema = z
  .array(requestedLineSchema)
  .min(1)
  .max(MAX_LINE_ITEMS);

export interface PricedOrderItem {
  menuItem: { name: string; price: number; category: string };
  quantity: number;
  price: number;
  notes?: string;
}

export type PricingResult =
  | { ok: true; items: PricedOrderItem[] }
  | { ok: false; error: string };

const CATALOG = new Map(SEED_MENU_ITEMS.map((item) => [item.name, item]));

/**
 * Turns an untrusted cart into priced order lines. Every price and category
 * comes from the server-side menu, looked up by item name.
 */
export function priceOrderItems(raw: unknown): PricingResult {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: "Order must have at least one item" };
  }

  const parsed = requestedItemsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: `Invalid order items (max ${MAX_LINE_ITEMS} lines, quantity 1-${MAX_QUANTITY})`,
    };
  }

  const items: PricedOrderItem[] = [];
  for (const line of parsed.data) {
    const entry = CATALOG.get(line.menuItem.name);
    if (!entry || !entry.isAvailable) {
      return { ok: false, error: "An item in the order is not on the menu" };
    }

    items.push({
      menuItem: {
        name: entry.name,
        price: entry.price,
        category: entry.category,
      },
      quantity: line.quantity,
      price: entry.price,
      ...(line.notes ? { notes: line.notes } : {}),
    });
  }

  return { ok: true, items };
}
