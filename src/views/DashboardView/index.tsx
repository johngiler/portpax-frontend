"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardList, Gauge, LayoutDashboard, Users } from "lucide-react";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import ViewStatCard from "@/components/layout/ViewStatCard";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { toIsoDate } from "@/lib/bookingDates";
import { fetchDashboardStats } from "@/services/bookings/bookingService";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchShippingLineGroups } from "@/services/catalogs/shippingLineGroupService";
import { fetchAllShippingLines } from "@/services/catalogs/shippingLineService";
import type { Port } from "@/types/catalog";
import type { ShippingLine, ShippingLineGroup } from "@/types/cruise";
import type { DashboardCarrierFilter, DashboardStats } from "@/types/dashboard";
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
  const [ports, setPorts] = useState<Port[]>([]);
  const [groups, setGroups] = useState<ShippingLineGroup[]>([]);
  const [lines, setLines] = useState<ShippingLine[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);

  const [selectedPortId, setSelectedPortId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [carrierFilter, setCarrierFilter] = useState<DashboardCarrierFilter>({
    type: "all",
  });

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCatalogs() {
      try {
        const [portsRes, groupsRes, linesRes] = await Promise.all([
          fetchPorts({ pageSize: 100 }),
          fetchShippingLineGroups(),
          fetchAllShippingLines({ pageSize: 100 }),
        ]);
        if (cancelled) return;
        setPorts(portsRes.results.filter((port) => port.is_active));
        setGroups(groupsRes);
        setLines(linesRes.filter((line) => line.is_active));
      } catch (err) {
        if (!cancelled) {
          setViewError(
            getApiErrorMessage(err, "No se pudieron cargar los filtros del dashboard."),
          );
        }
      } finally {
        if (!cancelled) setCatalogReady(true);
      }
    }
    loadCatalogs();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadStats = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    setViewError(null);
    try {
      const data = await fetchDashboardStats({
        date_from: dateFrom,
        date_to: dateTo,
        port: selectedPortId ?? undefined,
        shipping_line:
          carrierFilter.type === "line" ? carrierFilter.id : undefined,
        shipping_line_group:
          carrierFilter.type === "group" ? carrierFilter.id : undefined,
      });
      setStats(data);
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudo cargar el resumen operativo."),
      );
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, selectedPortId, carrierFilter]);

  useEffect(() => {
    if (!catalogReady) return;
    loadStats();
  }, [catalogReady, loadStats]);

  if (!catalogReady || (loading && !stats)) {
    return <DashboardViewSkeleton />;
  }

  const kpis = stats?.kpis;
  const periodLabel = formatPeriodLabel(dateFrom, dateTo);

  return (
    <>
      <ViewPageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="KPIs operativos del período, cola de acción, próximos 30 días y ocupación por puerto."
      />

      {viewError && (
        <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />
      )}

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
      />

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
