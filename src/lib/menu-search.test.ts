import { describe, expect, it } from "vitest";
import { filterMenuItems } from "./menu-search";

const items = [
  { name: "Classic Burger", category: "burgers", isAvailable: true },
  { name: "Cheese Burger", category: "burgers", isAvailable: true },
  { name: "Curry Chips", category: "chips-sides", isAvailable: true },
  { name: "Small Chips", category: "chips-sides", isAvailable: true },
  { name: "Sold Out Special", category: "burgers", isAvailable: false },
];

describe("filterMenuItems", () => {
  it("returns items for the active category when the query is empty", () => {
    const result = filterMenuItems(items, "burgers", "");
    expect(result.map((i) => i.name)).toEqual(["Classic Burger", "Cheese Burger"]);
  });

  it("treats a whitespace-only query as empty (category behaviour)", () => {
    const result = filterMenuItems(items, "chips-sides", "   ");
    expect(result.map((i) => i.name)).toEqual(["Curry Chips", "Small Chips"]);
  });

  it("searches by name across all categories when a query is given", () => {
    const result = filterMenuItems(items, "burgers", "chips");
    expect(result.map((i) => i.name)).toEqual(["Curry Chips", "Small Chips"]);
  });

  it("matches partial, case-insensitive names", () => {
    const result = filterMenuItems(items, "burgers", "BuRg");
    expect(result.map((i) => i.name)).toEqual(["Classic Burger", "Cheese Burger"]);
  });

  it("never returns unavailable items, even on a matching search", () => {
    const result = filterMenuItems(items, "burgers", "special");
    expect(result).toEqual([]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterMenuItems(items, "burgers", "pizza")).toEqual([]);
  });
});
