"use client";

import { CalendarClock, CalendarRange } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import { formatIsoDateLabel } from "@/lib/bookingDates";

type HorizonPortRow = {
  port_id: number;
  name: string;
  code: string;
  calls: number;
  planned_pax: number;
};

type HorizonData = {
  date_from: string;
  date_to: string;
  total_confirmed: number;
  planned_pax: number;
  by_port: HorizonPortRow[];
};

type DashboardHorizonSectionProps = {
  data: HorizonData;
  variant: "current_week" | "next_30";
};

export default function DashboardHorizonSection({
  data,
  variant,
}: DashboardHorizonSectionProps) {
  const isWeek = variant === "current_week";

  return (
    <ViewSection
      icon={isWeek ? CalendarRange : CalendarClock}
      title={isWeek ? "Semana actual" : "Próximos 30 días"}
      description={`Calls confirmados (CO / CL / LTA / LTD) del ${formatIsoDateLabel(data.date_from, "short")} al ${formatIsoDateLabel(data.date_to, "short")}.`}
    >
      <div className="px-5 py-4 sm:px-6">
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
          <strong className="tabular-nums text-zinc-900 dark:text-zinc-50">
            {data.total_confirmed.toLocaleString("es")}
          </strong>{" "}
          calls
          <span className="mx-2 text-zinc-300 dark:text-zinc-600">·</span>
          <span className="tabular-nums">
            {data.planned_pax.toLocaleString("es")} PAX planificado
          </span>
        </p>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {data.by_port.map((row) => (
            <li
              key={row.port_id}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                  {row.name}
                </p>
                <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                  {row.code}
                </p>
              </div>
              <div className="shrink-0 text-right text-sm">
                <p className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {row.calls.toLocaleString("es")} calls
                </p>
                <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                  {row.planned_pax.toLocaleString("es")} PAX
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ViewSection>
  );
}
