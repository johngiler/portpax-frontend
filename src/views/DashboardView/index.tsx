"use client";

import { useCallback, useEffect, useState } from "react";
import { Gauge, LayoutDashboard, Users } from "lucide-react";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import ViewStatCard from "@/components/layout/ViewStatCard";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { fetchDashboardStats } from "@/services/bookings/bookingService";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchShippingLineGroups } from "@/services/catalogs/shippingLineGroupService";
import { fetchAllShippingLines } from "@/services/catalogs/shippingLineService";
import type { Port } from "@/types/catalog";
import type { ShippingLine, ShippingLineGroup } from "@/types/cruise";
import type { DashboardCarrierFilter, DashboardStats } from "@/types/dashboard";
import DashboardCharts from "./DashboardCharts";
import DashboardFilters from "./DashboardFilters";
import DashboardReservasCard from "./DashboardReservasCard";
import DashboardViewSkeleton from "./DashboardViewSkeleton";

function currentYear(): number {
  return new Date().getFullYear();
}

export default function DashboardView() {
  const [ports, setPorts] = useState<Port[]>([]);
  const [groups, setGroups] = useState<ShippingLineGroup[]>([]);
  const [lines, setLines] = useState<ShippingLine[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);

  const [selectedPortId, setSelectedPortId] = useState<number | null>(null);
  const [selectedYears, setSelectedYears] = useState<number[]>(() => [currentYear()]);
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
    setLoading(true);
    setViewError(null);
    try {
      const data = await fetchDashboardStats({
        years: selectedYears,
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
  }, [selectedYears, selectedPortId, carrierFilter]);

  useEffect(() => {
    if (!catalogReady) return;
    loadStats();
  }, [catalogReady, loadStats]);

  if (!catalogReady || (loading && !stats)) {
    return <DashboardViewSkeleton />;
  }

  const kpis = stats?.kpis;
  const yearsLabel =
    selectedYears.length === 1
      ? String(selectedYears[0])
      : selectedYears.join(", ");

  return (
    <>
      <ViewPageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Vista operativa de los años seleccionados: ocupación, reservas, pax y cancelaciones."
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
        selectedYears={selectedYears}
        onYearsChange={setSelectedYears}
        carrierFilter={carrierFilter}
        onCarrierChange={setCarrierFilter}
      />

      {kpis ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
            value={kpis.planned_pax.toLocaleString("es")}
            description={
              kpis.actual_pax > 0
                ? `${kpis.actual_pax.toLocaleString("es")} pax reales`
                : "Suma de pax en reservas activas"
            }
            icon={Users}
            accentColor="#0d9488"
            gradient="linear-gradient(160deg, rgba(13, 148, 136, 0.14) 0%, var(--background) 55%)"
          />
          <DashboardReservasCard
            total={kpis.total_bookings}
            requested={kpis.requested}
            confirmed={kpis.confirmed}
            cancelled={kpis.cancelled}
            yearsLabel={yearsLabel}
          />
        </div>
      ) : null}

      {stats ? <DashboardCharts stats={stats} /> : null}
    </>
  );
}
