"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (!session?.user) return null;

  const user = session.user;
  const role = (user as any).role || "cashier";
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const roleColors: Record<string, string> = {
    admin:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
    manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    cashier:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    kitchen:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-stone-200 px-2 py-1.5 transition-colors hover:bg-stone-50 dark:border-dark-border dark:hover:bg-dark-hover"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="h-7 w-7 rounded-full"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
            {initials}
          </div>
        )}
        <span className="hidden text-sm font-medium text-ink sm:block dark:text-white">
          {user.name?.split(" ")[0]}
        </span>
        <span
          className={`hidden rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase sm:block ${
            roleColors[role] || roleColors.cashier
          }`}
        >
          {role}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-stone-200 bg-white py-2 shadow-lg dark:border-dark-border dark:bg-dark-card">
            <div className="border-b border-stone-100 px-4 py-2 dark:border-dark-border">
              <p className="text-sm font-medium text-ink dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-ink-tertiary dark:text-stone-500">
                {user.email}
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  roleColors[role] || roleColors.cashier
                }`}
              >
                {role}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
