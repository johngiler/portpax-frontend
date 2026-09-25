"use client";

import useSWR from "swr";
import { Anchor, MapPinned, Ship, Users } from "lucide-react";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewSection from "@/components/layout/ViewSection";
import ViewStatCard from "@/components/layout/ViewStatCard";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { reportViewSectionBody } from "@/components/reports/reportMatrixStyles";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchCarrierPanoramaReport,
  type CarrierPanoramaReport,
} from "@/services/bookings/bookingService";
import DonutChart from "@/views/DashboardView/charts/DonutChart";
import { formatCompactNumber } from "@/views/DashboardView/formatDashboardKpi";
import { CarrierPanoramaContentSkeleton } from "../ReportsContentSkeleton";
import type { ReportPaxBasis } from "../reportsFilterQuery";
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
  shippingLineGroupId: number;
  shippingLineId: number;
  portIds: number[];
};

export default function CarrierPanoramaSection({
  enabled,
  dateFrom,
  dateTo,
  withoutLta,
  paxBasis,
  shippingLineGroupId,
  shippingLineId,
  portIds,
}: Props) {
  const portsKey = [...portIds].sort((a, b) => a - b).join(",");
  const paramsKey = [
    dateFrom,
    dateTo,
    withoutLta ? 1 : 0,
    paxBasis,
    shippingLineGroupId,
    shippingLineId,
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
        shipping_line: shippingLineId > 0 ? shippingLineId : undefined,
        shipping_line_group:
          shippingLineId <= 0 && shippingLineGroupId > 0
            ? shippingLineGroupId
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
        (data.pax_basis ?? "planned") !== paxBasis),
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
  const topShare = share[0];
  const slices = share.map((item, index) => ({
    key: String(item.port_id),
    label: item.port_name,
    value: item.pax > 0 ? item.pax : item.calls,
    color: PORT_SHARE_COLORS[index % PORT_SHARE_COLORS.length],
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ViewStatCard
          label="Arribos totales"
          value={kpis.total_calls.toLocaleString("es")}
          description={subtitle}
          icon={Ship}
          accentColor="#3478b5"
          gradient="linear-gradient(160deg, rgba(52, 120, 181, 0.14) 0%, var(--background) 55%)"
        />
        <ViewStatCard
          label="PAX totales"
          value={formatCompactNumber(kpis.total_pax)}
          description={subtitle}
          icon={Users}
          accentColor="#0d9488"
          gradient="linear-gradient(160deg, rgba(13, 148, 136, 0.14) 0%, var(--background) 55%)"
        />
        <ViewStatCard
          label="Puertos con programación"
          value={`${kpis.ports_with_calls} de ${kpis.ports_total}`}
          description={subtitle}
          icon={Anchor}
          accentColor="#7c3aed"
          gradient="linear-gradient(160deg, rgba(124, 58, 237, 0.14) 0%, var(--background) 55%)"
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
