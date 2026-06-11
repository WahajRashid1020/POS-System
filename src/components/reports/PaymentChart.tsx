"use client";

import { formatCurrency } from "@/lib/utils";

interface PaymentChartProps {
  data: { method: string; count: number; revenue: number }[];
}

const PAYMENT_CONFIG: Record<
  string,
  { icon: string; label: string; color: string; bg: string }
> = {
  cash: {
    icon: "💵",
    label: "Cash",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  card: {
    icon: "💳",
    label: "Card",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
};

export function PaymentChart({ data }: PaymentChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card">
      <h3 className="mb-1 text-sm font-semibold text-ink dark:text-white">
        Payment Methods
      </h3>
      <p className="mb-4 text-xs text-ink-tertiary dark:text-stone-500">
        Cash vs card breakdown
      </p>

      {total === 0 ? (
        <p className="py-8 text-center text-sm text-ink-tertiary dark:text-stone-500">
          No order data yet
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex h-4 overflow-hidden rounded-full bg-stone-100 dark:bg-dark-surface">
            {data.map((d) => {
              const pct = total > 0 ? (d.count / total) * 100 : 0;
              return (
                <div
                  key={d.method}
                  className={`transition-all ${
                    d.method === "cash" ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {data.map((d) => {
              const config = PAYMENT_CONFIG[d.method] || PAYMENT_CONFIG.cash;
              const pct = total > 0 ? ((d.count / total) * 100).toFixed(0) : 0;

              return (
                <div key={d.method} className={`rounded-xl p-4 ${config.bg}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{config.icon}</span>
                    <span className={`text-sm font-semibold ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-ink dark:text-white">
                    {pct}%
                  </p>
                  <p className="text-xs text-ink-secondary dark:text-stone-400">
                    {d.count} orders · {formatCurrency(d.revenue)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
