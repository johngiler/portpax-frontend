"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardList, Gauge, LayoutDashboard, Users } from "lucide-react";
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
import type { DashboardCarrierFilter } from "@/types/dashboard";
import DashboardCharts from "./DashboardCharts";
import DashboardFilters from "./DashboardFilters";
import DashboardOccupancyByPort from "./DashboardOccupancyByPort";
import DashboardPeakPaxByPortCard from "./DashboardPeakPaxByPortCard";
import DashboardPendingConfirmCard from "./DashboardPendingConfirmCard";
import DashboardViewSkeleton from "./DashboardViewSkeleton";
import DashboardWeekArrivalsCard from "./DashboardWeekArrivalsCard";
import DashboardYoyBadge from "./DashboardYoyBadge";
import {
  buildDashboardActiveFilterChips,
  dashboardHasActiveFilters,
  dashboardTitleYear,
} from "./dashboardActiveFilterChips";
import { dashboardBookingsHref } from "./dashboardBookingsHref";
import { formatCompactNumber, formatYoyBadge } from "./formatDashboardKpi";

function defaultYearRange(): { from: string; to: string } {
  const year = new Date().getFullYear();
  return {
    from: toIsoDate(year, 0, 1),
    to: toIsoDate(year, 11, 31),
  };
}

function sameNumberList(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((value, index) => value === sortedB[index]);
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
  const [carrierFilter, setCarrierFilter] = useState<DashboardCarrierFilter>({
    type: "all",
  });
  const [appliedSelectedPortIds, setAppliedSelectedPortIds] = useState<number[]>(
    [],
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
      portIds: appliedSelectedPortIds,
      carrier: appliedCarrierFilter,
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
  });

  const activeFilterChips = useMemo(() => {
    const portLabel =
      appliedSelectedPortIds.length === 0
        ? null
        : appliedSelectedPortIds.length === 1
          ? (portsById.get(appliedSelectedPortIds[0]) ?? null)
          : `${portsById.get(appliedSelectedPortIds[0]) ?? "Puerto"} +${appliedSelectedPortIds.length - 1}`;

    let carrierLabel: string | null = null;
    if (appliedCarrierFilter.type === "line") {
      carrierLabel =
        lines.find((line) => line.id === appliedCarrierFilter.id)?.name ?? null;
    } else if (appliedCarrierFilter.type === "group") {
      const groupName = groups.find(
        (group) => group.id === appliedCarrierFilter.id,
      )?.name;
      carrierLabel = groupName ? `Grupo: ${groupName}` : null;
    }

    return buildDashboardActiveFilterChips({
      portLabel,
      carrierLabel,
      dateFrom: appliedDateFrom,
      dateTo: appliedDateTo,
      defaultDateFrom: defaults.from,
      defaultDateTo: defaults.to,
    });
  }, [
    appliedSelectedPortIds,
    appliedCarrierFilter,
    appliedDateFrom,
    appliedDateTo,
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

  if (!catalogReady || (isLoading && !stats)) {
    return <DashboardViewSkeleton title={dashboardTitle} />;
  }

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

  function applyFilters() {
    setAppliedSelectedPortIds(selectedPortIds);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setAppliedCarrierFilter(carrierFilter);
    setViewError(null);
  }

  function clearFilters() {
    const allCarriers: DashboardCarrierFilter = { type: "all" };
    setSelectedPortIds([]);
    setDateFrom(defaults.from);
    setDateTo(defaults.to);
    setCarrierFilter(allCarriers);
    setAppliedSelectedPortIds([]);
    setAppliedDateFrom(defaults.from);
    setAppliedDateTo(defaults.to);
    setAppliedCarrierFilter(allCarriers);
    setViewError(null);
  }

  const canApplyFilters =
    !sameNumberList(selectedPortIds, appliedSelectedPortIds) ||
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
          selectedPortIds={selectedPortIds}
          onPortChange={setSelectedPortIds}
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
        title={dashboardTitle}
        description="KPIs operativos del período, arribos de la semana, conflictos y ocupación por puerto."
      />

      {hasActiveFilters ? (
        <ViewFilteredBanner onClear={clearFilters} chips={activeFilterChips} />
      ) : null}

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
