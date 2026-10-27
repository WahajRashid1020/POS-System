import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  connectDB: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findById: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({ connectDB: mocks.connectDB }));
vi.mock("@/lib/models/Order", () => ({
  OrderModel: {
    findByIdAndUpdate: mocks.findByIdAndUpdate,
    findById: mocks.findById,
  },
}));

import { GET, PATCH } from "./route";
import { resetRateLimits } from "@/lib/rate-limit";

const VALID_ID = "507f1f77bcf86cd799439011";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function patchRequest(body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/orders/${VALID_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getRequest(): NextRequest {
  return new NextRequest(`http://localhost/api/orders/${VALID_ID}`);
}

const asGuest = () => mocks.getServerSession.mockResolvedValue(null);
const asRole = (role?: string) =>
  mocks.getServerSession.mockResolvedValue({ user: { role } });

beforeEach(() => {
  vi.resetAllMocks();
  resetRateLimits();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.findByIdAndUpdate.mockReturnValue({
    lean: () => Promise.resolve({ _id: VALID_ID, status: "preparing" }),
  });
  mocks.findById.mockReturnValue({
    lean: () => Promise.resolve({ _id: VALID_ID, status: "pending" }),
  });
});

describe("PATCH /api/orders/[id] — attack attempts", () => {
  it("rejects anonymous callers and never touches the database", async () => {
    asGuest();
    const res = await PATCH(patchRequest({ status: "completed" }), ctx(VALID_ID));

    expect(res.status).toBe(401);
    expect(mocks.connectDB).not.toHaveBeenCalled();
    expect(mocks.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("rejects a signed-in user with no recognised role", async () => {
    asRole(undefined);
    const res = await PATCH(patchRequest({ status: "ready" }), ctx(VALID_ID));

    expect(res.status).toBe(403);
    expect(mocks.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("blocks mass assignment: client cannot rewrite total or payment status", async () => {
    asRole("cashier");
    const res = await PATCH(
      patchRequest({ status: "ready", total: 0, paymentStatus: "paid" }),
      ctx(VALID_ID),
    );

    expect(res.status).toBe(400);
    expect(mocks.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("blocks Mongo operator injection in the body", async () => {
    asRole("cashier");
    const res = await PATCH(
      patchRequest({ status: "ready", $set: { total: 0 }, $inc: { tax: -5 } }),
      ctx(VALID_ID),
    );

    expect(res.status).toBe(400);
    expect(mocks.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("requires a status and rejects an unknown one", async () => {
    asRole("manager");

    const empty = await PATCH(patchRequest({}), ctx(VALID_ID));
    const bogus = await PATCH(patchRequest({ status: "refunded" }), ctx(VALID_ID));

    expect(empty.status).toBe(400);
    expect(bogus.status).toBe(400);
    expect(mocks.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("rejects a malformed order id with 400 instead of crashing", async () => {
    asRole("manager");
    const res = await PATCH(patchRequest({ status: "ready" }), ctx("not-an-id"));

    expect(res.status).toBe(400);
    expect(mocks.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("rejects a body that is not valid JSON", async () => {
    asRole("manager");
    const req = new NextRequest(`http://localhost/api/orders/${VALID_ID}`, {
      method: "PATCH",
      body: "{not json",
    });
    const res = await PATCH(req, ctx(VALID_ID));

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/orders/[id] — legitimate use still works", () => {
  it("lets the kitchen move an order forward, writing only the status", async () => {
    asRole("kitchen");
    const res = await PATCH(patchRequest({ status: "preparing" }), ctx(VALID_ID));

    expect(res.status).toBe(200);
    expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith(
      VALID_ID,
      { status: "preparing" },
      expect.objectContaining({ new: true }),
    );
  });

  it("stamps completedAt when an order is completed", async () => {
    asRole("cashier");
    await PATCH(patchRequest({ status: "completed" }), ctx(VALID_ID));

    expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith(
      VALID_ID,
      { status: "completed", completedAt: expect.any(Date) },
      expect.objectContaining({ new: true }),
    );
  });

  it("returns 404 when the order does not exist", async () => {
    asRole("admin");
    mocks.findByIdAndUpdate.mockReturnValue({ lean: () => Promise.resolve(null) });
    const res = await PATCH(patchRequest({ status: "ready" }), ctx(VALID_ID));

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/orders/[id] — abuse protection and response trimming", () => {
  it("blocks a cross-site write before touching auth or the database", async () => {
    asRole("cashier");
    const req = new NextRequest(`http://localhost/api/orders/${VALID_ID}`, {
      method: "PATCH",
      headers: { "sec-fetch-site": "cross-site" },
      body: JSON.stringify({ status: "ready" }),
    });
    const res = await PATCH(req, ctx(VALID_ID));

    expect(res.status).toBe(403);
    expect(mocks.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("rate limits a user after 120 updates a minute", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: { role: "kitchen", email: "k@example.com" },
    });

    for (let i = 0; i < 120; i++) {
      await PATCH(patchRequest({ status: "preparing" }), ctx(VALID_ID));
    }
    const res = await PATCH(patchRequest({ status: "preparing" }), ctx(VALID_ID));

    expect(res.status).toBe(429);
  });

  it("keeps internal fields out of the response", async () => {
    asRole("cashier");
    await PATCH(patchRequest({ status: "ready" }), ctx(VALID_ID));

    expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith(
      VALID_ID,
      expect.anything(),
      expect.objectContaining({ projection: { __v: 0, paymentIntentId: 0 } }),
    );
  });
});

describe("GET /api/orders/[id]", () => {
  it("does not leak order details to anonymous callers", async () => {
    asGuest();
    const res = await GET(getRequest(), ctx(VALID_ID));

    expect(res.status).toBe(401);
    expect(mocks.findById).not.toHaveBeenCalled();
  });

  it("rejects a malformed id with 400", async () => {
    asRole("cashier");
    const res = await GET(getRequest(), ctx("../../etc/passwd"));

    expect(res.status).toBe(400);
    expect(mocks.findById).not.toHaveBeenCalled();
  });

  it("returns the order to a signed-in staff member", async () => {
    asRole("cashier");
    const res = await GET(getRequest(), ctx(VALID_ID));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      order: { _id: VALID_ID, status: "pending" },
    });
  });
});
