import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const API_KEY = "test-secret-key-123456";

interface GeminiBody {
  systemInstruction?: { parts: { text: string }[] };
  contents: { parts: { text: string }[] }[];
}

async function loadGemini() {
  vi.resetModules();
  vi.stubEnv("GEMINI_API_KEY", API_KEY);
  return import("./gemini");
}

function okResponse(): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text: "hi" }] } }] }),
    text: async () => "",
  } as unknown as Response;
}

function errorResponse(status: number, body: string): Response {
  return {
    ok: false,
    status,
    json: async () => ({}),
    text: async () => body,
  } as unknown as Response;
}

let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("askGemini — secret handling", () => {
  it("never writes any part of the API key to the logs", async () => {
    const { askGemini } = await loadGemini();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse()));

    await askGemini("hello");

    const logged = JSON.stringify([...logSpy.mock.calls, ...errorSpy.mock.calls]);
    expect(logged).not.toContain(API_KEY.slice(0, 8));
  });

  it("sends the key in a header, not in the URL", async () => {
    const { askGemini } = await loadGemini();
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    await askGemini("hello");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain(API_KEY);
    expect(url).not.toContain("key=");
    expect(init.headers).toMatchObject({ "x-goog-api-key": API_KEY });
  });

  it("does not put upstream error bodies into the thrown error", async () => {
    const { askGemini } = await loadGemini();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(errorResponse(403, "UPSTREAM_SECRET_DETAIL")),
    );

    const err = await askGemini("hello").catch((e: unknown) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toContain("403");
    expect((err as Error).message).not.toContain("UPSTREAM_SECRET_DETAIL");
  });

  it("fails clearly when the key is not configured", async () => {
    vi.resetModules();
    vi.stubEnv("GEMINI_API_KEY", "");
    const { askGemini } = await import("./gemini");

    await expect(askGemini("hello")).rejects.toThrow(/not set/i);
  });
});

describe("askGemini — request shape", () => {
  it("sends instructions and user text as separate fields", async () => {
    const { askGemini } = await loadGemini();
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    await askGemini("what sold best?", "You are an analytics assistant.");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body: GeminiBody = JSON.parse(init.body as string);
    expect(body.systemInstruction?.parts[0].text).toBe(
      "You are an analytics assistant.",
    );
    expect(body.contents[0].parts[0].text).toBe("what sold best?");
  });

  it("returns the model's text", async () => {
    const { askGemini } = await loadGemini();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse()));

    await expect(askGemini("hello")).resolves.toBe("hi");
  });
});

describe("askGemini — slow responses", () => {
  it("gives up with a clear message instead of hanging", async () => {
    const { askGemini } = await loadGemini();
    const timeout = Object.assign(new Error("signal timed out"), { name: "TimeoutError" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeout));

    await expect(askGemini("hello")).rejects.toThrow("Gemini took too long to respond");
  });

  it("sends an abort signal so the request can be cut off", async () => {
    const { askGemini } = await loadGemini();
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    await askGemini("hello");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("still surfaces other network errors unchanged", async () => {
    const { askGemini } = await loadGemini();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(askGemini("hello")).rejects.toThrow("network down");
  });
});

describe("askGemini — falls back to another model when one is out of quota or busy", () => {
  const modelOf = (call: unknown[]) =>
    String(call[0]).match(/models\/([^:]+):/)?.[1];

  it("uses the main model when it works", async () => {
    const { askGemini } = await loadGemini();
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    await askGemini("hello");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(modelOf(fetchMock.mock.calls[0])).toBe("gemini-3.5-flash");
  });

  it.each([429, 503, 404, 500])(
    "moves to the next model when the first answers %i",
    async (status) => {
      const { askGemini } = await loadGemini();
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(errorResponse(status, "problem"))
        .mockResolvedValueOnce(okResponse());
      vi.stubGlobal("fetch", fetchMock);

      await expect(askGemini("hello")).resolves.toBe("hi");
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(modelOf(fetchMock.mock.calls[0])).toBe("gemini-3.5-flash");
      expect(modelOf(fetchMock.mock.calls[1])).toBe("gemini-3-flash-preview");
    },
  );

  it("walks the whole chain and reports the last status when every model fails", async () => {
    const { askGemini } = await loadGemini();
    const fetchMock = vi.fn().mockResolvedValue(errorResponse(503, "high demand"));
    vi.stubGlobal("fetch", fetchMock);

    const err = await askGemini("hello").catch((e: unknown) => e);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.map(modelOf)).toEqual([
      "gemini-3.5-flash",
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite",
    ]);
    expect((err as Error & { status: number }).status).toBe(503);
  });

  it("stops at once on a rejected key (403): other models would fail too", async () => {
    const { askGemini } = await loadGemini();
    const fetchMock = vi.fn().mockResolvedValue(errorResponse(403, "bad key"));
    vi.stubGlobal("fetch", fetchMock);

    const err = await askGemini("hello").catch((e: unknown) => e);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((err as Error & { status: number }).status).toBe(403);
  });

  it("stops on a bad request (400)", async () => {
    const { askGemini } = await loadGemini();
    const fetchMock = vi.fn().mockResolvedValue(errorResponse(400, "bad request"));
    vi.stubGlobal("fetch", fetchMock);

    await askGemini("hello").catch(() => undefined);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("lets GEMINI_MODEL choose the first model without duplicating the fallbacks", async () => {
    vi.resetModules();
    vi.stubEnv("GEMINI_API_KEY", API_KEY);
    vi.stubEnv("GEMINI_MODEL", "gemini-3-flash-preview");
    const { askGemini } = await import("./gemini");
    const fetchMock = vi.fn().mockResolvedValue(errorResponse(503, "busy"));
    vi.stubGlobal("fetch", fetchMock);

    await askGemini("hello").catch(() => undefined);

    expect(fetchMock.mock.calls.map(modelOf)).toEqual([
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite",
    ]);
  });

  it("marks a timeout with status 504 and does not keep trying", async () => {
    const { askGemini } = await loadGemini();
    const timeout = Object.assign(new Error("timed out"), { name: "TimeoutError" });
    const fetchMock = vi.fn().mockRejectedValue(timeout);
    vi.stubGlobal("fetch", fetchMock);

    const err = await askGemini("hello").catch((e: unknown) => e);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((err as Error & { status: number }).status).toBe(504);
  });
});
