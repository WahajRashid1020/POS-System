"use client";
import { Logo } from "@/components/shared/Logo";
import { UserMenu } from "@/components/shared/UserMenu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useState, useCallback, useEffect } from "react";
import { CategoryTabs } from "./CategoryTabs";
import { SearchBar } from "./SearchBar";
import { MenuGrid } from "./MenuGrid";
import { OrderSidebar } from "./OrderSidebar";
import { OrderSuccessModal } from "./OrderSuccessModal";
import { RecentOrders } from "./RecentOrders";
import { SEED_CATEGORIES, SEED_MENU_ITEMS } from "@/lib/seed-data";
import { createOrder } from "@/lib/api";
import { filterMenuItems } from "@/lib/menu-search";
import type { CartItem, MenuItem, OrderType } from "@/types";
import { useSession } from "next-auth/react";
import Link from "next/link";
export function POSTerminal() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const canViewReports = userRole === "admin" || userRole === "manager";
  const [activeCategory, setActiveCategory] = useState("burgers");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecentOrders, setShowRecentOrders] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const [successOrder, setSuccessOrder] = useState<{
    orderNumber: number;
    total: number;
    paymentMethod: string;
  } | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredItems = filterMenuItems(
    SEED_MENU_ITEMS,
    activeCategory,
    searchQuery,
  ) as MenuItem[];

  const handleSelectCategory = useCallback((slug: string) => {
    setActiveCategory(slug);
    setSearchQuery("");
  }, []);

  const itemCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.name === item.name);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.name === item.name
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci,
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
            : ci,
        )
        .filter((ci) => ci.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((itemName: string) => {
    setCart((prev) => prev.filter((ci) => ci.menuItem.name !== itemName));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

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

        const order = await createOrder({
          items: orderItems,
          type: orderType,
          paymentMethod,
        });

        setSuccessOrder({
          orderNumber: order.orderNumber,
          total: order.total,
          paymentMethod,
        });
        setCart([]);
        setShowCart(false);
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
    [cart, orderType],
  );

  return (
    <div className="relative flex h-full">
      {/* Left side: Menu */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:px-6 dark:border-dark-border dark:bg-dark-card">
          <Logo size="sm" showText subtitle="POS Terminal" />
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setShowRecentOrders(!showRecentOrders)}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-stone-50 md:gap-2 md:px-3 dark:border-dark-border dark:text-stone-400 dark:hover:bg-dark-hover"
            >
              📋 <span className="hidden sm:inline">Recent Orders</span>
            </button>
            {canViewReports && (
              <Link
                href="/reports"
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-stone-50 md:gap-2 md:px-3 dark:border-dark-border dark:text-stone-400 dark:hover:bg-dark-hover"
              >
                📊 <span className="hidden sm:inline">Reports</span>
              </Link>
            )}
            {canViewReports && (
              <Link
                href="/chat"
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-stone-50 md:gap-2 md:px-3 dark:border-dark-border dark:text-stone-400 dark:hover:bg-dark-hover"
              >
                🤖 <span className="hidden sm:inline">AI</span>
              </Link>
            )}
            {/* {canViewReports && (
              <Link
                href="/menu"
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-stone-50 md:gap-2 md:px-3 dark:border-dark-border dark:text-stone-400 dark:hover:bg-dark-hover"
              >
                🍽️ <span className="hidden sm:inline">Menu</span>
              </Link>
            )} */}
            <ThemeToggle />
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 text-sm text-ink-secondary md:flex dark:text-stone-400">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Online
              </div>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Search bar */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Category tabs */}
        <CategoryTabs
          categories={SEED_CATEGORIES}
          activeCategory={activeCategory}
          onSelect={handleSelectCategory}
        />

        {/* Menu grid */}
        <MenuGrid
          items={filteredItems}
          onAddItem={addToCart}
          emptyMessage={
            searchQuery.trim()
              ? `No items match “${searchQuery.trim()}”`
              : undefined
          }
        />
      </div>

      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:block">
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
      </div>

      {/* Mobile cart overlay */}
      {showCart && (
        <div className="absolute inset-0 z-30 flex lg:hidden">
          <div
            className="flex-1 bg-black/30"
            onClick={() => setShowCart(false)}
          />
          <div className="w-full max-w-[380px]">
            <OrderSidebar
              items={cart}
              orderType={orderType}
              onChangeOrderType={setOrderType}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
              onPlaceOrder={handlePlaceOrder}
              isSubmitting={isSubmitting}
              onClose={() => setShowCart(false)}
            />
          </div>
        </div>
      )}

      {/* Floating cart button — mobile only */}
      <button
        onClick={() => setShowCart(true)}
        className="fixed bottom-6 right-6 z-20 flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-4 text-white shadow-lg shadow-brand-500/30 transition-transform active:scale-95 lg:hidden"
      >
        <span className="text-lg">🛒</span>
        {itemCount > 0 && (
          <>
            <span className="text-sm font-bold">{itemCount} items</span>
            <span className="text-sm font-medium opacity-80">·</span>
            <span className="text-sm font-bold">
              €
              {cart
                .reduce((s, ci) => s + ci.menuItem.price * ci.quantity, 0)
                .toFixed(2)}
            </span>
          </>
        )}
        {itemCount === 0 && <span className="text-sm font-semibold">Cart</span>}
      </button>

      {/* Toast */}
      {toast && (
        <div
          className={`absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl px-5 py-3 shadow-lg ${
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

      {successOrder && (
        <OrderSuccessModal
          orderNumber={successOrder.orderNumber}
          total={successOrder.total}
          paymentMethod={successOrder.paymentMethod}
          onClose={() => setSuccessOrder(null)}
        />
      )}

      {showRecentOrders && (
        <RecentOrders onClose={() => setShowRecentOrders(false)} />
      )}
    </div>
  );
}
