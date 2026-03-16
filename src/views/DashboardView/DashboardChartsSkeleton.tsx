"use client";

import Skeleton from "@/components/ui/Skeleton";

const cardClass =
  "overflow-hidden rounded-2xl border border-zinc-200/60 bg-zinc-100/80 p-4 dark:border-zinc-700/60 dark:bg-zinc-800/70";

/**
 * Skeleton con la misma estructura que DashboardChartsSection:
 * Resumen métricas → Grid (Próximas escalas, barras) → Grid (líneas)
 */
export default function DashboardChartsSkeleton() {
  return (
    <div className="mt-8 space-y-8">
      <div className="min-w-0 space-y-8">
        <div className={cardClass}>
          <Skeleton className="mb-4 h-4 w-40 rounded" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
        <div className={cardClass}>
          <Skeleton className="mb-4 h-4 w-48 rounded" />
          <div className="flex gap-4">
            <Skeleton className="h-14 w-48 rounded-lg" />
            <Skeleton className="h-14 flex-1 rounded-lg" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={cardClass}>
            <Skeleton className="mb-4 h-4 w-36 rounded" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
            <Skeleton className="mt-3 h-4 w-40 rounded" />
          </div>
          <div className={cardClass}>
            <Skeleton className="mb-4 h-4 w-36 rounded" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className={cardClass}>
            <Skeleton className="mb-4 h-4 w-32 rounded" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className={cardClass}>
            <Skeleton className="mb-4 h-4 w-40 rounded" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className={`${cardClass} lg:col-span-2`}>
            <Skeleton className="mb-4 h-4 w-40 rounded" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={cardClass}>
            <Skeleton className="mb-4 h-4 w-36 rounded" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
          <div className={cardClass}>
            <Skeleton className="mb-4 h-4 w-40 rounded" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
          <div className={`${cardClass} lg:col-span-2`}>
            <Skeleton className="mb-4 h-4 w-44 rounded" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
