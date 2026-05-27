"use client";

import { useState, useCallback, useEffect } from "react";
import { CategoryTabs } from "./CategoryTabs";
import { MenuGrid } from "./MenuGrid";
import { OrderSidebar } from "./OrderSidebar";
import { OrderSuccessModal } from "./OrderSuccessModal";
import { RecentOrders } from "./RecentOrders";
import { SEED_CATEGORIES, SEED_MENU_ITEMS } from "@/lib/seed-data";
import type { CartItem, MenuItem, OrderType } from "@/types";

export function POSTerminal() {
  const [activeCategory, setActiveCategory] = useState("burgers");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecentOrders, setShowRecentOrders] = useState(false);

  // Success modal state
  const [successOrder, setSuccessOrder] = useState<{
    orderNumber: number;
    total: number;
    paymentMethod: string;
  } | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Filter menu items by active category
  const filteredItems = SEED_MENU_ITEMS.filter(
    (item) => item.category === activeCategory && item.isAvailable
  ) as MenuItem[];

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.name === item.name);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.name === item.name
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((itemName: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) =>
          ci.menuItem.name === itemName
            ? { ...ci, quantity: ci.quantity + delta }
            : ci
        )
        .filter((ci) => ci.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((itemName: string) => {
    setCart((prev) => prev.filter((ci) => ci.menuItem.name !== itemName));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // =============================================
  // PLACE ORDER — POST to /api/orders
  // =============================================
  const handlePlaceOrder = useCallback(
    async (paymentMethod: "cash" | "card") => {
      if (cart.length === 0) return;
      setIsSubmitting(true);

      try {
        const orderItems = cart.map((ci) => ({
          menuItem: {
            name: ci.menuItem.name,
            price: ci.menuItem.price,
            category: ci.menuItem.category,
          },
          quantity: ci.quantity,
          price: ci.menuItem.price,
          notes: ci.notes,
        }));

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: orderItems,
            type: orderType,
            paymentMethod,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to place order");
        }

        const { order } = await res.json();

        // Show success
        setSuccessOrder({
          orderNumber: order.orderNumber,
          total: order.total,
          paymentMethod,
        });
        setCart([]);
        setToast({
          message: `Order #${order.orderNumber} placed!`,
          type: "success",
        });
      } catch (error: any) {
        console.error("Order failed:", error);
        setToast({
          message:
            error.message ||
            "Failed to place order. Check your database connection.",
          type: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [cart, orderType]
  );

  return (
    <div className="relative flex h-full">
      {/* Left side: Menu */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white font-bold text-sm">
              QS
            </div>
            <div>
              <h1 className="text-lg font-semibold text-ink">QuickServe</h1>
              <p className="text-xs text-ink-tertiary">POS Terminal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowRecentOrders(!showRecentOrders)}
              className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-stone-50"
            >
              📋 Recent Orders
            </button>
            <div className="flex items-center gap-2 text-sm text-ink-secondary">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Online
            </div>
          </div>
        </header>

        {/* Category tabs */}
        <CategoryTabs
          categories={SEED_CATEGORIES}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />

        {/* Menu grid */}
        <MenuGrid items={filteredItems} onAddItem={addToCart} />
      </div>

      {/* Right side: Order sidebar */}
      <OrderSidebar
        items={cart}
        orderType={orderType}
        onChangeOrderType={setOrderType}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onPlaceOrder={handlePlaceOrder}
        isSubmitting={isSubmitting}
      />

      {/* Toast notification */}
      {toast && (
        <div
          className={`absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl px-5 py-3 shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{toast.type === "success" ? "✓" : "✕"}</span>
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-white/80 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Success modal */}
      {successOrder && (
        <OrderSuccessModal
          orderNumber={successOrder.orderNumber}
          total={successOrder.total}
          paymentMethod={successOrder.paymentMethod}
          onClose={() => setSuccessOrder(null)}
        />
      )}

      {/* Recent orders slide-over */}
      {showRecentOrders && (
        <RecentOrders onClose={() => setShowRecentOrders(false)} />
      )}
    </div>
  );
}
