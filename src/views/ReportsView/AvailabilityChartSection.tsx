"use client";

import ViewSection from "@/components/layout/ViewSection";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { CalendarRange, CheckCircle2, Ruler, Ship } from "lucide-react";
import type { AvailabilityReport } from "@/services/bookings/bookingService";

type Props = {
  data: AvailabilityReport;
};

export default function AvailabilityChartSection({ data }: Props) {
  return (
    <ViewSection
      icon={CalendarRange}
      title={`Availability Chart — ${data.port_name}`}
      description="Disponibilidad diaria por posición. Cada card identifica naviera, barco y LOA."
    >
      <div className="max-h-[70vh] overflow-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800">
        <table
          className="w-full table-fixed border-separate border-spacing-0 text-left"
          style={{ minWidth: `${136 + data.columns.length * 208}px` }}
        >
          <colgroup>
            <col style={{ width: "136px" }} />
            {data.columns.map((column) => (
              <col key={column.id} style={{ width: "208px" }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-30">
            <tr>
              <th className="sticky left-0 z-40 border-b border-r border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Fecha
                </span>
              </th>
              {data.columns.map((column) => (
                <th
                  key={column.id}
                  className="border-b border-r border-zinc-200 bg-zinc-50 px-2 py-2.5 last:border-r-0 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {column.label}
                      </span>
                      {column.max_loa_m ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                          <Ruler className="h-3 w-3" aria-hidden />
                          {Number(column.max_loa_m).toLocaleString("es-MX")} m
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      {column.berth_name || "Área de fondeo"}
                    </p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr
                key={row.date}
                className="group"
              >
                <td className="sticky left-0 z-20 border-b border-r border-zinc-200 bg-white px-4 py-3 align-top group-last:border-b-0 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="block whitespace-nowrap text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatIsoDateLabel(row.date, "short")}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] text-zinc-400">
                    {row.date}
                  </span>
                </td>
                {row.cells.map((calls, idx) => {
                  const column = data.columns[idx];
                  return (
                    <td
                      key={`${row.date}-${column.id}`}
                      className="border-b border-r border-zinc-200 bg-zinc-50/40 p-2 align-top last:border-r-0 group-last:border-b-0 dark:border-zinc-800 dark:bg-zinc-950/30"
                    >
                      {calls.length === 0 ? (
                        <div className="flex min-h-16 items-center justify-center gap-1.5 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                          Disponible
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {calls.map((call) => (
                            <article
                              key={call.booking_code}
                              className="rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <CatalogLogoThumb
                                  src={call.shipping_line_logo}
                                  alt=""
                                  size="sm"
                                  kind="shipping_line"
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                                    {call.shipping_line_name}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-3 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                                <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                                  <Ship className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                  <span className="truncate">{call.vessel_name}</span>
                                </span>
                                {call.loa_m ? (
                                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                    <Ruler className="h-3.5 w-3.5" aria-hidden />
                                    {Number(call.loa_m).toLocaleString("es-MX")} m
                                  </span>
                                ) : null}
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ViewSection>
  );
}
