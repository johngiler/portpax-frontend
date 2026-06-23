"use client";

import {
  Anchor,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Ship,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import TimeRangeFilters from "@/components/filters/TimeRangeFilters";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import ViewStatCard from "@/components/layout/ViewStatCard";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { toIsoDate } from "@/lib/bookingDates";
import { getTimeRange, expandRangeForOccupancy, type TimeFilterPreset } from "@/utils/timeRange";
import { loadViewTimePrefs, saveViewTimePrefs } from "@/utils/viewPrefs";
import DashboardOccupancySection from "./DashboardOccupancySection";
import DashboardUpcomingSection from "./DashboardUpcomingSection";
import DashboardViewSkeleton from "./DashboardViewSkeleton";
import { loadDashboardSummary, type DashboardSummary } from "./loadDashboardSummary";

function defaultCustomFrom(): string {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function defaultCustomTo(): string {
  const d = new Date();
  d.setDate(d.getDate() + 29);
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatBookingBreakdown(summary: DashboardSummary): string {
  const parts: string[] = [];
  if (summary.bookingsRequested > 0) {
    parts.push(`${summary.bookingsRequested} solicitadas`);
  }
  if (summary.bookingsConfirmed > 0) {
    parts.push(`${summary.bookingsConfirmed} confirmadas`);
  }
  if (summary.bookingsCancelled > 0) {
    parts.push(`${summary.bookingsCancelled} canceladas`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Sin reservas en el período";
}

export default function DashboardView() {
  const [timeFilter, setTimeFilter] = useState<TimeFilterPreset>("30d");
  const [customDateFrom, setCustomDateFrom] = useState(defaultCustomFrom);
  const [customDateTo, setCustomDateTo] = useState(defaultCustomTo);
  const [hasLoadedPrefs, setHasLoadedPrefs] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  useEffect(() => {
    const prefs = loadViewTimePrefs();
    if (prefs) {
      setTimeFilter(prefs.timeFilter);
      setCustomDateFrom(prefs.customDateFrom);
      setCustomDateTo(prefs.customDateTo);
    }
    setHasLoadedPrefs(true);
  }, []);

  const timeRange = useMemo(
    () => getTimeRange(timeFilter, customDateFrom, customDateTo),
    [timeFilter, customDateFrom, customDateTo],
  );

  const occupancyRange = useMemo(
    () => expandRangeForOccupancy(timeRange),
    [timeRange],
  );

  useEffect(() => {
    if (!hasLoadedPrefs) return;
    saveViewTimePrefs({ timeFilter, customDateFrom, customDateTo });
  }, [hasLoadedPrefs, timeFilter, customDateFrom, customDateTo]);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setViewError(null);
    try {
      const data = await loadDashboardSummary(timeRange);
      setSummary(data);
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudo cargar el resumen del dashboard."),
      );
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (!hasLoadedPrefs) return;
    loadSummary();
  }, [hasLoadedPrefs, loadSummary]);

  useEffect(() => {
    if (!hasLoadedPrefs) return;

    function refresh() {
      loadSummary();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") refresh();
    }

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [hasLoadedPrefs, loadSummary]);

  if (!hasLoadedPrefs || (loading && !summary)) {
    return <DashboardViewSkeleton />;
  }

  const statCards = summary
    ? [
        {
          label: "Reservas",
          value: summary.bookingsTotal,
          description: formatBookingBreakdown(summary),
          icon: ClipboardList,
          color: "#3478b5",
          gradient:
            "linear-gradient(160deg, rgba(52, 120, 181, 0.14) 0%, var(--background) 55%)",
          href: "/bookings",
        },
        {
          label: "Puertos",
          value: summary.portsTotal,
          description: "Puertos en catálogo",
          icon: MapPin,
          color: "#0d9488",
          gradient:
            "linear-gradient(160deg, rgba(13, 148, 136, 0.14) 0%, var(--background) 55%)",
          href: "/ports",
        },
        {
          label: "Navieras",
          value: summary.shippingLinesTotal,
          description: "Marcas operativas",
          icon: Anchor,
          color: "#d97706",
          gradient:
            "linear-gradient(160deg, rgba(217, 119, 6, 0.12) 0%, var(--background) 55%)",
          href: "/shipping-lines",
        },
        {
          label: "Barcos",
          value: summary.vesselsTotal,
          description: "Flota registrada",
          icon: Ship,
          color: "#7c3aed",
          gradient:
            "linear-gradient(160deg, rgba(124, 58, 237, 0.14) 0%, var(--background) 55%)",
          href: "/shipping-lines",
        },
      ]
    : [];

  return (
    <>
      <FilterSidebarContent>
        <TimeRangeFilters
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          customDateFrom={customDateFrom}
          setCustomDateFrom={setCustomDateFrom}
          customDateTo={customDateTo}
          setCustomDateTo={setCustomDateTo}
          timeRange={timeRange}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Resumen operativo de reservas, ocupación visual y catálogos del período seleccionado."
      />

      {viewError && (
        <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />
      )}

      <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, description, icon, color, gradient, href, value }) => (
          <ViewStatCard
            key={label}
            label={label}
            value={value}
            description={description}
            icon={icon}
            accentColor={color}
            gradient={gradient}
            href={href}
          />
        ))}
      </div>

      <DashboardOccupancySection
        dateFrom={occupancyRange.date_from}
        dateTo={occupancyRange.date_to}
      />

      {summary && (
        <DashboardUpcomingSection
          bookings={summary.upcomingBookings}
          dateFrom={timeRange.date_from}
          dateTo={timeRange.date_to}
        />
      )}
    </>
  );
}
