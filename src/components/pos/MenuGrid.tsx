"use client";

import { formatCurrency } from "@/lib/utils";
import type { MenuItem } from "@/types";

interface MenuGridProps {
  items: MenuItem[];
  onAddItem: (item: MenuItem) => void;
  emptyMessage?: string;
}

export function MenuGrid({ items, onAddItem, emptyMessage }: MenuGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-ink-tertiary dark:text-stone-500">
        <p>{emptyMessage ?? "No items in this category"}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <MenuItemCard
            key={item.name}
            item={item}
            onAdd={() => onAddItem(item)}
          />
        ))}
      </div>
    </div>
  );
}

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  const isPopular = item.tags?.includes("popular");

  return (
    <button
      onClick={onAdd}
      className="touch-target group relative flex flex-col rounded-xl border border-stone-200 bg-white p-4 text-left transition-all hover:border-brand-300 hover:shadow-md hover:shadow-brand-500/10 active:scale-[0.97] dark:border-dark-border dark:bg-dark-card dark:hover:border-dark-accent dark:hover:bg-dark-hover"
    >
      {isPopular && (
        <span className="absolute -top-2 right-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
          Popular
        </span>
      )}

      <span className="text-lg font-semibold text-ink leading-tight dark:text-white">
        {item.name}
      </span>

      {item.preparationTime && item.preparationTime > 0 ? (
        <span className="mt-1 text-xs text-ink-tertiary dark:text-stone-500">
          ~{item.preparationTime} min
        </span>
      ) : null}

      <span className="mt-auto pt-3 text-base font-bold text-brand-600 dark:text-brand-400">
        {formatCurrency(item.price)}
      </span>

      <div className="absolute inset-0 rounded-xl bg-brand-500/5 opacity-0 transition-opacity group-active:opacity-100" />
    </button>
  );
}
