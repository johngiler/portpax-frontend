"use client";

import useSWR from "swr";
import { Anchor, Gauge, MapPinned, Ship, Users } from "lucide-react";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewSection from "@/components/layout/ViewSection";
import ViewStatCard from "@/components/layout/ViewStatCard";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  formatGrowthPct,
  reportMatrix,
  reportViewSectionBody,
} from "@/components/reports/reportMatrixStyles";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchCarrierPanoramaReport,
  type CarrierPanoramaReport,
} from "@/services/bookings/bookingService";
import DonutChart from "@/views/DashboardView/charts/DonutChart";
import { formatCompactNumber } from "@/views/DashboardView/formatDashboardKpi";
import { CarrierPanoramaContentSkeleton } from "../ReportsContentSkeleton";
import type { ReportPaxBasis, ReportSeason } from "../reportsFilterQuery";
import PanoramaYearMatrix from "./PanoramaYearMatrix";

const PORT_SHARE_COLORS = [
  "#3478b5",
  "#0d9488",
  "#7c3aed",
  "#ca8a04",
  "#e11d48",
  "#64748b",
];

type Props = {
  enabled: boolean;
  dateFrom: string;
  dateTo: string;
  withoutLta: boolean;
  paxBasis: ReportPaxBasis;
  season: ReportSeason;
  shippingLineGroupIds: number[];
  shippingLineIds: number[];
  portIds: number[];
};

function yoyTone(pct: number | null | undefined): string {
  if (pct == null) return reportMatrix.growthNeutral;
  if (pct > 0) return reportMatrix.growthPositive;
  if (pct < 0) return reportMatrix.growthNegative;
  return reportMatrix.growthNeutral;
}

function formatAvgPax(value: number): string {
  if (!value) return "0";
  return value.toLocaleString("es", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  });
}

type YearKpi = NonNullable<
  CarrierPanoramaReport["kpis"]["by_year"]
>[number];

function YearBreakdown({
  years,
  formatValue,
  yoyKey,
}: {
  years: YearKpi[];
  formatValue: (row: YearKpi) => string;
  yoyKey?: "calls_yoy_pct" | "pax_yoy_pct";
}) {
  if (years.length <= 1) return null;
  return (
    <ul className="space-y-0.5 text-[10px] leading-snug tabular-nums text-zinc-600 dark:text-zinc-400">
      {years.map((row) => {
        const yoy = yoyKey ? row[yoyKey] : null;
        return (
          <li key={row.year} className="flex items-baseline gap-1.5">
            <span className="w-8 shrink-0 font-medium text-zinc-500 dark:text-zinc-500">
              {row.year}
            </span>
            <span className="min-w-0 font-semibold text-zinc-800 dark:text-zinc-200">
              {formatValue(row)}
            </span>
            {yoy != null ? (
              <span className={`shrink-0 ${yoyTone(yoy)}`}>
                {formatGrowthPct(yoy)}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function CarrierPanoramaSection({
  enabled,
  dateFrom,
  dateTo,
  withoutLta,
  paxBasis,
  season,
  shippingLineGroupIds,
  shippingLineIds,
  portIds,
}: Props) {
  const portsKey = [...portIds].sort((a, b) => a - b).join(",");
  const paramsKey = [
    dateFrom,
    dateTo,
    withoutLta ? 1 : 0,
    paxBasis,
    season,
    shippingLineGroupIds.join(","),
    shippingLineIds.join(","),
    portsKey,
  ].join("|");

  const { data, isLoading, error } = useSWR<CarrierPanoramaReport>(
    enabled && dateFrom && dateTo
      ? swrKeys.report("carrier_panorama", paramsKey)
      : null,
    () =>
      fetchCarrierPanoramaReport({
        date_from: dateFrom,
        date_to: dateTo,
        without_lta: withoutLta,
        pax_basis: paxBasis,
        season,
        shipping_lines:
          shippingLineIds.length > 0 ? shippingLineIds : undefined,
        shipping_line_groups:
          shippingLineIds.length === 0 && shippingLineGroupIds.length > 0
            ? shippingLineGroupIds
            : undefined,
        ports: portIds.length > 0 ? portIds : undefined,
      }),
    { keepPreviousData: false },
  );

  const mismatch = Boolean(
    data &&
      (data.date_from !== dateFrom ||
        data.date_to !== dateTo ||
        data.without_lta !== withoutLta ||
        (data.pax_basis ?? "planned") !== paxBasis ||
        (data.season ?? "natural") !== season),
  );
  if (error && !data) {
    return (
      <ViewErrorBanner
        message={getApiErrorMessage(error, "No se pudo cargar el panorama.")}
      />
    );
  }

  if (isLoading || mismatch || !data) {
    return <CarrierPanoramaContentSkeleton />;
  }

  const { kpis, port_share: share, subtitle } = data;
  const byYear = kpis.by_year ?? [];
  const topShare = share[0];
  const slices = share.map((item, index) => ({
    key: String(item.port_id),
    label: item.port_name,
    value: item.pax > 0 ? item.pax : item.calls,
    color: PORT_SHARE_COLORS[index % PORT_SHARE_COLORS.length],
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ViewStatCard
          label="Arribos totales"
          value={kpis.total_calls.toLocaleString("es")}
          description={subtitle}
          icon={Ship}
          accentColor="#3478b5"
          gradient="linear-gradient(160deg, rgba(52, 120, 181, 0.14) 0%, var(--background) 55%)"
          badge={
            byYear.length > 1 ? (
              <YearBreakdown
                years={byYear}
                formatValue={(row) => row.calls.toLocaleString("es")}
                yoyKey="calls_yoy_pct"
              />
            ) : undefined
          }
        />
        <ViewStatCard
          label="PAX totales"
          value={formatCompactNumber(kpis.total_pax)}
          description={subtitle}
          icon={Users}
          accentColor="#0d9488"
          gradient="linear-gradient(160deg, rgba(13, 148, 136, 0.14) 0%, var(--background) 55%)"
          badge={
            byYear.length > 1 ? (
              <YearBreakdown
                years={byYear}
                formatValue={(row) => formatCompactNumber(row.pax)}
                yoyKey="pax_yoy_pct"
              />
            ) : undefined
          }
        />
        <ViewStatCard
          label="Puertos con programación"
          value={`${kpis.ports_with_calls} de ${kpis.ports_total}`}
          description={subtitle}
          icon={Anchor}
          accentColor="#7c3aed"
          gradient="linear-gradient(160deg, rgba(124, 58, 237, 0.14) 0%, var(--background) 55%)"
        />
        <ViewStatCard
          label="Promedio PAX/arribo"
          value={formatAvgPax(kpis.avg_pax_per_call ?? 0)}
          description={subtitle}
          icon={Gauge}
          accentColor="#64748b"
          gradient="linear-gradient(160deg, rgba(100, 116, 139, 0.14) 0%, var(--background) 55%)"
          badge={
            byYear.length > 1 ? (
              <YearBreakdown
                years={byYear}
                formatValue={(row) => formatAvgPax(row.avg_pax_per_call)}
              />
            ) : undefined
          }
        />
        <div
          className="relative flex h-full min-h-[130px] items-start overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80"
          style={{
            borderTopWidth: "3px",
            borderTopColor: "#ca8a04",
            background:
              "linear-gradient(160deg, rgba(202, 138, 4, 0.16) 0%, var(--background) 55%)",
          }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Participación por puerto
            </p>
            <div className="mt-2">
              <DonutChart
                compact
                slices={slices}
                centerLabel={topShare?.port_name}
                centerValue={topShare ? `${topShare.share_pct}%` : "0%"}
                emptyLabel="Sin datos"
                tooltipSubtitle="Participación de PAX"
                valueLabel="PAX"
              />
            </div>
          </div>
        </div>
      </div>

      <ViewSection
        icon={MapPinned}
        title={data.matrix_title || data.title}
        description={data.note}
        bodyClassName={reportViewSectionBody}
      >
        <PanoramaYearMatrix data={data} />
      </ViewSection>
    </div>
  );
}
