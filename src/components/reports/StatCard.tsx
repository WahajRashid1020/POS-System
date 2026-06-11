"use client";

const COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    icon: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    icon: "bg-blue-100 dark:bg-blue-900/40",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    icon: "bg-purple-100 dark:bg-purple-900/40",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    icon: "bg-amber-100 dark:bg-amber-900/40",
  },
};

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
}

export function StatCard({ label, value, icon, color }: StatCardProps) {
  const colors = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-ink-tertiary uppercase tracking-wide dark:text-stone-500">
          {label}
        </p>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.icon}`}
        >
          <span className="text-base">{icon}</span>
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-ink dark:text-white">
        {value}
      </p>
    </div>
  );
}
