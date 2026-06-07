"use client";

const COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  emerald: { bg: "bg-emerald-50", icon: "bg-emerald-100" },
  blue: { bg: "bg-blue-50", icon: "bg-blue-100" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-100" },
  amber: { bg: "bg-amber-50", icon: "bg-amber-100" },
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
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-ink-tertiary uppercase tracking-wide">
          {label}
        </p>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.icon}`}
        >
          <span className="text-base">{icon}</span>
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
