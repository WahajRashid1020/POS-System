"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface TopItemsChartProps {
  data: { name: string; quantity: number; revenue: number }[];
}

const COLORS = [
  "#f97316",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#6366f1",
];

export function TopItemsChart({ data }: TopItemsChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white dark:border-dark-border dark:bg-dark-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-ink dark:text-white">
          Top Items
        </h3>
        <p className="py-8 text-center text-sm text-ink-tertiary dark:text-stone-500">
          No order data yet
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white dark:border-dark-border dark:bg-dark-card p-6">
      <h3 className="mb-1 text-sm font-semibold text-ink dark:text-white">
        Top Selling Items
      </h3>
      <p className="mb-4 text-xs text-ink-tertiary dark:text-stone-500">
        By quantity sold
      </p>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 11, fill: "#57534e" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid var(--tooltip-border)",
                fontSize: "13px",
                backgroundColor: "var(--tooltip-bg)",
                color: "var(--tooltip-text)",
              }}
              itemStyle={{
                color: "#f97316",
              }}
              labelStyle={{
                color: "#3b82f6",
              }}
              cursor={{ fill: "var(--tooltip-cursor)" }}
              formatter={(value: number, name: string, props: any) => [
                `${value} sold (${formatCurrency(props.payload.revenue)})`,
                "Quantity",
              ]}
            />
            <Bar dataKey="quantity" radius={[0, 6, 6, 0]} barSize={20}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
