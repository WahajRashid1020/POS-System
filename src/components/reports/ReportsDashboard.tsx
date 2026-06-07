"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { UserMenu } from "@/components/shared/UserMenu";
import { StatCard } from "./StatCard";
import { RevenueChart } from "./RevenueChart";
import { TopItemsChart } from "./TopItemsChart";
import { OrderTypeChart } from "./OrderTypeChart";
import { PaymentChart } from "./PaymentChart";
import { CategoryChart } from "./CategoryChart";
import { DailyChart } from "./DailyChart";

type TimeRange = "today" | "yesterday" | "week" | "month" | "all";

interface ReportData {
  summary: {
    totalOrders: number;
    completedOrders: number;
    totalRevenue: number;
    totalSubtotal: number;
    totalTax: number;
    averageOrderValue: number;
    avgPrepTime: number;
  };
  ordersByHour: { hour: string; orders: number; revenue: number }[];
  ordersByType: { type: string; count: number; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  paymentMethods: { method: string; count: number; revenue: number }[];
  topItems: { name: string; quantity: number; revenue: number }[];
  topCategories: { category: string; quantity: number; revenue: number }[];
  ordersByDay: { date: string; orders: number; revenue: number }[];
  range: string;
}

const RANGES: { value: TimeRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "all", label: "All Time" },
];

export function ReportsDashboard() {
  const [range, setRange] = useState<TimeRange>("today");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [range]);

  async function fetchReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-lg text-white font-bold">
            📊
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Sales Reports</h1>
            <p className="text-xs text-ink-tertiary">
              Revenue, orders, and insights
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/pos"
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-stone-50"
          >
            ← POS
          </Link>
          <Link
            href="/kitchen"
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-stone-50"
          >
            👨‍🍳 Kitchen
          </Link>
          <UserMenu />
        </div>
      </div>

      {/* Time range tabs */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto rounded-xl bg-stone-200/60 p-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              range === r.value
                ? "bg-white text-ink shadow-sm"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-300 border-t-brand-500" />
            <p className="text-sm text-ink-secondary">Loading report...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-50 p-8 text-center">
          <p className="font-medium text-red-700">{error}</p>
          <button
            onClick={fetchReport}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Dashboard */}
      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total Revenue"
              value={formatCurrency(data.summary.totalRevenue)}
              icon="💰"
              color="emerald"
            />
            <StatCard
              label="Total Orders"
              value={data.summary.totalOrders.toString()}
              icon="📦"
              color="blue"
            />
            <StatCard
              label="Avg Order Value"
              value={formatCurrency(data.summary.averageOrderValue)}
              icon="📈"
              color="purple"
            />
            <StatCard
              label="Avg Prep Time"
              value={
                data.summary.avgPrepTime > 0
                  ? `${data.summary.avgPrepTime} min`
                  : "N/A"
              }
              icon="⏱"
              color="amber"
            />
          </div>

          {/* Revenue chart (by hour or by day) */}
          {(range === "today" || range === "yesterday") && (
            <RevenueChart data={data.ordersByHour} />
          )}
          {(range === "week" || range === "month" || range === "all") &&
            data.ordersByDay.length > 0 && (
              <DailyChart data={data.ordersByDay} />
            )}

          {/* Two column layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopItemsChart data={data.topItems} />
            <CategoryChart data={data.topCategories} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <OrderTypeChart data={data.ordersByType} />
            <PaymentChart data={data.paymentMethods} />
          </div>

          {/* Tax summary */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-ink">Tax Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-ink-tertiary">Subtotal (ex VAT)</p>
                <p className="text-lg font-bold text-ink">
                  {formatCurrency(data.summary.totalSubtotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-tertiary">VAT Collected (9%)</p>
                <p className="text-lg font-bold text-ink">
                  {formatCurrency(data.summary.totalTax)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-tertiary">Total (inc VAT)</p>
                <p className="text-lg font-bold text-ink">
                  {formatCurrency(data.summary.totalRevenue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
