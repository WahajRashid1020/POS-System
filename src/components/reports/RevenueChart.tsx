"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: { hour: string; orders: number; revenue: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Only show hours that have data or are within business hours (10-23)
  const filtered = data.filter((d) => {
    const h = parseInt(d.hour);
    return h >= 10 && h <= 23;
  });

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <h3 className="mb-1 text-sm font-semibold text-ink">Revenue by Hour</h3>
      <p className="mb-4 text-xs text-ink-tertiary">
        Hourly breakdown of orders and revenue
      </p>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="revenue"
              orientation="left"
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `€${v}`}
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e7e5e4",
                fontSize: "13px",
              }}
              formatter={(value: number, name: string) =>
                name === "revenue"
                  ? [`€${value.toFixed(2)}`, "Revenue"]
                  : [value, "Orders"]
              }
            />
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#revenueGrad)"
            />
            <Area
              yAxisId="orders"
              type="monotone"
              dataKey="orders"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#ordersGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-brand-500" />
          <span className="text-ink-secondary">Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-ink-secondary">Orders</span>
        </div>
      </div>
    </div>
  );
}
