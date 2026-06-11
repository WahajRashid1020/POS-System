"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-2xl font-bold text-white">
          QS
        </div>
        <h1 className="text-2xl font-bold text-ink">QuickServe POS</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Select a screen to open
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/pos"
            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-6 py-4 text-left transition-all hover:border-brand-300 hover:shadow-md"
          >
            <span className="text-3xl">💳</span>
            <div>
              <p className="font-semibold text-ink">POS Terminal</p>
              <p className="text-xs text-ink-tertiary">
                Take orders & payments
              </p>
            </div>
          </Link>

          <Link
            href="/kitchen"
            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-6 py-4 text-left transition-all hover:border-brand-300 hover:shadow-md"
          >
            <span className="text-3xl">👨‍🍳</span>
            <div>
              <p className="font-semibold text-ink">Kitchen Display</p>
              <p className="text-xs text-ink-tertiary">
                Manage & prepare orders
              </p>
            </div>
          </Link>

          <Link
            href="/reports"
            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-6 py-4 text-left transition-all hover:border-brand-300 hover:shadow-md"
          >
            <span className="text-3xl">📊</span>
            <div>
              <p className="font-semibold text-ink">Sales Reports</p>
              <p className="text-xs text-ink-tertiary">Revenue & insights</p>
            </div>
          </Link>
          <Link
            href="/chat"
            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-6 py-4 text-left transition-all hover:border-brand-300 hover:shadow-md"
          >
            <span className="text-3xl">🤖</span>
            <div>
              <p className="font-semibold text-ink">AI Manager</p>
              <p className="text-xs text-ink-tertiary">Ask about your sales</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
