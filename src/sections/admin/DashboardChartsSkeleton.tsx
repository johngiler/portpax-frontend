"use client";

import Skeleton from "@/components/ui/Skeleton";

const cardClass =
  "overflow-hidden rounded-2xl border border-zinc-200/60 bg-zinc-100/80 p-4 dark:border-zinc-700/60 dark:bg-zinc-800/70";

/**
 * Skeleton con la misma estructura que DashboardChartsSection.
 * Fondo gris tipo placeholder (sin blanco) para que todo el bloque se vea como datos falsos.
 */
export default function DashboardChartsSkeleton() {
  return (
    <div className="mt-8 space-y-8">
      <div className="min-w-0 space-y-8">
        {/* Resumen de métricas */}
        <div className={cardClass}>
          <Skeleton className="mb-4 h-4 w-40 rounded" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>

        {/* Grid pasteles: 3 cards, la tercera ocupa 2 cols en lg */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={cardClass}>
            <Skeleton className="mb-4 h-4 w-48 rounded" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
          <div className={cardClass}>
            <Skeleton className="mb-4 h-4 w-40 rounded" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
          <div className={`${cardClass} lg:col-span-2`}>
            <Skeleton className="mb-4 h-4 w-36 rounded" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        </div>

        {/* Gráficas de líneas: 2 columnas + 1 ancho completo */}
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
