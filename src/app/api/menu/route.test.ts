import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  connectDB: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({ connectDB: mocks.connectDB }));
vi.mock("@/lib/models/MenuItem", () => ({
  MenuItemModel: { find: mocks.find, create: mocks.create },
}));

import { GET, POST } from "./route";
import { resetRateLimits } from "@/lib/rate-limit";

const VALID_ITEM = { name: "Onion Bhaji", price: 3.5, category: "extras" };

function postRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/menu", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const getRequest = (query = "") => new NextRequest(`http://localhost/api/menu${query}`);
const asGuest = () => mocks.getServerSession.mockResolvedValue(null);
const asRole = (role: string) =>
  mocks.getServerSession.mockResolvedValue({ user: { role, email: `${role}@x.com` } });

beforeEach(() => {
  vi.resetAllMocks();
  resetRateLimits();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.find.mockReturnValue({
    sort: () => ({ lean: () => Promise.resolve([{ name: "Coke" }]) }),
  });
  mocks.create.mockImplementation(async (doc: object) => ({ ...doc, _id: "m1" }));
});

describe("GET /api/menu", () => {
  it("rejects anonymous callers", async () => {
    asGuest();
    const res = await GET(getRequest());

    expect(res.status).toBe(401);
    expect(mocks.find).not.toHaveBeenCalled();
  });

  it("lists available items for staff", async () => {
    asRole("cashier");
    const res = await GET(getRequest("?category=drinks"));

    expect(res.status).toBe(200);
    expect(mocks.find).toHaveBeenCalledWith({ category: "drinks", isAvailable: true });
  });

  it("rejects an oversized category filter", async () => {
    asRole("cashier");
    const res = await GET(getRequest(`?category=${"a".repeat(200)}`));

    expect(res.status).toBe(400);
    expect(mocks.find).not.toHaveBeenCalled();
  });
});

describe("POST /api/menu — attacks", () => {
  it("rejects anonymous callers", async () => {
    asGuest();
    const res = await POST(postRequest(VALID_ITEM));

    expect(res.status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each(["cashier", "kitchen"])("forbids the %s role", async (role) => {
    asRole(role);
    const res = await POST(postRequest(VALID_ITEM));

    expect(res.status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("blocks mass assignment of fields outside the whitelist", async () => {
    asRole("manager");
    const res = await POST(
      postRequest({ ...VALID_ITEM, _id: "attacker", createdAt: "2000-01-01", $set: { x: 1 } }),
    );

    expect(res.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each([
    { ...VALID_ITEM, price: -1 },
    { ...VALID_ITEM, price: 0 },
    { ...VALID_ITEM, price: "free" },
    { ...VALID_ITEM, price: 1e9 },
    { ...VALID_ITEM, name: "" },
    { ...VALID_ITEM, name: "x".repeat(500) },
    { ...VALID_ITEM, image: "javascript:alert(1)" },
    { ...VALID_ITEM, image: "http://insecure.example/a.png" },
    { ...VALID_ITEM, tags: Array(50).fill("t") },
  ])("rejects invalid field values %j", async (payload) => {
    asRole("admin");
    const res = await POST(postRequest(payload));

    expect(res.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects a body that is not valid JSON", async () => {
    asRole("admin");
    expect((await POST(postRequest("{not json"))).status).toBe(400);
  });

  it("blocks a cross-site write", async () => {
    asRole("admin");
    const res = await POST(postRequest(VALID_ITEM, { "sec-fetch-site": "cross-site" }));

    expect(res.status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rate limits creation to 20 a minute", async () => {
    asRole("admin");
    for (let i = 0; i < 20; i++) await POST(postRequest(VALID_ITEM));

    expect((await POST(postRequest(VALID_ITEM))).status).toBe(429);
    expect(mocks.create).toHaveBeenCalledTimes(20);
  });
});

describe("POST /api/menu — legitimate use", () => {
  it.each(["admin", "manager"])("lets a %s add a valid item", async (role) => {
    asRole(role);
    const res = await POST(
      postRequest({ ...VALID_ITEM, tags: ["new"], preparationTime: 5, isAvailable: true }),
    );

    expect(res.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith({
      ...VALID_ITEM,
      tags: ["new"],
      preparationTime: 5,
      isAvailable: true,
    });
  });
});
