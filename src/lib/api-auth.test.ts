import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getServerSession: vi.fn() }));

vi.mock("next-auth", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

import { requireRole } from "./api-auth";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("requireRole", () => {
  it("returns 401 when there is no session", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const result = await requireRole(["admin"]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("returns 403 when the role is not allowed", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { role: "cashier" } });
    const result = await requireRole(["admin", "manager"]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it("returns 403 when the session has no role at all", async () => {
    mocks.getServerSession.mockResolvedValue({ user: {} });
    const result = await requireRole(["admin"]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it("returns the role when it is allowed", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { role: "manager" } });
    const result = await requireRole(["admin", "manager"]);

    expect(result).toEqual({ ok: true, role: "manager" });
  });
});
