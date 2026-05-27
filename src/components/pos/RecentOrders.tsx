"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatTime } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

interface RecentOrdersProps {
  onClose: () => void;
}

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending" },
  preparing: { bg: "bg-blue-100", text: "text-blue-800", label: "Preparing" },
  ready: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Ready" },
  completed: { bg: "bg-stone-100", text: "text-stone-600", label: "Completed" },
  cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
};

export function RecentOrders({ onClose }: RecentOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await fetch("/api/orders?limit=20");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update order");

      // Refresh the list
      fetchOrders();
    } catch (err) {
      console.error("Update failed:", err);
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="w-[440px] overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">Recent Orders</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-tertiary hover:bg-stone-100"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center py-12 text-ink-tertiary">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-brand-500" />
              <span className="ml-3 text-sm">Loading orders...</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <p className="mt-1 text-xs text-red-400">
                Make sure MongoDB is connected in .env.local
              </p>
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="py-12 text-center text-ink-tertiary">
              <span className="text-4xl">📋</span>
              <p className="mt-2 text-sm">No orders yet</p>
              <p className="text-xs">Place your first order to see it here</p>
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <div className="space-y-3">
              {orders.map((order) => {
                const statusStyle =
                  STATUS_STYLES[order.status as OrderStatus] ||
                  STATUS_STYLES.pending;

                return (
                  <div
                    key={order._id}
                    className="rounded-xl border border-stone-200 p-4"
                  >
                    {/* Order header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-ink">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      <span className="text-xs text-ink-tertiary">
                        {formatTime(order.createdAt)}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="mt-2 space-y-1">
                      {order.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-sm text-ink-secondary"
                        >
                          <span>
                            {item.quantity}× {item.menuItem?.name || "Item"}
                          </span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                      <div className="flex items-center gap-2 text-xs text-ink-tertiary">
                        <span className="capitalize">{order.type}</span>
                        <span>·</span>
                        <span className="capitalize">
                          {order.paymentMethod || "—"}
                        </span>
                      </div>
                      <span className="font-semibold text-ink">
                        {formatCurrency(order.total)}
                      </span>
                    </div>

                    {/* Quick status update buttons */}
                    {order.status !== "completed" &&
                      order.status !== "cancelled" && (
                        <div className="mt-3 flex gap-2">
                          {order.status === "pending" && (
                            <button
                              onClick={() =>
                                updateStatus(order._id, "preparing")
                              }
                              className="flex-1 rounded-lg bg-blue-50 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                            >
                              Start Preparing
                            </button>
                          )}
                          {order.status === "preparing" && (
                            <button
                              onClick={() => updateStatus(order._id, "ready")}
                              className="flex-1 rounded-lg bg-emerald-50 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                            >
                              Mark Ready
                            </button>
                          )}
                          {order.status === "ready" && (
                            <button
                              onClick={() =>
                                updateStatus(order._id, "completed")
                              }
                              className="flex-1 rounded-lg bg-stone-100 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() =>
                              updateStatus(order._id, "cancelled")
                            }
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
