"use client";

import { useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

interface OrderSuccessModalProps {
  orderNumber: number;
  total: number;
  paymentMethod: string;
  onClose: () => void;
}

export function OrderSuccessModal({
  orderNumber,
  total,
  paymentMethod,
  onClose,
}: OrderSuccessModalProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[360px] rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-dark-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <svg
            className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-ink dark:text-white">
          Order Placed!
        </h2>

        <div className="mt-4 rounded-xl bg-stone-50 p-4 dark:bg-dark-surface">
          <p className="text-sm text-ink-secondary dark:text-stone-400">
            Order Number
          </p>
          <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">
            #{orderNumber}
          </p>
        </div>

        <div className="mt-4 flex justify-between text-sm">
          <span className="text-ink-secondary dark:text-stone-400">Total</span>
          <span className="font-semibold text-ink dark:text-white">
            {formatCurrency(total)}
          </span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-ink-secondary dark:text-stone-400">
            Payment
          </span>
          <span className="font-semibold text-ink capitalize dark:text-white">
            {paymentMethod === "cash" ? "💵 Cash" : "💳 Card"}
          </span>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          New Order
        </button>

        <p className="mt-2 text-xs text-ink-tertiary dark:text-stone-500">
          Auto-closing in 5 seconds...
        </p>
      </div>
    </div>
  );
}
