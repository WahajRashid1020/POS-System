import { describe, expect, it } from "vitest";
import { MAX_LINE_ITEMS, MAX_QUANTITY, priceOrderItems } from "./catalog";
import { SEED_MENU_ITEMS } from "./seed-data";

describe("menu data integrity (pricing depends on it)", () => {
  it("has unique item names, since orders are priced by name", () => {
    const names = SEED_MENU_ITEMS.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("has a positive price with at most 2 decimals for every item", () => {
    for (const item of SEED_MENU_ITEMS) {
      expect(item.price, item.name).toBeGreaterThan(0);
      expect(Math.round(item.price * 100) / 100, item.name).toBe(item.price);
    }
  });
});

describe("priceOrderItems", () => {
  it("replaces client prices and categories with the menu's", () => {
    const result = priceOrderItems([
      {
        menuItem: { name: "Classic Burger", price: 0.01, category: "extras" },
        quantity: 2,
        price: 0.01,
      },
    ]);

    expect(result).toEqual({
      ok: true,
      items: [
        {
          menuItem: { name: "Classic Burger", price: 5.5, category: "burgers" },
          quantity: 2,
          price: 5.5,
        },
      ],
    });
  });

  it("keeps a trimmed note and drops an empty one", () => {
    const result = priceOrderItems([
      { menuItem: { name: "Coke" }, quantity: 1, notes: "  no ice  " },
      { menuItem: { name: "Water" }, quantity: 1, notes: "   " },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items[0].notes).toBe("no ice");
      expect(result.items[1]).not.toHaveProperty("notes");
    }
  });

  it("rejects a missing, empty or non-array cart", () => {
    for (const bad of [undefined, null, [], {}, "Coke", 5]) {
      expect(priceOrderItems(bad).ok, JSON.stringify(bad)).toBe(false);
    }
  });

  it("rejects an item that is not on the menu", () => {
    expect(
      priceOrderItems([{ menuItem: { name: "Free Lobster" }, quantity: 1 }]).ok,
    ).toBe(false);
  });

  it("rejects out-of-range or non-integer quantities", () => {
    for (const quantity of [0, -1, 1.5, MAX_QUANTITY + 1, "2", null]) {
      const result = priceOrderItems([{ menuItem: { name: "Coke" }, quantity }]);
      expect(result.ok, String(quantity)).toBe(false);
    }
  });

  it("accepts the largest allowed cart and rejects one line more", () => {
    const line = { menuItem: { name: "Coke" }, quantity: 1 };

    expect(priceOrderItems(Array(MAX_LINE_ITEMS).fill(line)).ok).toBe(true);
    expect(priceOrderItems(Array(MAX_LINE_ITEMS + 1).fill(line)).ok).toBe(false);
  });
});
