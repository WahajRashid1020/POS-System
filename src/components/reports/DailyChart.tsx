"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DailyChartProps {
  data: { date: string; orders: number; revenue: number }[];
}

export function DailyChart({ data }: DailyChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-IE", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card">
      <h3 className="mb-1 text-sm font-semibold text-ink dark:text-white">
        Daily Revenue
      </h3>
      <p className="mb-4 text-xs text-ink-tertiary dark:text-stone-500">
        Revenue and orders per day
      </p>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `€${v}`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid var(--tooltip-border)",
                fontSize: "13px",
                backgroundColor: "var(--tooltip-bg)",
                color: "var(--tooltip-text)",
              }}
              cursor={{ fill: "var(--tooltip-cursor)" }}
              formatter={(value: number, name: string) =>
                name === "revenue"
                  ? [`€${value.toFixed(2)}`, "Revenue"]
                  : [value, "Orders"]
              }
            />
            <Bar
              dataKey="revenue"
              fill="#f97316"
              radius={[6, 6, 0, 0]}
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
