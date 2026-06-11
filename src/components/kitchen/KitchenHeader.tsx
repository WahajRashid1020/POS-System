"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserMenu } from "@/components/shared/UserMenu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

type KitchenFilter = "all" | "pending" | "preparing" | "ready";

interface KitchenHeaderProps {
  filter: KitchenFilter;
  onFilterChange: (filter: KitchenFilter) => void;
  counts: Record<KitchenFilter, number>;
  lastUpdated: Date;
  onRefresh: () => void;
}

const FILTERS: {
  value: KitchenFilter;
  label: string;
  color: string;
  activeColor: string;
}[] = [
  {
    value: "all",
    label: "All",
    color:
      "bg-stone-200 text-stone-700 dark:bg-dark-surface dark:text-stone-400",
    activeColor: "bg-stone-800 text-white dark:bg-white dark:text-dark-bg",
  },
  {
    value: "pending",
    label: "Pending",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    activeColor: "bg-amber-500 text-white",
  },
  {
    value: "preparing",
    label: "Preparing",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    activeColor: "bg-blue-600 text-white",
  },
  {
    value: "ready",
    label: "Ready",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    activeColor: "bg-emerald-600 text-white",
  },
];

export function KitchenHeader({
  filter,
  onFilterChange,
  counts,
  lastUpdated,
  onRefresh,
}: KitchenHeaderProps) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const canViewReports = userRole === "admin" || userRole === "manager";

  const timeString = lastUpdated.toLocaleTimeString("en-IE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="border-b border-stone-200 bg-white px-4 py-3 md:px-6 dark:border-dark-border dark:bg-dark-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-800 text-lg dark:bg-dark-surface">
            👨‍🍳
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink dark:text-white">
              Kitchen Display
            </h1>
            <p className="text-xs text-ink-tertiary dark:text-stone-500">
              Updated {timeString} · Auto-refreshes every 5s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pos"
            className="hidden rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-stone-50 dark:border-dark-border dark:text-stone-400 dark:hover:bg-dark-hover"
          >
            ← POS
          </Link>
          {canViewReports && (
            <Link
              href="/reports"
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-stone-50 dark:border-dark-border dark:text-stone-400 dark:hover:bg-dark-hover"
            >
              📊 Reports
            </Link>
          )}
          {canViewReports && (
            <Link
              href="/chat"
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-stone-50 dark:border-dark-border dark:text-stone-400 dark:hover:bg-dark-hover"
            >
              🤖 AI
            </Link>
          )}
          <button
            onClick={onRefresh}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-stone-50 dark:border-dark-border dark:text-stone-400 dark:hover:bg-dark-hover"
          >
            🔄 Refresh
          </button>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
              filter === f.value ? f.activeColor : f.color,
            )}
          >
            <span>{f.label}</span>
            <span
              className={cn(
                "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                filter === f.value
                  ? "bg-white/25 text-white"
                  : "bg-black/10 text-current dark:bg-white/10",
              )}
            >
              {counts[f.value]}
            </span>
          </button>
        ))}
      </div>
    </header>
  );
}
