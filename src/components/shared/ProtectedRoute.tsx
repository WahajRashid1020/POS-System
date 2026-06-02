"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-300 border-t-brand-500" />
          <p className="text-sm text-ink-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const userRole = (session?.user as any)?.role as UserRole;

  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <span className="text-5xl">🚫</span>
          <h2 className="mt-4 text-xl font-bold text-ink">Access Denied</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Your role ({userRole}) doesn&apos;t have access to this page.
          </p>
          <button
            onClick={() =>
              router.push(userRole === "kitchen" ? "/kitchen" : "/pos")
            }
            className="mt-4 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Go to your screen
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
