"use client";

import { cn, formatCurrency } from "@/lib/utils";
import type { CartItem, OrderType } from "@/types";

interface OrderSidebarProps {
  items: CartItem[];
  orderType: OrderType;
  onChangeOrderType: (type: OrderType) => void;
  onUpdateQuantity: (itemName: string, delta: number) => void;
  onRemoveItem: (itemName: string) => void;
  onClearCart: () => void;
  onPlaceOrder: (paymentMethod: "cash" | "card") => void;
  isSubmitting?: boolean;
  onClose?: () => void;
}

const TAX_RATE = 0.09;

const ORDER_TYPES: { value: OrderType; label: string; icon: string }[] = [
  { value: "dine-in", label: "Dine In", icon: "🍽️" },
  { value: "takeaway", label: "Takeaway", icon: "🛍️" },
  { value: "delivery", label: "Delivery", icon: "🚗" },
];

export function OrderSidebar({
  items,
  orderType,
  onChangeOrderType,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onPlaceOrder,
  isSubmitting = false,
  onClose,
}: OrderSidebarProps) {
  const subtotal = items.reduce(
    (sum, ci) => sum + ci.menuItem.price * ci.quantity,
    0,
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const itemCount = items.reduce((sum, ci) => sum + ci.quantity, 0);

  return (
    <div className="flex h-full w-[380px] flex-col border-l border-stone-200 bg-white max-lg:w-full">
      {/* Mobile close button */}
      {onClose && (
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 lg:hidden">
          <h2 className="text-base font-semibold text-ink">Your Order</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-tertiary hover:bg-stone-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Order type toggle */}
      <div className="border-b border-stone-200 p-4">
        <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
          {ORDER_TYPES.map((ot) => (
            <button
              key={ot.value}
              onClick={() => onChangeOrderType(ot.value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all",
                orderType === ot.value
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-tertiary hover:text-ink-secondary",
              )}
            >
              <span>{ot.icon}</span>
              <span>{ot.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Order header */}
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">
          Current Order
          {itemCount > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
              {itemCount}
            </span>
          )}
        </h2>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs font-medium text-red-500 hover:text-red-600"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-tertiary">
            <span className="text-4xl">🛒</span>
            <p className="text-sm">No items yet</p>
            <p className="text-xs">Tap menu items to add</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 px-4">
            {items.map((ci) => (
              <CartItemRow
                key={ci.menuItem.name}
                item={ci}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Totals & place order */}
      {items.length > 0 && (
        <div className="border-t border-stone-200 p-4">
          <div className="mb-4 space-y-1.5">
            <div className="flex justify-between text-sm text-ink-secondary">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-ink-secondary">
              <span>VAT (9%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-lg font-bold text-ink">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onPlaceOrder("cash")}
              disabled={isSubmitting}
              className="touch-target flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "💵 Cash"}
            </button>
            <button
              onClick={() => onPlaceOrder("card")}
              disabled={isSubmitting}
              className="touch-target flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "💳 Card"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (name: string, delta: number) => void;
  onRemove: (name: string) => void;
}) {
  const lineTotal = item.menuItem.price * item.quantity;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">
          {item.menuItem.name}
        </p>
        <p className="text-xs text-ink-tertiary">
          {formatCurrency(item.menuItem.price)} each
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQuantity(item.menuItem.name, -1)}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-100 text-sm font-medium text-ink-secondary transition-colors hover:bg-stone-200"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold text-ink">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(item.menuItem.name, 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-100 text-sm font-medium text-ink-secondary transition-colors hover:bg-stone-200"
        >
          +
        </button>
      </div>

      <span className="w-16 text-right text-sm font-semibold text-ink">
        {formatCurrency(lineTotal)}
      </span>

      <button
        onClick={() => onRemove(item.menuItem.name)}
        className="flex h-6 w-6 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-red-50 hover:text-red-500"
      >
        ×
      </button>
    </div>
  );
}
