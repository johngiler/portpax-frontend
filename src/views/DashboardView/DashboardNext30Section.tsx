"use client";

import { CalendarClock } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import type { DashboardNext30Days } from "@/types/dashboard";

type DashboardNext30SectionProps = {
  data: DashboardNext30Days;
};

export default function DashboardNext30Section({ data }: DashboardNext30SectionProps) {
  return (
    <ViewSection
      icon={CalendarClock}
      title="Próximos 30 días"
      description={`Calls confirmados (CO / CL / LTA / LTD) del ${data.date_from} al ${data.date_to}.`}
    >
      <div className="px-5 py-4 sm:px-6">
        <div className="mb-4 flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-300">
          <span>
            <strong className="tabular-nums text-zinc-900 dark:text-zinc-50">
              {data.total_confirmed.toLocaleString("es")}
            </strong>{" "}
            calls
          </span>
          <span>
            <strong className="tabular-nums text-zinc-900 dark:text-zinc-50">
              {data.planned_pax.toLocaleString("es")}
            </strong>{" "}
            PAX planificado
          </span>
        </div>

        {data.by_port.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No hay calls confirmados en los próximos 30 días con los filtros actuales.
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
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {row.calls.toLocaleString("es")} calls
                  </p>
                  <p className="text-[11px] tabular-nums text-zinc-500">
                    {row.planned_pax.toLocaleString("es")} PAX
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ViewSection>
  );
}
