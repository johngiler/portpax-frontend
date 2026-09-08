"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import ViewSection from "@/components/layout/ViewSection";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { DashboardPeakPaxPortRow } from "@/types/dashboard";
import {
  dashboardBookingsHref,
  type DashboardBookingsLinkBase,
} from "./dashboardBookingsHref";

type DashboardPeakPaxByPortCardProps = {
  rows: DashboardPeakPaxPortRow[];
  linkBase: DashboardBookingsLinkBase;
};

export default function DashboardPeakPaxByPortCard({
  rows,
  linkBase,
}: DashboardPeakPaxByPortCardProps) {
  return (
    <ViewSection
      icon={Users}
      title="Pasajeros máximos por puerto"
      description="Día con más pasajeros en el rango del filtro (Real si ya pasó; Planificado si es futuro)."
      className="flex h-full flex-col"
      bodyClassName="flex min-h-0 flex-1 flex-col p-5 sm:p-6"
      accent="#0d9488"
    >
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No hay escalas con PAX en el período filtrado.
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                <th className="py-2 pr-3 font-semibold">Puerto</th>
                <th className="px-2 py-2 font-semibold">Fecha</th>
                <th className="px-2 py-2 text-right font-semibold">Calls</th>
                <th className="px-2 py-2 text-right font-semibold">
                  Pasajeros
                </th>
                <th className="py-2 pl-2 text-right font-semibold">
                  Base pax
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.port_id}
                  className="border-b border-zinc-50 last:border-0 dark:border-zinc-800/60"
                >
                  <td className="py-2.5 pr-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <CatalogLogoThumb
                        src={row.logo}
                        alt={row.name}
                        kind="port"
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                          {row.name}
                        </p>
                        <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                          {row.code}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-700 dark:text-zinc-200">
                    {formatIsoDateLabel(row.call_date, "short")}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-200">
                    {row.calls > 0 ? (
                      <Link
                        href={dashboardBookingsHref(linkBase, {
                          portIds: [row.port_id],
                          dateFrom: row.call_date,
                          dateTo: row.call_date,
                        })}
                        className="hover:underline"
                      >
                        {row.calls.toLocaleString("es")}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {row.passengers.toLocaleString("es")}
                  </td>
                  <td className="py-2.5 pl-2 text-right text-xs font-medium text-zinc-500">
                    {row.base_pax === "real" ? "Real" : "Planificado"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ViewSection>
  );
}
