"use client";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
}

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export function Logo({ size = "md", showText = false, subtitle }: LogoProps) {
  return (
    <div className="flex items-center gap-3 ">
      <div
        className={`${SIZES[size]} relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 font-bold text-white shadow-lg shadow-brand-500/30`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[60%] w-[60%]"
        >
          {/* Lightning bolt / speed icon */}
          <path
            d="M22 4L8 22h10l-4 14L28 18H18l4-14z"
            fill="white"
            fillOpacity="0.95"
          />
        </svg>
        {/* Subtle shine effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/10 to-white/20" />
      </div>

      {showText && (
        <div>
          <h1
            className={`font-bold tracking-tight text-ink dark:text-white ${
              size === "xl" ? "text-2xl" : size === "lg" ? "text-xl" : "text-lg"
            }`}
          >
            Quick<span className="text-brand-500">Serve</span>
          </h1>
          {subtitle && (
            <p className="text-xs text-ink-tertiary dark:text-stone-500">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
