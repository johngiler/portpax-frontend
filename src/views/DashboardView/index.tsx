"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  Medal,
  Ship,
  Users,
} from "lucide-react";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewFilteredBanner from "@/components/layout/ViewFilteredBanner";
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
import { portDisplayName } from "@/types/catalog";
import {
  EMPTY_DASHBOARD_CARRIER,
  type DashboardCarrierFilter,
} from "@/types/dashboard";
import DashboardCharts from "./DashboardCharts";
import DashboardFilters from "./DashboardFilters";
import DashboardOccupancyByPort from "./DashboardOccupancyByPort";
import DashboardPeakPaxByPortCard from "./DashboardPeakPaxByPortCard";
import DashboardPendingConfirmCard from "./DashboardPendingConfirmCard";
import DashboardViewSkeleton, {
  DashboardBodySkeleton,
  DashboardKpiCardsSkeleton,
} from "./DashboardViewSkeleton";
import DashboardWeekArrivalsCard from "./DashboardWeekArrivalsCard";
import DashboardYearBreakdown from "./DashboardYearBreakdown";
import DashboardYoyBadge from "./DashboardYoyBadge";
import {
  buildDashboardActiveFilterChips,
  dashboardHasActiveFilters,
  dashboardTitleYear,
  sameCarrierFilter,
  sameNumberList,
} from "./dashboardActiveFilterChips";
import { dashboardBookingsHref } from "./dashboardBookingsHref";
import { formatCompactNumber, formatYoyBadge } from "./formatDashboardKpi";
import type { ReportPaxBasis } from "@/views/ReportsView/reportsFilterQuery";

function defaultYearRange(): { from: string; to: string } {
  const year = new Date().getFullYear();
  return {
    from: toIsoDate(year, 0, 1),
    to: toIsoDate(year, 11, 31),
  };
}

function formatAvgPax(value: number): string {
  if (!value) return "0";
  return value.toLocaleString("es", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  });
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

  const [selectedPortIds, setSelectedPortIds] = useState<number[]>([]);
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [carrierFilter, setCarrierFilter] = useState<DashboardCarrierFilter>(
    EMPTY_DASHBOARD_CARRIER,
  );
  const [paxBasis, setPaxBasis] = useState<ReportPaxBasis>("planned");
  const [withoutLta, setWithoutLta] = useState(false);
  const [appliedSelectedPortIds, setAppliedSelectedPortIds] = useState<number[]>(
    [],
  );
  const [appliedDateFrom, setAppliedDateFrom] = useState(defaults.from);
  const [appliedDateTo, setAppliedDateTo] = useState(defaults.to);
  const [appliedCarrierFilter, setAppliedCarrierFilter] =
    useState<DashboardCarrierFilter>(EMPTY_DASHBOARD_CARRIER);
  const [appliedPaxBasis, setAppliedPaxBasis] =
    useState<ReportPaxBasis>("planned");
  const [appliedWithoutLta, setAppliedWithoutLta] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  const { stats, isLoading, error: statsError } = useDashboardStats(
    {
      dateFrom: appliedDateFrom,
      dateTo: appliedDateTo,
      portIds: appliedSelectedPortIds,
      carrier: appliedCarrierFilter,
      withoutLta: appliedWithoutLta,
      paxBasis: appliedPaxBasis,
    },
    catalogReady,
  );

  const portsById = useMemo(() => {
    const map = new Map<number, string>();
    for (const port of ports) {
      map.set(port.id, portDisplayName(port));
    }
    return map;
  }, [ports]);

  const titleYear = dashboardTitleYear(appliedDateFrom, appliedDateTo);
  const dashboardTitle = titleYear ? `Dashboard ${titleYear}` : "Dashboard";

  const hasActiveFilters = dashboardHasActiveFilters({
    portIds: appliedSelectedPortIds,
    carrier: appliedCarrierFilter,
    dateFrom: appliedDateFrom,
    dateTo: appliedDateTo,
    defaultDateFrom: defaults.from,
    defaultDateTo: defaults.to,
    withoutLta: appliedWithoutLta,
    paxBasis: appliedPaxBasis,
  });

  const activeFilterChips = useMemo(() => {
    const portLabel =
      appliedSelectedPortIds.length === 0
        ? null
        : appliedSelectedPortIds.length === 1
          ? (portsById.get(appliedSelectedPortIds[0]) ?? null)
          : `${portsById.get(appliedSelectedPortIds[0]) ?? "Puerto"} +${appliedSelectedPortIds.length - 1}`;

    const groupIds = appliedCarrierFilter.groupIds;
    const lineIds = appliedCarrierFilter.lineIds;
    let shippingLineGroupLabel: string | null = null;
    let carrierLabel: string | null = null;
    if (lineIds.length === 1) {
      const line = lines.find((row) => row.id === lineIds[0]);
      carrierLabel = line?.name ?? null;
      shippingLineGroupLabel =
        line?.group_name?.trim() ||
        groups.find((group) => group.id === line?.group)?.name ||
        null;
    } else if (lineIds.length > 1) {
      const first = lines.find((row) => row.id === lineIds[0]);
      carrierLabel = `${first?.name ?? "Naviera"} +${lineIds.length - 1}`;
    } else if (groupIds.length === 1) {
      shippingLineGroupLabel =
        groups.find((group) => group.id === groupIds[0])?.name ?? null;
    } else if (groupIds.length > 1) {
      const first = groups.find((group) => group.id === groupIds[0]);
      shippingLineGroupLabel = `${first?.name ?? "Grupo"} +${groupIds.length - 1}`;
    }

    return buildDashboardActiveFilterChips({
      portLabel,
      shippingLineGroupLabel,
      carrierLabel,
      dateFrom: appliedDateFrom,
      dateTo: appliedDateTo,
      defaultDateFrom: defaults.from,
      defaultDateTo: defaults.to,
      withoutLta: appliedWithoutLta,
      paxBasis: appliedPaxBasis,
    });
  }, [
    appliedSelectedPortIds,
    appliedCarrierFilter,
    appliedDateFrom,
    appliedDateTo,
    appliedWithoutLta,
    appliedPaxBasis,
    defaults.from,
    defaults.to,
    portsById,
    lines,
    groups,
  ]);

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

  if (!catalogReady) {
    return <DashboardViewSkeleton title={dashboardTitle} />;
  }

  const statsLoading = isLoading || !stats;
  const kpis = stats?.kpis;
  const linkBase = {
    dateFrom: appliedDateFrom,
    dateTo: appliedDateTo,
    portIds: appliedSelectedPortIds,
    carrier: appliedCarrierFilter,
  };
  const bookingsListHref = dashboardBookingsHref(linkBase);
  const bookingsConflictHref = dashboardBookingsHref(linkBase, {
    conflict: "yes",
  });
  const bookingsFirstArrivalHref = dashboardBookingsHref(linkBase, {
    firstArrival: true,
  });
  const firstArrivalsCount = kpis?.first_arrivals ?? 0;

  function applyFilters() {
    setAppliedSelectedPortIds(selectedPortIds);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setAppliedCarrierFilter(carrierFilter);
    setAppliedPaxBasis(paxBasis);
    setAppliedWithoutLta(withoutLta);
    setViewError(null);
  }

  function clearFilters() {
    setSelectedPortIds([]);
    setDateFrom(defaults.from);
    setDateTo(defaults.to);
    setCarrierFilter(EMPTY_DASHBOARD_CARRIER);
    setPaxBasis("planned");
    setWithoutLta(false);
    setAppliedSelectedPortIds([]);
    setAppliedDateFrom(defaults.from);
    setAppliedDateTo(defaults.to);
    setAppliedCarrierFilter(EMPTY_DASHBOARD_CARRIER);
    setAppliedPaxBasis("planned");
    setAppliedWithoutLta(false);
    setViewError(null);
  }

  const canApplyFilters =
    !sameNumberList(selectedPortIds, appliedSelectedPortIds) ||
    dateFrom !== appliedDateFrom ||
    dateTo !== appliedDateTo ||
    !sameCarrierFilter(carrierFilter, appliedCarrierFilter) ||
    paxBasis !== appliedPaxBasis ||
    withoutLta !== appliedWithoutLta;

  return (
    <>
      <FilterSidebarContent>
        <DashboardFilters
          ports={ports}
          groups={groups}
          lines={lines}
          selectedPortIds={selectedPortIds}
          onPortChange={setSelectedPortIds}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          carrierFilter={carrierFilter}
          onCarrierChange={setCarrierFilter}
          paxBasis={paxBasis}
          onPaxBasisChange={setPaxBasis}
          withoutLta={withoutLta}
          onWithoutLtaChange={setWithoutLta}
          defaultDateFrom={defaults.from}
          defaultDateTo={defaults.to}
          canApply={canApplyFilters}
          onApply={applyFilters}
          onClear={clearFilters}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={LayoutDashboard}
        title={dashboardTitle}
        description="KPIs operativos del período, arribos de la semana, conflictos y ocupación por puerto."
      />

      {hasActiveFilters ? (
        <ViewFilteredBanner onClear={clearFilters} chips={activeFilterChips} />
      ) : null}

      {viewError && (
        <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />
      )}

      {statsLoading ? <DashboardKpiCardsSkeleton /> : null}

      {!statsLoading && kpis && stats ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <ViewStatCard
            label="Ocupación"
            value={`${kpis.occupancy_pct}%`}
            description={`${kpis.occupied_slot_days.toLocaleString("es")} de ${kpis.capacity_slot_days.toLocaleString("es")} slot-días`}
            icon={Gauge}
            accentColor="#3478b5"
            gradient="linear-gradient(160deg, rgba(52, 120, 181, 0.14) 0%, var(--background) 55%)"
            badge={
              (kpis.by_year?.length ?? 0) > 1 ? (
                <DashboardYearBreakdown
                  years={kpis.by_year ?? []}
                  formatValue={(row) => `${row.occupancy_pct ?? 0}%`}
                  yoyKey="occupancy_yoy_pct"
                />
              ) : stats.yoy.occupancy ? (
                <DashboardYoyBadge badge={formatYoyBadge(stats.yoy.occupancy)} />
              ) : undefined
            }
            href={bookingsListHref}
          />
          <ViewStatCard
            label={
              appliedPaxBasis === "capacity" ? "PAX cap. máx." : "PAX planificados"
            }
            value={formatCompactNumber(kpis.planned_pax)}
            description={
              kpis.actual_pax > 0
                ? `${kpis.actual_pax.toLocaleString("es")} reales / ${kpis.planned_pax.toLocaleString("es")} ${
                    appliedPaxBasis === "capacity" ? "cap. máx." : "planificados"
                  }`
                : `${kpis.planned_pax.toLocaleString("es")} ${
                    appliedPaxBasis === "capacity" ? "cap. máx." : "planificados"
                  }`
            }
            icon={Users}
            accentColor="#0d9488"
            gradient="linear-gradient(160deg, rgba(13, 148, 136, 0.14) 0%, var(--background) 55%)"
            badge={
              (kpis.by_year?.length ?? 0) > 1 ? (
                <DashboardYearBreakdown
                  years={kpis.by_year ?? []}
                  formatValue={(row) => formatCompactNumber(row.planned_pax)}
                  yoyKey="pax_yoy_pct"
                />
              ) : (
                <DashboardYoyBadge badge={formatYoyBadge(stats.yoy.planned_pax)} />
              )
            }
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
            badge={
              (kpis.by_year?.length ?? 0) > 1 ? (
                <DashboardYearBreakdown
                  years={kpis.by_year ?? []}
                  formatValue={(row) => row.bookings.toLocaleString("es")}
                  yoyKey="bookings_yoy_pct"
                />
              ) : (
                <DashboardYoyBadge badge={formatYoyBadge(stats.yoy.calls)} />
              )
            }
            href={bookingsListHref}
          />
          <ViewStatCard
            label="Promedio PAX/arribo"
            value={formatAvgPax(kpis.avg_pax_per_call ?? 0)}
            description={
              appliedPaxBasis === "capacity"
                ? "Cap. máx. / arribos activos"
                : "Planificados / arribos activos"
            }
            icon={Ship}
            accentColor="#64748b"
            gradient="linear-gradient(160deg, rgba(100, 116, 139, 0.14) 0%, var(--background) 55%)"
            badge={
              (kpis.by_year?.length ?? 0) > 1 ? (
                <DashboardYearBreakdown
                  years={kpis.by_year ?? []}
                  formatValue={(row) => formatAvgPax(row.avg_pax_per_call)}
                />
              ) : stats.yoy.avg_pax_per_call ? (
                <DashboardYoyBadge
                  badge={formatYoyBadge(stats.yoy.avg_pax_per_call)}
                />
              ) : undefined
            }
            href={bookingsListHref}
          />
          <ViewStatCard
            label="Primeros arribos"
            value={firstArrivalsCount.toLocaleString("es")}
            description={
              firstArrivalsCount > 0
                ? "Debuts barco × puerto (CO / CL / R)"
                : "Sin debuts en el período"
            }
            icon={Medal}
            accentColor={firstArrivalsCount > 0 ? "#ca8a04" : "#71717a"}
            gradient={
              firstArrivalsCount > 0
                ? "linear-gradient(160deg, rgba(202, 138, 4, 0.16) 0%, var(--background) 55%)"
                : "linear-gradient(160deg, rgba(113, 113, 122, 0.12) 0%, var(--background) 55%)"
            }
            badge={
              (kpis.by_year?.length ?? 0) > 1 ? (
                <DashboardYearBreakdown
                  years={kpis.by_year ?? []}
                  formatValue={(row) =>
                    (row.first_arrivals ?? 0).toLocaleString("es")
                  }
                  yoyKey="first_arrivals_yoy_pct"
                />
              ) : undefined
            }
            href={bookingsFirstArrivalHref}
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
            badge={
              (kpis.by_year?.length ?? 0) > 1 ? (
                <DashboardYearBreakdown
                  years={kpis.by_year ?? []}
                  formatValue={(row) =>
                    (row.conflicts ?? 0).toLocaleString("es")
                  }
                  yoyKey="conflicts_yoy_pct"
                />
              ) : undefined
            }
            href={bookingsConflictHref}
          />
        </div>
      ) : null}

      {statsLoading ? (
        <DashboardBodySkeleton />
      ) : stats ? (
        <>
          <div className="mb-6">
            <DashboardWeekArrivalsCard
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
          </div>
          <div className="mb-6 grid items-stretch gap-6 lg:grid-cols-2">
            <DashboardPendingConfirmCard
              data={
                stats.pending_confirm ?? {
                  holds: 0,
                  lta: 0,
                  total: 0,
                  hold_since: null,
                  lta_since: null,
                  by_port: [],
                }
              }
              linkBase={linkBase}
            />
            <DashboardPeakPaxByPortCard
              rows={stats.peak_pax_by_port ?? []}
              linkBase={linkBase}
            />
          </div>
          <DashboardOccupancyByPort
            rows={stats.occupancy_by_port}
            trends={stats.occupancy_trends}
          />
          <DashboardCharts stats={stats} linkBase={linkBase} />
        </>
      ) : null}
    </>
  );
}
