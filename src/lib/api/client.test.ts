import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, apiMutate } from "./client";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("apiFetch", () => {
  it("returns the parsed JSON body on success", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ hello: "world" }));
    vi.stubGlobal("fetch", fetchMock);

    const data = await apiFetch<{ hello: string }>("/api/thing");

    expect(data).toEqual({ hello: "world" });
    expect(fetchMock).toHaveBeenCalledWith("/api/thing", {});
  });

  it("throws the server-provided error message on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: "Order not found" }, false, 404),
      ),
    );

    await expect(
      apiFetch("/api/orders/x", { fallbackMessage: "fallback" }),
    ).rejects.toThrow("Order not found");
  });

  it("falls back to the supplied message when the error body has no `error`", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({}, false, 500)),
    );

    await expect(
      apiFetch("/api/orders", { fallbackMessage: "Failed to fetch orders" }),
    ).rejects.toThrow("Failed to fetch orders");
  });

  it("falls back when the error body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("not json");
        },
      } as unknown as Response),
    );

    await expect(
      apiFetch("/api/reports", { fallbackMessage: "Failed to fetch report" }),
    ).rejects.toThrow("Failed to fetch report");
  });

  it("de-duplicates identical in-flight GET requests", async () => {
    let resolve!: (value: Response) => void;
    const pending = new Promise<Response>((r) => {
      resolve = r;
    });
    const fetchMock = vi.fn().mockReturnValue(pending);
    vi.stubGlobal("fetch", fetchMock);

    const a = apiFetch("/api/orders?limit=50");
    const b = apiFetch("/api/orders?limit=50");

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolve(jsonResponse({ orders: [] }));
    await Promise.all([a, b]);

    // A new request after the first settles is not deduped.
    fetchMock.mockResolvedValueOnce(jsonResponse({ orders: [] }));
    await apiFetch("/api/orders?limit=50");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not de-duplicate mutations", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([
      apiMutate("/api/orders", "POST", { a: 1 }),
      apiMutate("/api/orders", "POST", { a: 2 }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("apiMutate", () => {
  it("sends a JSON body with the correct method and headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ order: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await apiMutate("/api/orders/1", "PATCH", { status: "ready" });

    expect(fetchMock).toHaveBeenCalledWith("/api/orders/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ready" }),
    });
  });
});
