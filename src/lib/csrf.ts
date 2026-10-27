import { NextRequest, NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/security-log";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF defence for cookie-authenticated API routes, on top of SameSite cookies:
 * a state-changing request from a browser must come from this site. Browsers
 * always send Origin on cross-site writes; requests without it (curl, other
 * servers) can't carry a victim's cookies, so they are left to normal auth.
 * Returns a 403 response to send, or null to carry on.
 */
export function rejectCrossOrigin(
  req: NextRequest,
  route: string,
): NextResponse | null {
  if (SAFE_METHODS.has(req.method)) return null;

  const fetchSite = req.headers.get("sec-fetch-site");
  const origin = req.headers.get("origin");

  let crossSite = fetchSite === "cross-site";
  if (!crossSite && origin) {
    const host =
      req.headers.get("x-forwarded-host") ??
      req.headers.get("host") ??
      req.nextUrl.host;
    try {
      crossSite = new URL(origin).host !== host;
    } catch {
      crossSite = true;
    }
  }

  if (!crossSite) return null;

  logSecurityEvent("csrf.cross_origin_rejected", { route });
  return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
}
