"use client";

import Skeleton from "@/components/ui/Skeleton";

export default function BookingsHistorySkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 sm:items-center sm:gap-4 dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-28 rounded" />
            </div>
            <Skeleton className="h-4 w-3/4 max-w-md rounded" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
