import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  connectDB: vi.fn(),
  countDocuments: vi.fn(),
  create: vi.fn(),
  exists: vi.fn(),
  find: vi.fn(),
  retrieve: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({ connectDB: mocks.connectDB }));
vi.mock("@/lib/models/Order", () => ({
  OrderModel: {
    countDocuments: mocks.countDocuments,
    create: mocks.create,
    exists: mocks.exists,
    find: mocks.find,
  },
}));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ paymentIntents: { retrieve: mocks.retrieve } }),
}));

import { GET, POST } from "./route";
import { resetRateLimits } from "@/lib/rate-limit";

interface SavedOrder {
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: string;
  paymentIntentId?: string;
  items: {
    price: number;
    quantity: number;
    menuItem: { name: string; price: number; category: string };
  }[];
}

function line(name: string, quantity: unknown, price: unknown, category = "x") {
  return { menuItem: { name, price, category }, quantity, price };
}

function postRequest(
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest("http://localhost/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const savedOrder = () => mocks.create.mock.calls[0][0] as SavedOrder;
const asRole = (role: string) =>
  mocks.getServerSession.mockResolvedValue({
    user: { role, email: `${role}@example.com` },
  });

beforeEach(() => {
  vi.resetAllMocks();
  resetRateLimits();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  asRole("cashier");
  mocks.countDocuments.mockResolvedValue(0);
  mocks.exists.mockResolvedValue(null);
  mocks.create.mockImplementation(async (doc: object) => ({ ...doc, _id: "o1" }));
});

describe("POST /api/orders — price tampering attacks", () => {
  it("ignores a client price and charges the menu price", async () => {
    const res = await POST(
      postRequest({
        items: [line("Classic Burger", 1, 0.01, "burgers")],
        paymentMethod: "cash",
      }),
    );

    expect(res.status).toBe(201);
    const saved = savedOrder();
    expect(saved.subtotal).toBeCloseTo(5.5, 5);
    expect(saved.total).toBeCloseTo(5.995, 5);
    expect(saved.items[0].price).toBe(5.5);
    expect(saved.items[0].menuItem.price).toBe(5.5);
  });

  it("ignores a negative client price", async () => {
    await POST(
      postRequest({
        items: [line("Coke", 1, -100, "drinks"), line("Coke", 1, -100, "drinks")],
        paymentMethod: "cash",
      }),
    );

    expect(savedOrder().subtotal).toBeCloseTo(3.6, 5);
  });

  it("stores the menu's category, not one the client invented", async () => {
    await POST(
      postRequest({
        items: [line("Classic Burger", 1, 5.5, "extras")],
        paymentMethod: "cash",
      }),
    );

    expect(savedOrder().items[0].menuItem.category).toBe("burgers");
  });

  it("rejects an item that is not on the menu", async () => {
    const res = await POST(
      postRequest({ items: [line("Free Lobster", 1, 0)], paymentMethod: "cash" }),
    );

    expect(res.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each([0, -5, 1.5, 100, 1e9, "2", null])(
    "rejects an invalid quantity (%j)",
    async (quantity) => {
      const res = await POST(
        postRequest({
          items: [line("Coke", quantity, 1.8, "drinks")],
          paymentMethod: "cash",
        }),
      );

      expect(res.status).toBe(400);
      expect(mocks.create).not.toHaveBeenCalled();
    },
  );

  it("rejects an oversized cart", async () => {
    const items = Array.from({ length: 51 }, () => line("Coke", 1, 1.8));
    const res = await POST(postRequest({ items, paymentMethod: "cash" }));

    expect(res.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects an empty or missing cart", async () => {
    const empty = await POST(postRequest({ items: [], paymentMethod: "cash" }));
    const missing = await POST(postRequest({ paymentMethod: "cash" }));

    expect(empty.status).toBe(400);
    expect(missing.status).toBe(400);
  });
});

describe("POST /api/orders — card payment attacks", () => {
  it("refuses a 2-cent payment used to buy a real cart with a faked price", async () => {
    mocks.retrieve.mockResolvedValue({
      status: "succeeded",
      currency: "eur",
      amount: 2,
    });
    const res = await POST(
      postRequest({
        items: [line("Small Chips", 2, 0.01, "chips-sides")],
        paymentMethod: "card",
        paymentIntentId: "pi_cheap123",
      }),
    );

    expect(res.status).toBe(402);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("refuses to reuse one payment for a second order", async () => {
    mocks.retrieve.mockResolvedValue({
      status: "succeeded",
      currency: "eur",
      amount: 545,
    });
    mocks.exists.mockResolvedValue({ _id: "earlier-order" });
    const res = await POST(
      postRequest({
        items: [line("Small Chips", 2, 2.5, "chips-sides")],
        paymentMethod: "card",
        paymentIntentId: "pi_used123",
      }),
    );

    expect(res.status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects a malformed payment reference before calling Stripe", async () => {
    const res = await POST(
      postRequest({
        items: [line("Coke", 1, 1.8)],
        paymentMethod: "card",
        paymentIntentId: "../not-a-payment-intent",
      }),
    );

    expect(res.status).toBe(400);
    expect(mocks.retrieve).not.toHaveBeenCalled();
  });

  it("requires a payment reference for card orders", async () => {
    const res = await POST(
      postRequest({ items: [line("Coke", 1, 1.8)], paymentMethod: "card" }),
    );

    expect(res.status).toBe(400);
    expect(mocks.retrieve).not.toHaveBeenCalled();
  });
});

describe("POST /api/orders — other input abuse", () => {
  it("rejects an unknown order type", async () => {
    const res = await POST(
      postRequest({
        items: [line("Coke", 1, 1.8)],
        paymentMethod: "cash",
        type: "teleport",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("rejects a huge customer name", async () => {
    const res = await POST(
      postRequest({
        items: [line("Coke", 1, 1.8)],
        paymentMethod: "cash",
        customerName: "x".repeat(10_000),
      }),
    );

    expect(res.status).toBe(400);
  });

  it("rejects a body that is not valid JSON", async () => {
    const res = await POST(postRequest("{not json"));

    expect(res.status).toBe(400);
  });
});

describe("POST /api/orders — legitimate use still works", () => {
  it("prices a cash order from the menu and numbers it sequentially", async () => {
    mocks.countDocuments.mockResolvedValue(6);
    const res = await POST(
      postRequest({
        items: [
          line("Classic Burger", 2, 5.5, "burgers"),
          line("Coke", 1, 1.8, "drinks"),
        ],
        type: "takeaway",
        paymentMethod: "cash",
      }),
    );

    expect(res.status).toBe(201);
    const saved = savedOrder() as SavedOrder & { orderNumber: number; type: string };
    expect(saved.subtotal).toBeCloseTo(12.8, 5);
    expect(saved.total).toBeCloseTo(12.8 * 1.09, 5);
    expect(saved.paymentStatus).toBe("paid");
    expect(saved.orderNumber).toBe(7);
    expect(saved.type).toBe("takeaway");
  });

  it("accepts a card order whose payment matches the menu total", async () => {
    mocks.retrieve.mockResolvedValue({
      status: "succeeded",
      currency: "eur",
      amount: 545,
    });
    const res = await POST(
      postRequest({
        items: [line("Small Chips", 2, 2.5, "chips-sides")],
        paymentMethod: "card",
        paymentIntentId: "pi_good123",
      }),
    );

    expect(res.status).toBe(201);
    expect(mocks.retrieve).toHaveBeenCalledWith("pi_good123");
    expect(savedOrder().paymentStatus).toBe("paid");
    expect(savedOrder().paymentIntentId).toBe("pi_good123");
  });

  it("refuses a card order whose payment did not succeed", async () => {
    mocks.retrieve.mockResolvedValue({
      status: "requires_payment_method",
      currency: "eur",
      amount: 545,
    });
    const res = await POST(
      postRequest({
        items: [line("Small Chips", 2, 2.5, "chips-sides")],
        paymentMethod: "card",
        paymentIntentId: "pi_unpaid123",
      }),
    );

    expect(res.status).toBe(402);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/orders — access control and abuse protection", () => {
  const cashOrder = () =>
    postRequest({ items: [line("Coke", 1, 1.8)], paymentMethod: "cash" });

  it("rejects anonymous callers before touching the database", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const res = await POST(cashOrder());

    expect(res.status).toBe(401);
    expect(mocks.connectDB).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("forbids the kitchen role from creating orders", async () => {
    asRole("kitchen");
    const res = await POST(cashOrder());

    expect(res.status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each(["admin", "manager", "cashier"])("lets a %s create an order", async (role) => {
    asRole(role);
    expect((await POST(cashOrder())).status).toBe(201);
  });

  it("blocks a cross-site request", async () => {
    const res = await POST(
      postRequest(
        { items: [line("Coke", 1, 1.8)], paymentMethod: "cash" },
        { "sec-fetch-site": "cross-site" },
      ),
    );

    expect(res.status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rate limits order creation to 30 a minute", async () => {
    for (let i = 0; i < 30; i++) await POST(cashOrder());
    const res = await POST(cashOrder());

    expect(res.status).toBe(429);
    expect(mocks.create).toHaveBeenCalledTimes(30);
  });

  it("does not return the Stripe payment reference or internal fields", async () => {
    mocks.retrieve.mockResolvedValue({ status: "succeeded", currency: "eur", amount: 545 });
    mocks.create.mockImplementation(async (doc: object) => ({
      ...doc,
      _id: "o1",
      __v: 0,
    }));
    const res = await POST(
      postRequest({
        items: [line("Small Chips", 2, 2.5, "chips-sides")],
        paymentMethod: "card",
        paymentIntentId: "pi_good123",
      }),
    );
    const { order } = await res.json();

    expect(res.status).toBe(201);
    expect(order).not.toHaveProperty("paymentIntentId");
    expect(order).not.toHaveProperty("__v");
    expect(order.orderNumber).toBe(1);
  });
});

describe("GET /api/orders", () => {
  const limitSpy = vi.fn();
  const listRequest = (query = "") => new NextRequest(`http://localhost/api/orders${query}`);

  beforeEach(() => {
    limitSpy.mockReset();
    limitSpy.mockReturnValue({ lean: () => Promise.resolve([{ _id: "o1" }]) });
    mocks.find.mockReturnValue({ sort: () => ({ limit: limitSpy }) });
  });

  it("rejects anonymous callers", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const res = await GET(listRequest());

    expect(res.status).toBe(401);
    expect(mocks.find).not.toHaveBeenCalled();
  });

  it.each(["admin", "manager", "cashier", "kitchen"])("lets a %s read orders", async (role) => {
    asRole(role);
    expect((await GET(listRequest())).status).toBe(200);
  });

  it("defaults to 50 orders and hides internal fields", async () => {
    await GET(listRequest());

    expect(mocks.find).toHaveBeenCalledWith({}, { __v: 0, paymentIntentId: 0 });
    expect(limitSpy).toHaveBeenCalledWith(50);
  });

  it("passes a valid limit and status filter through", async () => {
    await GET(listRequest("?limit=20&status=pending"));

    expect(mocks.find).toHaveBeenCalledWith(
      { status: "pending" },
      { __v: 0, paymentIntentId: 0 },
    );
    expect(limitSpy).toHaveBeenCalledWith(20);
  });

  it.each(["?limit=abc", "?limit=0", "?limit=-5", "?limit=100000", "?limit=1.5", "?status=bogus"])(
    "rejects the abusive query %s",
    async (query) => {
      const res = await GET(listRequest(query));

      expect(res.status).toBe(400);
      expect(mocks.find).not.toHaveBeenCalled();
    },
  );

  it("never lets a Mongo operator in the query string reach the database", async () => {
    const res = await GET(listRequest("?status[$ne]=pending&limit[$gt]=0"));

    expect(res.status).toBe(200);
    expect(mocks.find).toHaveBeenCalledWith({}, { __v: 0, paymentIntentId: 0 });
    expect(limitSpy).toHaveBeenCalledWith(50);
  });

  it("rate limits listing to 120 a minute", async () => {
    for (let i = 0; i < 120; i++) await GET(listRequest());

    expect((await GET(listRequest())).status).toBe(429);
  });
});

describe("POST /api/orders — simultaneous requests with the same payment", () => {
  const cardOrder = () =>
    postRequest({
      items: [line("Small Chips", 2, 2.5, "chips-sides")],
      paymentMethod: "card",
      paymentIntentId: "pi_race123",
    });

  beforeEach(() => {
    mocks.retrieve.mockResolvedValue({ status: "succeeded", currency: "eur", amount: 545 });
  });

  it("answers 409 when the unique index rejects the second order", async () => {
    mocks.create.mockRejectedValue(
      Object.assign(new Error("E11000 duplicate key error"), { code: 11000 }),
    );
    const res = await POST(cardOrder());

    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/already been used/i);
  });

  it("gives the same 409 as the early check, so callers see one behaviour", async () => {
    mocks.exists.mockResolvedValue({ _id: "earlier" });
    const early = await POST(cardOrder());

    mocks.exists.mockResolvedValue(null);
    mocks.create.mockRejectedValue(Object.assign(new Error("dup"), { code: 11000 }));
    const raced = await POST(cardOrder());

    expect(early.status).toBe(409);
    expect(raced.status).toBe(409);
    expect((await raced.json()).error).toBe((await early.json()).error);
  });

  it("still reports other database errors as 500", async () => {
    mocks.create.mockRejectedValue(new Error("connection lost"));
    const res = await POST(cardOrder());

    expect(res.status).toBe(500);
  });
});
