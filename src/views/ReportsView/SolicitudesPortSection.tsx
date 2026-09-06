"use client";

import useSWR from "swr";
import { FileSpreadsheet } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
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

function SummaryTable({
  title,
  rows,
  total,
  highlightYears,
}: {
  title: string;
  rows: SolicitudesPortYearPax[];
  total?: number;
  highlightYears?: Set<number>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="border-b border-zinc-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-[var(--admin-accent)] dark:border-zinc-700 dark:bg-sky-950/40">
        {title}
      </div>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map((row) => {
            const hi = highlightYears?.has(row.year);
            return (
              <tr
                key={row.year}
                className={
                  hi
                    ? "bg-sky-100/80 dark:bg-sky-950/50"
                    : "bg-white dark:bg-zinc-950/40"
                }
              >
                <td className="border-b border-zinc-100 px-3 py-1.5 text-center tabular-nums dark:border-zinc-800">
                  {row.year}
                </td>
                <td className="border-b border-zinc-100 px-3 py-1.5 text-right tabular-nums dark:border-zinc-800">
                  {formatPax(row.pax)}
                </td>
              </tr>
            );
          })}
          {total != null ? (
            <tr className="bg-zinc-50 font-semibold dark:bg-zinc-900/60">
              <td className="px-3 py-1.5">Total</td>
              <td className="px-3 py-1.5 text-right tabular-nums">
                {formatPax(total)}
              </td>
            </tr>
          ) : null}
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

  const highlight = new Set(data.years);
  const hasRows = data.year_blocks.some((b) => b.rows.length > 0);
  const showCarrier =
    Boolean(data.shipping_line_label) &&
    (data.carrier_by_year?.length ?? 0) > 0;

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
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
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

        <div className="space-y-4">
          <SummaryTable
            title="Nuevas solicitadas"
            rows={data.nuevas_solicitadas}
            total={data.nuevas_total}
          />
          <SummaryTable title={data.port_name} rows={data.port_by_year} />
          {showCarrier ? (
            <SummaryTable
              title={data.shipping_line_label}
              rows={data.carrier_by_year}
              highlightYears={highlight}
            />
          ) : null}
        </div>
      </div>
    </ViewSection>
  );
}
