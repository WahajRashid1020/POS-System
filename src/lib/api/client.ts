/**
 * Shared HTTP client for the QuickServe internal API.
 *
 * Centralises JSON handling and error extraction so components don't repeat
 * `fetch` boilerplate. On a non-OK response it throws an `Error` whose message
 * is the server-provided `error` field when present, otherwise the supplied
 * fallback — matching the behaviour the components had inline.
 *
 * GET requests are de-duplicated while in flight: concurrent calls to the same
 * URL share a single network request. This is invisible to behaviour (no
 * caching of stale data), it only collapses overlapping identical requests
 * such as the kitchen display's poll firing alongside a manual refresh.
 */

interface ApiFetchOptions extends RequestInit {
  /** Message thrown when the response is not OK and the body has no `error`. */
  fallbackMessage?: string;
}

const inFlightGets = new Map<string, Promise<unknown>>();

async function request<T>(path: string, options: ApiFetchOptions): Promise<T> {
  const { fallbackMessage = "Request failed", ...init } = options;

  const res = await fetch(path, init);

  if (!res.ok) {
    let message = fallbackMessage;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // Non-JSON error body — keep the fallback message.
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();

  // De-dupe identical in-flight GETs.
  if (method === "GET") {
    const existing = inFlightGets.get(path);
    if (existing) return existing as Promise<T>;

    const promise = request<T>(path, options).finally(() => {
      inFlightGets.delete(path);
    });
    inFlightGets.set(path, promise);
    return promise;
  }

  return request<T>(path, options);
}

/** Convenience helper for JSON-body mutations (POST/PATCH/etc.). */
export function apiMutate<T>(
  path: string,
  method: string,
  body: unknown,
  fallbackMessage?: string,
): Promise<T> {
  return apiFetch<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    fallbackMessage,
  });
}
