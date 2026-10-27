import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  connectDB: vi.fn(),
  find: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({ connectDB: mocks.connectDB }));
vi.mock("@/lib/models/Order", () => ({ OrderModel: { find: mocks.find } }));

import { GET } from "./route";

const request = () => new NextRequest("http://localhost/api/reports?range=week");
const asRole = (role: string) =>
  mocks.getServerSession.mockResolvedValue({ user: { role } });

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.find.mockReturnValue({
    sort: () => ({ lean: () => Promise.resolve([]) }),
  });
});

describe("GET /api/reports", () => {
  it("does not expose sales figures to anonymous callers", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const res = await GET(request());

    expect(res.status).toBe(401);
    expect(mocks.connectDB).not.toHaveBeenCalled();
    expect(mocks.find).not.toHaveBeenCalled();
  });

  it.each(["cashier", "kitchen"])("forbids the %s role", async (role) => {
    asRole(role);
    const res = await GET(request());

    expect(res.status).toBe(403);
    expect(mocks.find).not.toHaveBeenCalled();
  });

  it.each(["admin", "manager"])("serves reports to a %s", async (role) => {
    asRole(role);
    const res = await GET(request());

    expect(res.status).toBe(200);
    expect(mocks.find).toHaveBeenCalled();
  });
});
