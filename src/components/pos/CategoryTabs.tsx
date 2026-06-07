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
    <div className="flex gap-1 overflow-x-auto border-b border-stone-200 bg-white px-4 py-2 scrollbar-hide">
      {categories
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((category) => (
          <button
            key={category.slug}
            onClick={() => onSelect(category.slug)}
            className={cn(
              "touch-target flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
              activeCategory === category.slug
                ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
                : "bg-stone-100 text-ink-secondary hover:bg-stone-200",
            )}
          >
            <span className="text-lg sm:text-base">{category.icon}</span>
            <span className="hidden sm:inline">{category.name}</span>
          </button>
        ))}
    </div>
  );
}
