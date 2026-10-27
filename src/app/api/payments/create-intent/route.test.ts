import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ paymentIntents: { create: mocks.create } }),
}));

import { POST } from "./route";

function line(name: string, quantity: unknown, price: unknown) {
  return { menuItem: { name, price, category: "x" }, quantity, price };
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/payments/create-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.create.mockResolvedValue({ client_secret: "secret_abc" });
});

describe("POST /api/payments/create-intent — attacks", () => {
  it("charges the menu price even when the client sends a 1-cent price", async () => {
    const res = await POST(postRequest({ items: [line("Small Chips", 2, 0.01)] }));

    expect(res.status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 545, currency: "eur" }),
    );
    expect(await res.json()).toEqual({ clientSecret: "secret_abc", amount: 545 });
  });

  it("ignores a negative client price", async () => {
    await POST(postRequest({ items: [line("Small Chips", 2, -1000)] }));

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 545 }),
    );
  });

  it("refuses an item that is not on the menu", async () => {
    const res = await POST(postRequest({ items: [line("Free Lobster", 1, 0.01)] }));

    expect(res.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each([0, -3, 2.5, 100, 1e9, "2"])(
    "refuses an invalid quantity (%j)",
    async (quantity) => {
      const res = await POST(postRequest({ items: [line("Coke", quantity, 1.8)] }));

      expect(res.status).toBe(400);
      expect(mocks.create).not.toHaveBeenCalled();
    },
  );

  it("refuses an oversized cart", async () => {
    const items = Array.from({ length: 51 }, () => line("Coke", 1, 1.8));
    const res = await POST(postRequest({ items }));

    expect(res.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("refuses an empty or missing cart", async () => {
    const empty = await POST(postRequest({ items: [] }));
    const missing = await POST(postRequest({}));

    expect(empty.status).toBe(400);
    expect(missing.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("answers 400, not 500, for a body that is not valid JSON", async () => {
    const res = await POST(postRequest("{not json"));

    expect(res.status).toBe(400);
  });
});

describe("POST /api/payments/create-intent — legitimate use still works", () => {
  it("opens a card-only euro intent for the menu total", async () => {
    const res = await POST(
      postRequest({ items: [line("Classic Burger", 2, 5.5), line("Coke", 1, 1.8)] }),
    );

    expect(res.status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1395,
        currency: "eur",
        payment_method_types: ["card"],
      }),
    );
  });
});
