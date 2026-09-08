"use client";

import { CirclePause } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import ViewSection from "@/components/layout/ViewSection";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { DashboardPendingConfirm } from "@/types/dashboard";
import {
  dashboardBookingsHref,
  type DashboardBookingsLinkBase,
} from "./dashboardBookingsHref";

type DashboardPendingConfirmCardProps = {
  data: DashboardPendingConfirm;
  linkBase: DashboardBookingsLinkBase;
};

function PendingConfirmColGroup() {
  return (
    <colgroup>
      <col />
      <col className="w-[7.5rem]" />
      <col className="w-[7.5rem]" />
      <col className="w-[4.25rem]" />
    </colgroup>
  );
}

function CountLink({
  href,
  count,
  className,
  children,
}: {
  href: string;
  count: number;
  className?: string;
  children?: ReactNode;
}) {
  if (count <= 0) {
    return <span className={className}>{children ?? "—"}</span>;
  }
  return (
    <Link
      href={href}
      className={`hover:underline ${className ?? ""}`}
    >
      {children ?? count.toLocaleString("es")}
    </Link>
  );
}

export default function DashboardPendingConfirmCard({
  data,
  linkBase,
}: DashboardPendingConfirmCardProps) {
  return (
    <ViewSection
      icon={CirclePause}
      title="Pendientes de confirmar"
      description="Holds y LTA en el rango del filtro (requieren seguimiento)."
      className="flex h-full flex-col"
      bodyClassName="flex min-h-0 flex-1 flex-col p-0"
      accent="#d97706"
    >
      {data.by_port.length === 0 ? (
        <p className="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400 sm:px-6">
          No hay Holds ni LTA en el período filtrado.
        </p>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-auto px-5 pt-4 sm:px-6">
            <table className="w-full min-w-[20rem] table-fixed border-collapse text-left text-sm">
              <PendingConfirmColGroup />
              <thead>
                <tr className="border-b border-zinc-100 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                  <th className="py-2 pr-3 font-semibold">Puerto</th>
                  <th className="px-2 py-2 text-right font-semibold">Hold</th>
                  <th className="px-2 py-2 text-right font-semibold">LTA</th>
                  <th className="py-2 pl-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.by_port.map((row) => {
                  const portIds = [row.port_id];
                  return (
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
                      <td className="px-2 py-2.5 text-right tabular-nums text-amber-700 dark:text-amber-400">
                        <CountLink
                          count={row.holds}
                          href={dashboardBookingsHref(linkBase, {
                            portIds,
                            status: ["h"],
                          })}
                        />
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-sky-700 dark:text-sky-400">
                        <CountLink
                          count={row.lta}
                          href={dashboardBookingsHref(linkBase, {
                            portIds,
                            status: ["lta"],
                          })}
                        />
                      </td>
                      <td className="py-2.5 pl-2 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {row.total.toLocaleString("es")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-auto shrink-0 border-t border-white/50 bg-white/40 px-5 py-3 backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-900/40 sm:px-6">
            <table className="w-full min-w-[20rem] table-fixed border-collapse text-left text-sm">
              <PendingConfirmColGroup />
              <tbody>
                <tr>
                  <td className="pr-3 align-top">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Total
                    </p>
                  </td>
                  <td className="px-2 align-top text-right">
                    <CountLink
                      count={data.holds}
                      href={dashboardBookingsHref(linkBase, {
                        status: ["h"],
                      })}
                      className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50"
                    />
                    {data.hold_since ? (
                      <p className="mt-0.5 text-[10px] leading-tight text-zinc-400">
                        Desde {formatIsoDateLabel(data.hold_since, "short")}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-2 align-top text-right">
                    <CountLink
                      count={data.lta}
                      href={dashboardBookingsHref(linkBase, {
                        status: ["lta"],
                      })}
                      className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50"
                    />
                    {data.lta_since ? (
                      <p className="mt-0.5 text-[10px] leading-tight text-zinc-400">
                        Desde {formatIsoDateLabel(data.lta_since, "short")}
                      </p>
                    ) : null}
                  </td>
                  <td className="pl-2 align-top text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {data.total.toLocaleString("es")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </ViewSection>
  );
}
