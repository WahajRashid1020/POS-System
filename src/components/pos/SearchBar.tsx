"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="border-b border-stone-200 bg-white px-4 py-2.5 dark:border-dark-border dark:bg-dark-card">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary dark:text-stone-500" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search items…"
          aria-label="Search menu items"
          className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-9 pr-9 text-sm text-ink placeholder:text-ink-tertiary focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-dark-border dark:bg-dark-surface dark:text-white dark:placeholder:text-stone-500 dark:focus:bg-dark-card"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-tertiary hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-dark-hover"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
