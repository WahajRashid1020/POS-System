"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Logo } from "@/components/shared/Logo";

const DEMO_ROLES = [
  {
    role: "admin",
    label: "Admin",
    icon: "👑",
    description: "Full access to everything",
    color:
      "border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:border-purple-900 dark:hover:border-purple-600 dark:hover:bg-purple-950/30",
  },
  {
    role: "manager",
    label: "Manager",
    icon: "📊",
    description: "POS, kitchen, and reports",
    color:
      "border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-900 dark:hover:border-blue-600 dark:hover:bg-blue-950/30",
  },
  {
    role: "cashier",
    label: "Cashier",
    icon: "💳",
    description: "POS terminal only",
    color:
      "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/30",
  },
  {
    role: "kitchen",
    label: "Kitchen",
    icon: "👨‍🍳",
    description: "Kitchen display only",
    color:
      "border-amber-200 hover:border-amber-400 hover:bg-amber-50 dark:border-amber-900 dark:hover:border-amber-600 dark:hover:bg-amber-950/30",
  },
];

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleDemoLogin = async (role: string) => {
    setLoading(role);
    await signIn("credentials", {
      role,
      callbackUrl: role === "kitchen" ? "/kitchen" : "/pos",
    });
  };

  const handleGoogleLogin = async () => {
    setLoading("google");
    await signIn("google", { callbackUrl: "/pos" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 dark:bg-dark-bg">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="p-8 flex flex-col items-center">
          <Logo size="xl" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink dark:text-white">
            Quick<span className="text-brand-500">Serve</span>
          </h1>
          <p className="mt-1 text-sm text-ink-secondary dark:text-stone-400">
            Sign in to your account
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading !== null}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3.5 text-sm font-medium text-ink transition-all hover:bg-stone-50 hover:shadow-sm disabled:opacity-50 dark:border-dark-border dark:bg-dark-card dark:text-white dark:hover:bg-dark-hover"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {loading === "google" ? "Signing in..." : "Continue with Google"}
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200 dark:bg-dark-border" />
          <span className="text-xs font-medium text-ink-tertiary dark:text-stone-500">
            OR USE A DEMO ACCOUNT
          </span>
          <div className="h-px flex-1 bg-stone-200 dark:bg-dark-border" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {DEMO_ROLES.map((demo) => (
            <button
              key={demo.role}
              onClick={() => handleDemoLogin(demo.role)}
              disabled={loading !== null}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 bg-white p-4 transition-all disabled:opacity-50 dark:bg-dark-card ${demo.color}`}
            >
              <span className="text-2xl">{demo.icon}</span>
              <span className="text-sm font-semibold text-ink dark:text-white">
                {demo.label}
              </span>
              <span className="text-[11px] text-ink-tertiary text-center dark:text-stone-500">
                {demo.description}
              </span>
              {loading === demo.role && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-brand-500" />
              )}
            </button>
          ))}
        </div>

        <p className="m-6 text-center text-xs text-ink-tertiary dark:text-stone-600">
          Demo accounts require no setup · Google login saves your account
        </p>
      </div>
    </div>
  );
}
