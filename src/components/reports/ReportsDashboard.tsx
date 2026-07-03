"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { UserMenu } from "@/components/shared/UserMenu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { StatCard } from "./StatCard";
import { RevenueChart } from "./RevenueChart";
import { TopItemsChart } from "./TopItemsChart";
import { OrderTypeChart } from "./OrderTypeChart";
import { PaymentChart } from "./PaymentChart";
import { CategoryChart } from "./CategoryChart";
import { DailyChart } from "./DailyChart";
import { Logo } from "@/components/shared/Logo";
import { ReportsSkeleton } from "@/components/shared/Skeleton";
import { getReport } from "@/lib/api";
import type { ReportData, ReportRange } from "@/types";

type TimeRange = ReportRange;

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
      const json = await getReport(range);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink dark:text-white">
              Sales <span className="text-brand-500">Reports</span>
            </h1>
            <p className="text-xs text-ink-tertiary dark:text-stone-500">
              Revenue, orders, and insights
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pos"
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-stone-50 dark:border-dark-border dark:text-stone-400 dark:hover:bg-dark-hover"
          >
            ← POS
          </Link>
          <Link
            href="/kitchen"
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-stone-50 dark:border-dark-border dark:text-stone-400 dark:hover:bg-dark-hover"
          >
            👨‍🍳 Kitchen
          </Link>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Time range tabs */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto rounded-xl bg-stone-200/60 p-1 dark:bg-dark-surface">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              range === r.value
                ? "bg-white text-ink shadow-sm dark:bg-dark-accent dark:text-white"
                : "text-ink-secondary hover:text-ink dark:text-stone-400 dark:hover:text-white"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading && <ReportsSkeleton />}

      {error && (
        <div className="rounded-2xl bg-red-50 p-8 text-center dark:bg-red-950/30">
          <p className="font-medium text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={fetchReport}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
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

          {(range === "today" || range === "yesterday") && (
            <RevenueChart data={data.ordersByHour} />
          )}
          {(range === "week" || range === "month" || range === "all") &&
            data.ordersByDay.length > 0 && (
              <DailyChart data={data.ordersByDay} />
            )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopItemsChart data={data.topItems} />
            <CategoryChart data={data.topCategories} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <OrderTypeChart data={data.ordersByType} />
            <PaymentChart data={data.paymentMethods} />
          </div>

          {/* Tax summary */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card">
            <h3 className="mb-4 text-sm font-semibold text-ink dark:text-white">
              Tax Summary
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-ink-tertiary dark:text-stone-500">
                  Subtotal (ex VAT)
                </p>
                <p className="text-lg font-bold text-ink dark:text-white">
                  {formatCurrency(data.summary.totalSubtotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-tertiary dark:text-stone-500">
                  VAT Collected (9%)
                </p>
                <p className="text-lg font-bold text-ink dark:text-white">
                  {formatCurrency(data.summary.totalTax)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-tertiary dark:text-stone-500">
                  Total (inc VAT)
                </p>
                <p className="text-lg font-bold text-ink dark:text-white">
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
