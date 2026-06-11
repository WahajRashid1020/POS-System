"use client";

import { useState, useEffect } from "react";
import { cn, formatCurrency, formatTime } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  isUpdating: boolean;
}

const STATUS_CONFIG: Record<
  string,
  {
    border: string;
    headerBg: string;
    headerText: string;
    pulse: boolean;
    label: string;
    icon: string;
  }
> = {
  pending: {
    border: "border-amber-300 dark:border-amber-500/50",
    headerBg: "bg-amber-500",
    headerText: "text-white",
    pulse: true,
    label: "NEW ORDER",
    icon: "🔔",
  },
  preparing: {
    border: "border-blue-300 dark:border-blue-500/50",
    headerBg: "bg-blue-600",
    headerText: "text-white",
    pulse: false,
    label: "PREPARING",
    icon: "🔥",
  },
  ready: {
    border: "border-emerald-400 dark:border-emerald-500/50",
    headerBg: "bg-emerald-600",
    headerText: "text-white",
    pulse: true,
    label: "READY",
    icon: "✅",
  },
};

export function OrderCard({
  order,
  onUpdateStatus,
  isUpdating,
}: OrderCardProps) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    function update() {
      const created = new Date(order.createdAt).getTime();
      const diff = Math.floor((Date.now() - created) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setElapsed(`${mins}:${secs.toString().padStart(2, "0")}`);
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const created = new Date(order.createdAt).getTime();
  const minsElapsed = (Date.now() - created) / 60000;
  const isUrgent = order.status === "pending" && minsElapsed > 5;
  const isCritical = order.status === "pending" && minsElapsed > 10;

  const nextAction: {
    label: string;
    status: OrderStatus;
    color: string;
  } | null =
    order.status === "pending"
      ? {
          label: "Start Preparing",
          status: "preparing",
          color: "bg-blue-600 hover:bg-blue-700",
        }
      : order.status === "preparing"
        ? {
            label: "Mark Ready",
            status: "ready",
            color: "bg-emerald-600 hover:bg-emerald-700",
          }
        : order.status === "ready"
          ? {
              label: "Complete",
              status: "completed",
              color:
                "bg-stone-700 hover:bg-stone-800 dark:bg-stone-600 dark:hover:bg-stone-500",
            }
          : null;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all dark:bg-dark-card",
        config.border,
        config.pulse && "animate-pulse-subtle",
        isCritical &&
          "ring-2 ring-red-400 ring-offset-2 dark:ring-offset-dark-bg",
        isUrgent &&
          !isCritical &&
          "ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-dark-bg",
        isUpdating && "opacity-60",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2.5",
          config.headerBg,
          config.headerText,
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{config.icon}</span>
          <span className="text-lg font-bold">#{order.orderNumber}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-bold uppercase">
            {config.label}
          </span>
        </div>
      </div>

      {/* Order meta */}
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <span className="text-sm capitalize text-ink-secondary dark:text-stone-400">
            {order.type === "dine-in"
              ? "🍽️ Dine In"
              : order.type === "takeaway"
                ? "🛍️ Takeaway"
                : "🚗 Delivery"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-mono text-sm font-bold",
              isCritical
                ? "text-red-600 dark:text-red-400"
                : isUrgent
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-ink-secondary dark:text-stone-400",
            )}
          >
            ⏱ {elapsed}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 px-4 py-3">
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-md bg-stone-100 text-xs font-bold text-ink dark:bg-dark-surface dark:text-stone-300">
                {item.quantity}×
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink leading-tight dark:text-white">
                  {item.menuItem?.name || "Item"}
                </p>
                {item.notes && (
                  <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                    📝 {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="mt-3 rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
              📝 Note: {order.notes}
            </p>
          </div>
        )}
      </div>

      {/* Footer with actions */}
      <div className="border-t border-stone-100 p-3 dark:border-dark-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-ink-tertiary dark:text-stone-500">
            {formatTime(order.createdAt)}
          </span>
          <span className="text-sm font-bold text-ink dark:text-white">
            {formatCurrency(order.total)}
          </span>
        </div>

        {nextAction && (
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateStatus(order._id, nextAction.status)}
              disabled={isUpdating}
              className={cn(
                "flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50",
                nextAction.color,
              )}
            >
              {isUpdating ? "Updating..." : nextAction.label}
            </button>
            {order.status !== "ready" && (
              <button
                onClick={() => onUpdateStatus(order._id, "cancelled")}
                disabled={isUpdating}
                className="rounded-xl bg-red-50 px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
