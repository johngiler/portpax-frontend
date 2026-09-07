"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { FileSpreadsheet } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchSolicitudesPortReport,
  type SolicitudesPortReport,
  type SolicitudesPortYearPax,
} from "@/services/bookings/bookingService";
import ReportsEmptyState from "./ReportsEmptyState";
import { ReportMatrixContentSkeleton } from "./ReportsContentSkeleton";

type SolicitudesPortSectionProps = {
  enabled: boolean;
  dateFrom: string;
  dateTo: string;
  portId: number;
  years: number[];
  tagIds: number[];
  shippingLineId: number;
  withoutLta: boolean;
  paxBasis: "planned" | "capacity";
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
};

function formatPax(n: number): string {
  return n.toLocaleString("es-MX");
}

function paxByYearMap(rows: SolicitudesPortYearPax[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const row of rows) {
    map.set(row.year, row.pax);
  }
  return map;
}

function formatPct(carrierPax: number, portPax: number): string {
  if (portPax <= 0) return "—";
  const pct = Math.round((carrierPax / portPax) * 100);
  return `${pct}%`;
}

function cellBorder(extra = ""): string {
  return `border border-zinc-200/80 dark:border-zinc-700/70 ${extra}`.trim();
}

function PortCarrierSummary({
  portName,
  carrierName,
  carrierRows,
  portRows,
}: {
  portName: string;
  carrierName: string;
  carrierRows: SolicitudesPortYearPax[];
  portRows: SolicitudesPortYearPax[];
}) {
  const { years, carrierMap, portMap, carrierTotal, portTotal } = useMemo(() => {
    const nextCarrier = paxByYearMap(carrierRows);
    const nextPort = paxByYearMap(portRows);
    const nextYears = Array.from(
      new Set([...nextCarrier.keys(), ...nextPort.keys()]),
    ).sort((a, b) => a - b);
    return {
      years: nextYears,
      carrierMap: nextCarrier,
      portMap: nextPort,
      carrierTotal: carrierRows.reduce((sum, row) => sum + row.pax, 0),
      portTotal: portRows.reduce((sum, row) => sum + row.pax, 0),
    };
  }, [carrierRows, portRows]);

  return (
    <div className="h-fit w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="border-b border-zinc-200 bg-sky-50 px-3 py-2 dark:border-zinc-700 dark:bg-sky-950/40">
        <p className="text-sm font-semibold text-[var(--admin-accent)]">
          {portName}
        </p>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {carrierName}
        </p>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-zinc-50 text-xs text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300">
            <th
              className={cellBorder(
                "px-3 py-1.5 text-left font-semibold",
              )}
            >
              Año
            </th>
            <th
              className={cellBorder(
                "px-3 py-1.5 text-right font-semibold",
              )}
            >
              <span className="inline-flex items-center justify-end gap-1">
                Naviera vs total
                <InfoTooltip
                  content="Naviera seleccionada vs total de navieras"
                  label="Naviera vs total"
                />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {years.map((year) => {
            const carrierPax = carrierMap.get(year) ?? 0;
            const portPax = portMap.get(year) ?? 0;
            return (
              <tr key={year} className="bg-white dark:bg-zinc-950/40">
                <td
                  className={cellBorder(
                    "px-3 py-1.5 text-center tabular-nums",
                  )}
                >
                  {year}
                </td>
                <td
                  className={cellBorder(
                    "px-3 py-1.5 text-right tabular-nums",
                  )}
                >
                  {formatPax(carrierPax)} / {formatPax(portPax)}{" "}
                  <span className="text-zinc-500 dark:text-zinc-400">
                    ({formatPct(carrierPax, portPax)})
                  </span>
                </td>
              </tr>
            );
          })}
          <tr className="bg-zinc-50 font-semibold dark:bg-zinc-900/60">
            <td className={cellBorder("px-3 py-1.5")}>Total</td>
            <td
              className={cellBorder(
                "px-3 py-1.5 text-right tabular-nums",
              )}
            >
              {formatPax(carrierTotal)} / {formatPax(portTotal)}{" "}
              <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                ({formatPct(carrierTotal, portTotal)})
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function SolicitudesPortSection({
  enabled,
  dateFrom,
  dateTo,
  portId,
  years,
  tagIds,
  shippingLineId,
  withoutLta,
  paxBasis,
  hasActiveFilters = false,
  onClearFilters,
}: SolicitudesPortSectionProps) {
  const paramsKey = [
    dateFrom,
    dateTo,
    portId,
    years.join(","),
    tagIds.join(","),
    shippingLineId,
    withoutLta ? 1 : 0,
    paxBasis,
  ].join("|");

  const { data, isLoading, error } = useSWR<SolicitudesPortReport>(
    enabled && portId > 0 && shippingLineId > 0
      ? swrKeys.report("solicitudes_port", paramsKey)
      : null,
    () =>
      fetchSolicitudesPortReport({
        date_from: dateFrom,
        date_to: dateTo,
        port: portId,
        years,
        tags: tagIds,
        shipping_line: shippingLineId,
        without_lta: withoutLta,
        pax_basis: paxBasis,
      }),
  );

  if (!enabled) return null;

  if (portId <= 0 && shippingLineId <= 0) {
    return <ReportsEmptyState variant="missing_required_solicitudes" />;
  }

  if (portId <= 0) {
    return <ReportsEmptyState variant="missing_port_solicitudes" />;
  }

  if (shippingLineId <= 0) {
    return <ReportsEmptyState variant="missing_shipping_line_solicitudes" />;
  }

  if (isLoading && !data) {
    return <ReportMatrixContentSkeleton sectionCount={1} />;
  }

  if (error || !data) {
    return (
      <ReportsEmptyState
        variant={hasActiveFilters ? "filtered" : "empty"}
        onClearFilters={onClearFilters}
      />
    );
  }

  const hasRows = data.year_blocks.some((b) => b.rows.length > 0);
  const carrierRows =
    data.carrier_by_year?.length > 0
      ? data.carrier_by_year
      : data.nuevas_solicitadas;
  const showSummary =
    Boolean(data.shipping_line_label) &&
    (carrierRows.length > 0 || data.port_by_year.length > 0);

  return (
    <ViewSection
      icon={FileSpreadsheet}
      leading={
        <CatalogLogoThumb
          src={data.port_logo}
          alt={data.port_name}
          kind="port"
          size="md"
        />
      }
      title={data.title}
      description={data.subtitle}
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          {!hasRows ? (
            <ReportsEmptyState
              variant={hasActiveFilters ? "filtered" : "empty"}
              onClearFilters={onClearFilters}
            />
          ) : (
            data.year_blocks.map((block) => (
              <div key={block.year}>
                <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {block.title}
                </h3>
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-[var(--admin-accent)] text-white">
                      <tr>
                        <th className="border border-zinc-200/40 px-2 py-1.5 text-left font-semibold">
                          Ship
                        </th>
                        <th className="border border-zinc-200/40 px-2 py-1.5 text-left font-semibold">
                          Port
                        </th>
                        <th className="border border-zinc-200/40 px-2 py-1.5 text-center font-semibold">
                          Arrival
                        </th>
                        <th className="border border-zinc-200/40 px-2 py-1.5 text-center font-semibold">
                          Hora llegada
                        </th>
                        <th className="border border-zinc-200/40 px-2 py-1.5 text-center font-semibold">
                          Hora salida
                        </th>
                        <th className="border border-zinc-200/40 px-2 py-1.5 text-right font-semibold">
                          Pax
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row) => (
                        <tr
                          key={row.booking_id}
                          className="border-t border-zinc-200 dark:border-zinc-700"
                        >
                          <td className="border border-zinc-100 px-2 py-1 dark:border-zinc-800">
                            {row.ship}
                          </td>
                          <td className="border border-zinc-100 px-2 py-1 dark:border-zinc-800">
                            {row.port}
                          </td>
                          <td className="border border-zinc-100 px-2 py-1 text-center tabular-nums dark:border-zinc-800">
                            {row.arrival_label}
                          </td>
                          <td className="border border-zinc-100 px-2 py-1 text-center tabular-nums dark:border-zinc-800">
                            {row.eta}
                          </td>
                          <td className="border border-zinc-100 px-2 py-1 text-center tabular-nums dark:border-zinc-800">
                            {row.etd}
                          </td>
                          <td className="border border-zinc-100 px-2 py-1 text-right tabular-nums dark:border-zinc-800">
                            {formatPax(row.pax)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-1 text-right text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {formatPax(block.pax_total)}
                </p>
              </div>
            ))
          )}
        </div>

        {showSummary ? (
          <PortCarrierSummary
            portName={data.port_name}
            carrierName={data.shipping_line_label}
            carrierRows={carrierRows}
            portRows={data.port_by_year}
          />
        ) : null}
      </div>
    </ViewSection>
  );
}
