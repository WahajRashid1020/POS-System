const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Tried in order. If one is out of quota (429), busy (503) or retired (404),
// the next is used, so the chat keeps working. Set GEMINI_MODEL to choose the
// first one; the others are the safety net.
const FALLBACK_MODELS = ["gemini-3-flash-preview", "gemini-3.1-flash-lite"];
const MODELS = Array.from(
  new Set([process.env.GEMINI_MODEL || "gemini-3.5-flash", ...FALLBACK_MODELS]),
);

// The whole call stays inside the route's 30s limit so a slow Gemini fails
// with a clear message instead of the platform killing the request.
const GEMINI_TIMEOUT_MS = 22_000;
const TOTAL_BUDGET_MS = 27_000;
const MIN_TIME_FOR_ANOTHER_TRY_MS = 3_000;

// Statuses where trying a different model can help. Anything else (such as a
// rejected key or a bad request) would fail on every model, so we stop.
const TRY_NEXT_MODEL_STATUSES = new Set([404, 429, 500, 502, 503, 504]);

export type GeminiError = Error & { status: number };

function geminiError(message: string, status: number): GeminiError {
  return Object.assign(new Error(message), { status });
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw geminiError("Gemini took too long to respond", 504);
    }
    throw error;
  }
}

/**
 * `systemInstruction` carries the rules and business data; `prompt` is the
 * untrusted user text. Keeping them in separate fields stops the user's text
 * from being read as part of the instructions.
 *
 * Failures carry an HTTP `status` (see GeminiError) so callers can tell
 * "busy/out of quota" (429/503) from "took too long" (504) from a real problem.
 */
export async function askGemini(
  prompt: string,
  systemInstruction?: string,
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set in environment");
  }

  const init: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      ...(systemInstruction
        ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
        : {}),
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  };

  const startedAt = Date.now();
  let lastFailure: GeminiError | undefined;

  for (const model of MODELS) {
    const remaining = TOTAL_BUDGET_MS - (Date.now() - startedAt);
    if (lastFailure && remaining < MIN_TIME_FOR_ANOTHER_TRY_MS) break;

    const res = await fetchWithTimeout(
      `${GEMINI_BASE_URL}/${model}:generateContent`,
      init,
      Math.min(GEMINI_TIMEOUT_MS, remaining),
    );

    if (res.ok) {
      const data = await res.json();
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't generate a response."
      );
    }

    // Details stay in server logs only; callers get the status code, nothing more.
    console.error(`Gemini API error (${model}):`, res.status, await res.text());
    lastFailure = geminiError(`Gemini API error (${res.status})`, res.status);

    if (!TRY_NEXT_MODEL_STATUSES.has(res.status)) break;
  }

  throw lastFailure ?? geminiError("Gemini did not respond", 504);
}
