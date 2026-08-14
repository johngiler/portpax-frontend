"use client";

import Skeleton from "@/components/ui/Skeleton";

const COLS = 9;
const ROWS = 6;

export default function BulkBookingsEditSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando reservas">
      <Skeleton className="h-3 w-80 max-w-full rounded" />
      <Skeleton className="h-4 w-44 rounded" />
      <div className="max-h-[min(60vh,32rem)] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              {Array.from({ length: COLS }).map((_, i) => (
                <th key={i} className="px-2 py-2">
                  <Skeleton className="h-3 w-14 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }).map((_, row) => (
              <tr
                key={row}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                {Array.from({ length: COLS }).map((_, col) => (
                  <td key={col} className="px-2 py-2">
                    <Skeleton
                      className={
                        col === 0 ? "h-4 w-4 rounded" : "h-8 w-full min-w-[5rem] rounded-md"
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
