import { describe, expect, it } from "vitest";
import { TAX_RATE, computeOrderTotals, toCents } from "./pricing";

describe("computeOrderTotals", () => {
  it("sums line totals and applies 9% VAT", () => {
    const totals = computeOrderTotals([
      { price: 10, quantity: 2 },
      { price: 5, quantity: 1 },
    ]);
    expect(totals.subtotal).toBe(25);
    expect(totals.tax).toBeCloseTo(2.25);
    expect(totals.total).toBeCloseTo(27.25);
  });

  it("returns zeros for an empty cart", () => {
    expect(computeOrderTotals([])).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });

  it("exposes a 9% tax rate", () => {
    expect(TAX_RATE).toBe(0.09);
  });
});

describe("toCents", () => {
  it("rounds a currency amount to integer minor units", () => {
    expect(toCents(27.25)).toBe(2725);
  });

  it("avoids floating point drift", () => {
    // 0.1 + 0.2 === 0.30000000000000004 in IEEE-754.
    expect(toCents(0.1 + 0.2)).toBe(30);
  });
});
