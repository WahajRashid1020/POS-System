"use client";

import { formatCurrency } from "@/lib/utils";

interface CategoryChartProps {
  data: { category: string; quantity: number; revenue: number }[];
}

const CATEGORY_ICONS: Record<string, string> = {
  burgers: "🍔",
  "chips-sides": "🍟",
  fish: "🐟",
  chicken: "🍗",
  kebabs: "🥙",
  meals: "🍽️",
  drinks: "🥤",
  extras: "➕",
};

export function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white dark:border-dark-border dark:bg-dark-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-ink dark:text-white">
          Category Breakdown
        </h3>
        <p className="py-8 text-center text-sm text-ink-tertiary dark:text-stone-500">
          No order data yet
        </p>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue));

  return (
    <div className="rounded-2xl border border-stone-200 bg-white dark:border-dark-border dark:bg-dark-card p-6">
      <h3 className="mb-1 text-sm font-semibold text-ink dark:text-white">
        Category Breakdown
      </h3>
      <p className="mb-4 text-xs text-ink-tertiary dark:text-stone-500">
        Revenue by category
      </p>

      <div className="space-y-3">
        {data.map((d) => {
          const pct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
          const icon = CATEGORY_ICONS[d.category] || "📦";

          return (
            <div key={d.category}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{icon}</span>
                  <span className="text-sm font-medium capitalize text-ink dark:text-white">
                    {d.category.replace("-", " & ")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-ink dark:text-white">
                    {formatCurrency(d.revenue)}
                  </span>
                  <span className="ml-2 text-xs text-ink-tertiary dark:text-stone-500">
                    ({d.quantity} items)
                  </span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-dark-surface">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
