"use client";

import { CirclePause } from "lucide-react";
import Link from "next/link";
import ViewSection from "@/components/layout/ViewSection";
import type { DashboardActionQueue } from "@/types/dashboard";

type DashboardActionQueueSectionProps = {
  data: DashboardActionQueue;
};

export default function DashboardActionQueueSection({
  data,
}: DashboardActionQueueSectionProps) {
  return (
    <ViewSection
      icon={CirclePause}
      title="Cola de acción"
      description="Holds y nuevas solicitudes con fecha de call desde hoy (requieren seguimiento)."
      actions={
        <Link
          href="/bookings?status=action"
          className="text-sm font-medium text-[var(--admin-accent)] hover:underline"
        >
          Ver reservas
        </Link>
      }
    >
      <div className="px-5 py-4 sm:px-6">
        {data.by_port.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No hay Holds ni NR pendientes desde {data.as_of}.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.by_port.map((row) => (
              <li
                key={row.port_id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {row.name}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                    {row.code}
                  </p>
                </div>
                <div className="flex shrink-0 gap-4 text-right text-sm">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      Hold
                    </p>
                    <p className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {row.holds}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-orange-600 dark:text-orange-400">
                      NR
                    </p>
                    <p className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {row.new_requests}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ViewSection>
  );
}
