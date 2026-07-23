"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardList, Gauge, LayoutDashboard, Users } from "lucide-react";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import ViewStatCard from "@/components/layout/ViewStatCard";
import {
  useActivePortsCatalog,
  useActiveShippingLinesCatalog,
  useShippingLineGroupsCatalog,
} from "@/hooks/swr/useCatalogs";
import { useDashboardStats } from "@/hooks/swr/useDashboardStats";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { toIsoDate } from "@/lib/bookingDates";
import type { DashboardCarrierFilter } from "@/types/dashboard";
import DashboardActionQueueSection from "./DashboardActionQueueSection";
import DashboardCharts from "./DashboardCharts";
import DashboardFilters from "./DashboardFilters";
import DashboardNext30Section from "./DashboardNext30Section";
import DashboardOccupancyByPort from "./DashboardOccupancyByPort";
import DashboardViewSkeleton from "./DashboardViewSkeleton";
import DashboardYoyBadge from "./DashboardYoyBadge";
import { formatCompactNumber, formatYoyBadge } from "./formatDashboardKpi";

function defaultYearRange(): { from: string; to: string } {
  const year = new Date().getFullYear();
  return {
    from: toIsoDate(year, 0, 1),
    to: toIsoDate(year, 11, 31),
  };
}

function formatPeriodLabel(from: string, to: string): string {
  if (from === to) return from;
  return `${from} → ${to}`;
}

export default function DashboardView() {
  const defaults = useMemo(() => defaultYearRange(), []);

  const { ports, isLoading: portsLoading, error: portsError } =
    useActivePortsCatalog();
  const { groups, isLoading: groupsLoading, error: groupsError } =
    useShippingLineGroupsCatalog();
  const { lines, isLoading: linesLoading, error: linesError } =
    useActiveShippingLinesCatalog();

  const catalogReady = !portsLoading && !groupsLoading && !linesLoading;
  const catalogError = portsError || groupsError || linesError;

  const [selectedPortId, setSelectedPortId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [carrierFilter, setCarrierFilter] = useState<DashboardCarrierFilter>({
    type: "all",
  });
  const [appliedSelectedPortId, setAppliedSelectedPortId] = useState<number | null>(
    null,
  );
  const [appliedDateFrom, setAppliedDateFrom] = useState(defaults.from);
  const [appliedDateTo, setAppliedDateTo] = useState(defaults.to);
  const [appliedCarrierFilter, setAppliedCarrierFilter] =
    useState<DashboardCarrierFilter>({ type: "all" });
  const [viewError, setViewError] = useState<string | null>(null);

  const { stats, isLoading, error: statsError } = useDashboardStats(
    {
      dateFrom: appliedDateFrom,
      dateTo: appliedDateTo,
      portId: appliedSelectedPortId,
      carrier: appliedCarrierFilter,
    },
    catalogReady,
  );

  useEffect(() => {
    if (catalogError) {
      setViewError(
        getApiErrorMessage(
          catalogError,
          "No se pudieron cargar los filtros del dashboard.",
        ),
      );
    } else if (statsError) {
      setViewError(
        getApiErrorMessage(statsError, "No se pudo cargar el resumen operativo."),
      );
    }
  }, [catalogError, statsError]);

  if (!catalogReady || (isLoading && !stats)) {
    return <DashboardViewSkeleton />;
  }

  const kpis = stats?.kpis;
  const periodLabel = formatPeriodLabel(appliedDateFrom, appliedDateTo);

  function applyFilters() {
    setAppliedSelectedPortId(selectedPortId);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setAppliedCarrierFilter(carrierFilter);
    setViewError(null);
  }

  function clearFilters() {
    const allCarriers: DashboardCarrierFilter = { type: "all" };
    setSelectedPortId(null);
    setDateFrom(defaults.from);
    setDateTo(defaults.to);
    setCarrierFilter(allCarriers);
    setAppliedSelectedPortId(null);
    setAppliedDateFrom(defaults.from);
    setAppliedDateTo(defaults.to);
    setAppliedCarrierFilter(allCarriers);
    setViewError(null);
  }

  return (
    <>
      <FilterSidebarContent>
        <DashboardFilters
          ports={ports}
          groups={groups}
          lines={lines}
          selectedPortId={selectedPortId}
          onPortChange={setSelectedPortId}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          carrierFilter={carrierFilter}
          onCarrierChange={setCarrierFilter}
          defaultDateFrom={defaults.from}
          defaultDateTo={defaults.to}
          onApply={applyFilters}
          onClear={clearFilters}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="KPIs operativos del período, cola de acción, próximos 30 días y ocupación por puerto."
      />

      {viewError && (
        <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />
      )}

      {kpis && stats ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ViewStatCard
            label="Ocupación"
            value={`${kpis.occupancy_pct}%`}
            description={`${kpis.occupied_slot_days.toLocaleString("es")} de ${kpis.capacity_slot_days.toLocaleString("es")} slot-días`}
            icon={Gauge}
            accentColor="#3478b5"
            gradient="linear-gradient(160deg, rgba(52, 120, 181, 0.14) 0%, var(--background) 55%)"
          />
          <ViewStatCard
            label="PAX planificados"
            value={formatCompactNumber(kpis.planned_pax)}
            description={
              kpis.actual_pax > 0
                ? `${formatCompactNumber(kpis.actual_pax)} pax reales · ${kpis.planned_pax.toLocaleString("es")} planificados`
                : `${kpis.planned_pax.toLocaleString("es")} en reservas activas`
            }
            icon={Users}
            accentColor="#0d9488"
            gradient="linear-gradient(160deg, rgba(13, 148, 136, 0.14) 0%, var(--background) 55%)"
            badge={<DashboardYoyBadge badge={formatYoyBadge(stats.yoy.planned_pax)} />}
          />
          <ViewStatCard
            label="Reservas"
            value={kpis.total_bookings.toLocaleString("es")}
            description={
              kpis.total_bookings > 0
                ? `${periodLabel} · ${kpis.c > 0 ? `${Math.round((kpis.c / kpis.total_bookings) * 100)}% canceladas` : "sin cancelaciones"}`
                : `Sin reservas en ${periodLabel}`
            }
            icon={ClipboardList}
            accentColor="#3478b5"
            gradient="linear-gradient(160deg, rgba(52, 120, 181, 0.14) 0%, var(--background) 55%)"
            badge={<DashboardYoyBadge badge={formatYoyBadge(stats.yoy.calls)} />}
            href="/bookings"
          />
          <ViewStatCard
            label="Requieren acción"
            value={(
              stats.action_queue.holds + stats.action_queue.new_requests
            ).toLocaleString("es")}
            description={`${stats.action_queue.holds} Hold · ${stats.action_queue.new_requests} NR · desde ${stats.action_queue.as_of}`}
            icon={AlertTriangle}
            accentColor={
              stats.action_queue.holds + stats.action_queue.new_requests > 0
                ? "#d97706"
                : "#71717a"
            }
            gradient={
              stats.action_queue.holds + stats.action_queue.new_requests > 0
                ? "linear-gradient(160deg, rgba(217, 119, 6, 0.16) 0%, var(--background) 55%)"
                : "linear-gradient(160deg, rgba(113, 113, 122, 0.12) 0%, var(--background) 55%)"
            }
            href="/bookings?status=action"
          />
        </div>
      ) : null}

      {stats ? (
        <>
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <DashboardNext30Section data={stats.next_30_days} />
            <DashboardActionQueueSection data={stats.action_queue} />
          </div>
          <DashboardOccupancyByPort rows={stats.occupancy_by_port} />
          <DashboardCharts stats={stats} />
        </>
      ) : null}
    </>
  );
}
