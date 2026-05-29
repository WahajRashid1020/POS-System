"use client";

import { useState, useEffect, useCallback } from "react";
import { KitchenHeader } from "./KitchenHeader";
import { OrderCard } from "./OrderCard";
import type { Order, OrderStatus } from "@/types";

const POLL_INTERVAL = 5000; // 5 seconds

type KitchenFilter = "all" | "pending" | "preparing" | "ready";

export function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<KitchenFilter>("all");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch active orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?limit=50");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();

      // Only show active orders (not completed/cancelled)
      const activeOrders = data.orders.filter(
        (o: Order) =>
          o.status === "pending" ||
          o.status === "preparing" ||
          o.status === "ready",
      );

      setOrders(activeOrders);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for new orders
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Update order status
  const updateStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      setUpdatingId(orderId);
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) throw new Error("Failed to update");

        // Optimistic update
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: newStatus } : o,
          ),
        );

        // If completed, remove after a short delay
        if (newStatus === "completed") {
          setTimeout(() => {
            setOrders((prev) => prev.filter((o) => o._id !== orderId));
          }, 1500);
        }
      } catch (err) {
        console.error("Update failed:", err);
        fetchOrders(); // Re-fetch on error
      } finally {
        setUpdatingId(null);
      }
    },
    [fetchOrders],
  );

  // Filter orders
  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  // Count by status
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
  };

  return (
    <div className="flex h-full flex-col">
      <KitchenHeader
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
        lastUpdated={lastUpdated}
        onRefresh={fetchOrders}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-300 border-t-brand-500" />
              <p className="text-sm text-ink-secondary">Loading orders...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-2xl bg-red-50 p-8 text-center">
              <span className="text-4xl">⚠️</span>
              <p className="mt-3 font-medium text-red-700">{error}</p>
              <p className="mt-1 text-sm text-red-500">
                Check your database connection
              </p>
              <button
                onClick={fetchOrders}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <span className="text-6xl">👨‍🍳</span>
              <p className="mt-4 text-lg font-medium text-ink-secondary">
                {filter === "all" ? "No active orders" : `No ${filter} orders`}
              </p>
              <p className="mt-1 text-sm text-ink-tertiary">
                New orders will appear here automatically
              </p>
            </div>
          </div>
        )}

        {!loading && !error && filteredOrders.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOrders
              .sort((a, b) => {
                // Sort: pending first, then preparing, then ready
                const statusOrder = { pending: 0, preparing: 1, ready: 2 };
                const aOrder =
                  statusOrder[a.status as keyof typeof statusOrder] ?? 3;
                const bOrder =
                  statusOrder[b.status as keyof typeof statusOrder] ?? 3;
                if (aOrder !== bOrder) return aOrder - bOrder;
                // Within same status, oldest first
                return (
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
                );
              })
              .map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onUpdateStatus={updateStatus}
                  isUpdating={updatingId === order._id}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
