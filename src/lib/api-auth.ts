import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { logSecurityEvent } from "@/lib/security-log";
import type { UserRole } from "@/types";

export type AuthResult =
  | { ok: true; role: UserRole; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Server-side role check for API routes. The client-side ProtectedRoute only
 * hides screens; this is what actually stops direct calls to the API.
 * `route` is a label for the security log only.
 */
export async function requireRole(
  allowed: readonly UserRole[],
  route?: string,
): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    logSecurityEvent("auth.unauthenticated", { route });
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  }

  const role = allowed.find((r) => r === session.user.role);
  if (!role) {
    logSecurityEvent("auth.forbidden", { route, role: session.user.role });
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const userId =
    session.user.email ?? session.user.dbId ?? session.user.name ?? "unknown";
  return { ok: true, role, userId };
}
