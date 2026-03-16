"use client";

import Skeleton from "@/components/ui/Skeleton";

const cardClass =
  "overflow-hidden rounded-2xl border border-zinc-200/60 bg-zinc-100/80 p-4 dark:border-zinc-700/60 dark:bg-zinc-800/70";

const cardTitleSkeletonClass =
  "mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700";

/**
 * Skeleton con la misma estructura que DashboardChartsSection:
 * Grid 3 cols → Grid 2 cols → Ingresos → Próximas escalas → Timeline de muelles (al final).
 */
export default function DashboardChartsSkeleton() {
  return (
    <div className="mt-8 space-y-8">
      <div className="min-w-0 space-y-8">
        {/* Grid: Escalas por puerto, PAX por puerto, Escalas por naviera, luego Escalas por muelle (full width) */}
        <div className="grid gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cardClass}>
              <Skeleton
                className={`h-4 w-32 rounded ${cardTitleSkeletonClass}`}
              />
              <div className="flex gap-4 pt-2">
                <div className="h-[200px] w-[200px] shrink-0 overflow-hidden rounded-full">
                  <Skeleton className="h-full w-full rounded-none" />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-3 w-full rounded" />
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div className={`${cardClass} lg:col-span-3`}>
            <Skeleton
              className={`h-4 w-40 rounded ${cardTitleSkeletonClass}`}
            />
            <Skeleton className="mt-2 h-72 w-full rounded-lg" />
          </div>
        </div>

        {/* Grid: Escalas por mes, PAX por mes, luego Escalas y PAX por año (full width) */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={cardClass}>
            <Skeleton
              className={`h-4 w-36 rounded ${cardTitleSkeletonClass}`}
            />
            <Skeleton className="mt-2 h-72 w-full rounded-lg" />
          </div>
          <div className={cardClass}>
            <Skeleton
              className={`h-4 w-40 rounded ${cardTitleSkeletonClass}`}
            />
            <Skeleton className="mt-2 h-72 w-full rounded-lg" />
          </div>
          <div className={`${cardClass} lg:col-span-2`}>
            <Skeleton
              className={`h-4 w-44 rounded ${cardTitleSkeletonClass}`}
            />
            <Skeleton className="mt-2 h-72 w-full rounded-lg" />
          </div>
        </div>

        {/* Ingresos estimados (muellaje): una sola card con gráfica de barras */}
        <div className={cardClass}>
          <Skeleton
            className={`h-4 w-52 rounded ${cardTitleSkeletonClass}`}
          />
          <Skeleton className="mb-3 mt-0 h-3 w-28 rounded" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
          <Skeleton className="mt-2 h-3 w-full max-w-md rounded" />
        </div>

        {/* Próximas escalas: card con tabla (header + filas) */}
        <div className={cardClass}>
          <Skeleton
            className={`h-4 w-40 rounded ${cardTitleSkeletonClass}`}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="pb-2 pr-3 pt-0">
                    <Skeleton className="h-3 w-14 rounded" />
                  </th>
                  <th className="hidden pb-2 pr-3 pt-0 sm:table-cell">
                    <Skeleton className="h-3 w-24 rounded" />
                  </th>
                  <th className="hidden pb-2 pr-3 pt-0 md:table-cell">
                    <Skeleton className="h-3 w-16 rounded" />
                  </th>
                  <th className="pb-2 pr-3 pt-0">
                    <Skeleton className="h-3 w-12 rounded" />
                  </th>
                  <th className="pb-2 pr-3 pt-0 text-right">
                    <Skeleton className="ml-auto h-3 w-10 rounded" />
                  </th>
                  <th className="hidden pb-2 pr-3 pt-0 text-right lg:table-cell">
                    <Skeleton className="ml-auto h-3 w-8 rounded" />
                  </th>
                  <th className="w-8 pb-2 pl-2 pt-0" aria-hidden />
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <tr
                    key={i}
                    className="border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
                  >
                    <td className="py-3 pr-3">
                      <Skeleton className="h-4 w-24 rounded" />
                    </td>
                    <td className="hidden py-3 pr-3 sm:table-cell">
                      <Skeleton className="h-4 w-32 rounded" />
                    </td>
                    <td className="hidden py-3 pr-3 md:table-cell">
                      <Skeleton className="h-4 w-20 rounded" />
                    </td>
                    <td className="py-3 pr-3">
                      <Skeleton className="h-4 w-20 rounded" />
                    </td>
                    <td className="py-3 pr-3 text-right">
                      <Skeleton className="ml-auto h-5 w-14 rounded-md" />
                    </td>
                    <td className="hidden py-3 pr-3 text-right lg:table-cell">
                      <Skeleton className="ml-auto h-4 w-8 rounded" />
                    </td>
                    <td className="py-3 pl-2">
                      <Skeleton className="h-6 w-6 rounded-md" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
          </div>
        </div>

        {/* Alertas operativas */}
        <div className={cardClass}>
          <Skeleton className={`h-5 w-40 rounded ${cardTitleSkeletonClass}`} />
          <Skeleton className="mt-2 h-3 w-56 rounded" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>

        {/* Mapa del puerto: grid de docks */}
        <div className={cardClass}>
          <Skeleton
            className={`h-5 w-36 rounded ${cardTitleSkeletonClass}`}
          />
          <Skeleton className="mt-2 h-3 w-48 rounded" />
          <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-xl border border-zinc-200/80 p-4 dark:border-zinc-700">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="mt-2 h-4 w-20 rounded" />
                <Skeleton className="mt-3 h-4 w-24 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Timeline de muelles (al final) */}
        <div className={cardClass}>
          <div className="mb-4 flex justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-700">
            <div>
              <Skeleton className="h-5 w-44 rounded" />
              <Skeleton className="mt-2 h-3 w-72 rounded" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-700">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="bg-zinc-100/80 dark:bg-zinc-800/80">
                  <th className="py-3 pl-4 pr-3">
                    <Skeleton className="h-3 w-28 rounded" />
                  </th>
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <th key={i} className="min-w-[80px] py-3 px-2">
                      <Skeleton className="mx-auto h-3 w-10 rounded" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
                    <td className="py-2.5 pl-4 pr-3">
                      <Skeleton className="h-4 w-36 rounded" />
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <td key={j} className="min-w-[80px] py-2 px-1.5">
                        <Skeleton className="mx-auto h-7 w-16 rounded-md" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
