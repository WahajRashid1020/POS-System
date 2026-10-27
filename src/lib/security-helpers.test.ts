import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { checkRateLimit, enforceRateLimit, resetRateLimits } from "./rate-limit";
import { rejectCrossOrigin } from "./csrf";

function request(method: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("https://pos.example.com/api/thing", { method, headers });
}

beforeEach(() => {
  resetRateLimits();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("checkRateLimit", () => {
  it("allows up to the limit, then blocks with a retry time", () => {
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("k", 3, 60_000, t).allowed).toBe(true);
    }
    const blocked = checkRateLimit("k", 3, 60_000, t + 1_000);

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(59);
  });

  it("starts a fresh window once the old one expires", () => {
    const t = 1_000_000;
    for (let i = 0; i < 4; i++) checkRateLimit("k", 3, 60_000, t);

    expect(checkRateLimit("k", 3, 60_000, t + 60_001).allowed).toBe(true);
  });

  it("tracks different keys separately", () => {
    checkRateLimit("a", 1, 60_000, 1);
    expect(checkRateLimit("a", 1, 60_000, 2).allowed).toBe(false);
    expect(checkRateLimit("b", 1, 60_000, 2).allowed).toBe(true);
  });
});

describe("enforceRateLimit", () => {
  it("returns null under the limit and a 429 with Retry-After over it", async () => {
    const opts = { limit: 2, windowMs: 60_000, userId: "u1" };

    expect(enforceRateLimit(request("POST"), "chat", opts)).toBeNull();
    expect(enforceRateLimit(request("POST"), "chat", opts)).toBeNull();
    const res = enforceRateLimit(request("POST"), "chat", opts);

    expect(res?.status).toBe(429);
    expect(res?.headers.get("Retry-After")).toBeTruthy();
  });

  it("keys anonymous callers by IP", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    const a = request("POST", { "x-forwarded-for": "1.1.1.1" });
    const b = request("POST", { "x-forwarded-for": "2.2.2.2" });

    expect(enforceRateLimit(a, "r", opts)).toBeNull();
    expect(enforceRateLimit(a, "r", opts)?.status).toBe(429);
    expect(enforceRateLimit(b, "r", opts)).toBeNull();
  });
});

describe("rejectCrossOrigin", () => {
  it("never blocks safe methods", () => {
    const req = request("GET", { origin: "https://evil.example" });
    expect(rejectCrossOrigin(req, "r")).toBeNull();
  });

  it("allows a same-origin write", () => {
    const req = request("POST", {
      origin: "https://pos.example.com",
      host: "pos.example.com",
    });
    expect(rejectCrossOrigin(req, "r")).toBeNull();
  });

  it("blocks a write from another site's origin", () => {
    const req = request("PATCH", {
      origin: "https://evil.example",
      host: "pos.example.com",
    });
    expect(rejectCrossOrigin(req, "r")?.status).toBe(403);
  });

  it("blocks a write the browser marks as cross-site", () => {
    const req = request("POST", { "sec-fetch-site": "cross-site" });
    expect(rejectCrossOrigin(req, "r")?.status).toBe(403);
  });

  it("blocks a write with a malformed Origin header", () => {
    const req = request("POST", { origin: "not a url", host: "pos.example.com" });
    expect(rejectCrossOrigin(req, "r")?.status).toBe(403);
  });

  it("lets a write with no Origin through (non-browser clients carry no cookies)", () => {
    expect(rejectCrossOrigin(request("POST"), "r")).toBeNull();
  });
});
