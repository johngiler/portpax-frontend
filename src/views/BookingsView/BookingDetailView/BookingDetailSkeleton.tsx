"use client";

import Skeleton from "@/components/ui/Skeleton";

export default function BookingDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="space-y-4 px-5 py-4">
          <Skeleton className="h-4 w-28 rounded" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
          <Skeleton className="h-8 w-56 max-w-full rounded" />
          <Skeleton className="h-4 w-72 max-w-full rounded" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
        <Skeleton className="mb-2 h-4 w-40 rounded" />
        <Skeleton className="mb-4 h-3 w-64 max-w-full rounded" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
        <Skeleton className="h-10 w-48 rounded-md" />
      </div>
    </div>
  );
}
