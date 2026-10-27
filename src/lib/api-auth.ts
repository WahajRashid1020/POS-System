import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import type { UserRole } from "@/types";

export type AuthResult =
  | { ok: true; role: UserRole }
  | { ok: false; response: NextResponse };

/**
 * Server-side role check for API routes. The client-side ProtectedRoute only
 * hides screens; this is what actually stops direct calls to the API.
 */
export async function requireRole(
  allowed: readonly UserRole[],
): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
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
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, role };
}
