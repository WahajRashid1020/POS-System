"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface OrderTypeChartProps {
  data: { type: string; count: number; revenue: number }[];
}

const COLORS = ["#f97316", "#3b82f6", "#10b981"];
const LABELS: Record<string, string> = {
  "dine-in": "🍽️ Dine In",
  takeaway: "🛍️ Takeaway",
  delivery: "🚗 Delivery",
};

export function OrderTypeChart({ data }: OrderTypeChartProps) {
  const hasData = data.some((d) => d.count > 0);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white dark:border-dark-border dark:bg-dark-card p-6">
      <h3 className="mb-1 text-sm font-semibold text-ink dark:text-white">
        Order Types
      </h3>
      <p className="mb-4 text-xs text-ink-tertiary dark:text-stone-500">
        Distribution by order type
      </p>

      {!hasData ? (
        <p className="py-8 text-center text-sm text-ink-tertiary dark:text-stone-500">
          No order data yet
        </p>
      ) : (
        <div className="flex items-center gap-6">
          <div className="h-[200px] w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.filter((d) => d.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="count"
                  nameKey="type"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e7e5e4",
                    fontSize: "13px",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} orders`,
                    LABELS[name] || name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-3">
            {data
              .filter((d) => d.count > 0)
              .map((d, i) => (
                <div key={d.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-sm text-ink dark:text-white">
                      {LABELS[d.type] || d.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink dark:text-white">
                      {d.count} orders
                    </p>
                    <p className="text-xs text-ink-tertiary dark:text-stone-500">
                      {formatCurrency(d.revenue)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
