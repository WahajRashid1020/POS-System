"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-stone-200 dark:bg-dark-surface",
        className,
      )}
    />
  );
}

export function MenuGridSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-xl border border-stone-200 bg-white p-4 dark:border-dark-border dark:bg-dark-card"
          >
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/3" />
            <Skeleton className="mt-4 h-5 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-stone-200 p-4 dark:border-dark-border dark:bg-dark-surface"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="mt-3 flex justify-between border-t border-stone-100 pt-3 dark:border-dark-border">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function KitchenCardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border-2 border-stone-200 bg-white dark:border-dark-border dark:bg-dark-card"
        >
          <Skeleton className="h-11 w-full rounded-none" />
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card"
          >
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-8 w-24" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-3 w-48" />
        <Skeleton className="mt-4 h-[300px] w-full rounded-xl" />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Skeleton className="h-20 w-20 rounded-3xl" />
      <Skeleton className="mt-6 h-7 w-48" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
