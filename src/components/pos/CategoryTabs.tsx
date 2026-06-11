"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryTabsProps {
  categories: Omit<Category, "_id">[];
  activeCategory: string;
  onSelect: (slug: string) => void;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onSelect,
}: CategoryTabsProps) {
  return (
    <div className="border-b border-stone-200 bg-white dark:border-dark-border dark:bg-dark-card">
      <div className="flex gap-1.5 overflow-x-auto px-4 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories
          .filter((c) => c.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((category) => (
            <button
              key={category.slug}
              onClick={() => onSelect(category.slug)}
              className={cn(
                "touch-target flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                activeCategory === category.slug
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
                  : "bg-stone-100 text-ink-secondary hover:bg-stone-200 dark:bg-dark-surface dark:text-stone-400 dark:hover:bg-dark-hover",
              )}
            >
              <span className="text-base">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
      </div>
    </div>
  );
}
