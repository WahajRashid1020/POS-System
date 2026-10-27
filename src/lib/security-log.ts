export type SecurityEvent =
  | "auth.unauthenticated"
  | "auth.forbidden"
  | "rate_limit.exceeded"
  | "csrf.cross_origin_rejected";

export interface SecurityEventDetails {
  route?: string;
  role?: string;
}

/**
 * One JSON line per security event, easy to filter or alert on in Vercel logs.
 * Callers may only pass a route label and a role: never emails, tokens, ids or
 * request bodies, so the log can't leak sensitive data.
 */
export function logSecurityEvent(
  event: SecurityEvent,
  details: SecurityEventDetails = {},
): void {
  console.warn(
    JSON.stringify({
      level: "security",
      event,
      route: details.route,
      role: details.role,
      at: new Date().toISOString(),
    }),
  );
}
