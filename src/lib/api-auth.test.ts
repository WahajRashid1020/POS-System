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

  it("returns the role and a user key when it is allowed", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: { role: "manager", email: "m@example.com" },
    });
    const result = await requireRole(["admin", "manager"]);

    expect(result).toEqual({ ok: true, role: "manager", userId: "m@example.com" });
  });

  it("logs auth failures without any personal data", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    mocks.getServerSession.mockResolvedValue(null);
    await requireRole(["admin"], "POST /api/test");
    mocks.getServerSession.mockResolvedValue({
      user: { role: "cashier", email: "secret@example.com" },
    });
    await requireRole(["admin"], "POST /api/test");

    const lines = warn.mock.calls.map((c) => String(c[0]));
    expect(lines[0]).toContain('"event":"auth.unauthenticated"');
    expect(lines[1]).toContain('"event":"auth.forbidden"');
    expect(lines[1]).toContain('"role":"cashier"');
    expect(lines.join("")).not.toContain("secret@example.com");
    warn.mockRestore();
  });
});
