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
import {
  buildBookingsWorkspaceQuery,
  type BookingsWorkspaceFilters,
} from "@/lib/viewFilterQuery";
import type { DashboardCarrierFilter } from "@/types/dashboard";
import DashboardActionQueueSection from "./DashboardActionQueueSection";
import DashboardCharts from "./DashboardCharts";
import DashboardFilters from "./DashboardFilters";
import DashboardHorizonSection from "./DashboardHorizonSection";
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

function dashboardBookingsHref(input: {
  dateFrom: string;
  dateTo: string;
  portId: number | null;
  carrier: DashboardCarrierFilter;
  conflict?: "" | "yes";
}): string {
  const year = Number(input.dateFrom.slice(0, 4)) || new Date().getFullYear();
  const state: BookingsWorkspaceFilters = {
    tab: "list",
    status: [],
    search: "",
    ports: input.portId ? [input.portId] : [],
    line: input.carrier.type === "line" ? input.carrier.id : 0,
    vessel: 0,
    datePreset: "custom",
    customFrom: input.dateFrom,
    customTo: input.dateTo,
    mode: "monthly",
    season: "natural",
    position: 0,
    week: input.dateFrom,
    year,
    month: Math.max(0, Number(input.dateFrom.slice(5, 7)) - 1) || 0,
    heat: "availability",
    density: 0,
    conflict: input.conflict ?? "",
    importedDates: [],
  };
  const qs = buildBookingsWorkspaceQuery(state);
  return qs ? `/bookings?${qs}` : "/bookings";
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
  const bookingsListHref = dashboardBookingsHref({
    dateFrom: appliedDateFrom,
    dateTo: appliedDateTo,
    portId: appliedSelectedPortId,
    carrier: appliedCarrierFilter,
  });
  const bookingsConflictHref = dashboardBookingsHref({
    dateFrom: appliedDateFrom,
    dateTo: appliedDateTo,
    portId: appliedSelectedPortId,
    carrier: appliedCarrierFilter,
    conflict: "yes",
  });

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

  const canApplyFilters =
    selectedPortId !== appliedSelectedPortId ||
    dateFrom !== appliedDateFrom ||
    dateTo !== appliedDateTo ||
    carrierFilter.type !== appliedCarrierFilter.type ||
    (carrierFilter.type !== "all" &&
      appliedCarrierFilter.type !== "all" &&
      carrierFilter.id !== appliedCarrierFilter.id);

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
          canApply={canApplyFilters}
          onApply={applyFilters}
          onClear={clearFilters}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="KPIs operativos del período, arribos de la semana, conflictos y ocupación por puerto."
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
            badge={
              stats.yoy.occupancy ? (
                <DashboardYoyBadge badge={formatYoyBadge(stats.yoy.occupancy)} />
              ) : undefined
            }
            href={bookingsListHref}
          />
          <ViewStatCard
            label="PAX planificados"
            value={formatCompactNumber(kpis.planned_pax)}
            description={
              kpis.actual_pax > 0
                ? `${kpis.actual_pax.toLocaleString("es")} reales / ${kpis.planned_pax.toLocaleString("es")} planificados`
                : `${kpis.planned_pax.toLocaleString("es")} planificados`
            }
            icon={Users}
            accentColor="#0d9488"
            gradient="linear-gradient(160deg, rgba(13, 148, 136, 0.14) 0%, var(--background) 55%)"
            badge={<DashboardYoyBadge badge={formatYoyBadge(stats.yoy.planned_pax)} />}
            href={bookingsListHref}
          />
          <ViewStatCard
            label="Reservas"
            value={kpis.total_bookings.toLocaleString("es")}
            description={
              kpis.total_bookings > 0
                ? `${kpis.c.toLocaleString("es")} cancelaciones`
                : "Sin reservas"
            }
            icon={ClipboardList}
            accentColor="#3478b5"
            gradient="linear-gradient(160deg, rgba(52, 120, 181, 0.14) 0%, var(--background) 55%)"
            badge={<DashboardYoyBadge badge={formatYoyBadge(stats.yoy.calls)} />}
            href={bookingsListHref}
          />
          <ViewStatCard
            label="Conflictos"
            value={(stats.conflicts?.total ?? 0).toLocaleString("es")}
            description={
              (stats.conflicts?.by_type?.length ?? 0) > 0
                ? stats.conflicts.by_type
                    .map((row) => `${row.count} ${row.label}`)
                    .join(" · ")
                : "Sin conflictos en el período"
            }
            icon={AlertTriangle}
            accentColor={
              (stats.conflicts?.total ?? 0) > 0 ? "#d97706" : "#71717a"
            }
            gradient={
              (stats.conflicts?.total ?? 0) > 0
                ? "linear-gradient(160deg, rgba(217, 119, 6, 0.16) 0%, var(--background) 55%)"
                : "linear-gradient(160deg, rgba(113, 113, 122, 0.12) 0%, var(--background) 55%)"
            }
            href={bookingsConflictHref}
          />
        </div>
      ) : null}

      {stats ? (
        <>
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <DashboardHorizonSection
              variant="current_week"
              data={
                stats.current_week ?? {
                  date_from: "",
                  date_to: "",
                  total_confirmed: 0,
                  planned_pax: 0,
                  by_port: [],
                }
              }
            />
            <DashboardActionQueueSection data={stats.action_queue} />
          </div>
          <div className="mb-6">
            <DashboardHorizonSection
              variant="next_30"
              data={stats.next_30_days}
            />
          </div>
          <DashboardOccupancyByPort rows={stats.occupancy_by_port} />
          <DashboardCharts stats={stats} />
        </>
      ) : null}
    </>
  );
}
