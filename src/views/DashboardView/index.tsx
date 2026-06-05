"use client";

import {
  CalendarDays,
  ClipboardList,
  Info,
  LayoutDashboard,
  MapPin,
  Ship,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import TimeRangeFilters from "@/components/filters/TimeRangeFilters";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import ViewSection from "@/components/layout/ViewSection";
import ViewStatCard from "@/components/layout/ViewStatCard";
import { getTimeRange, type TimeFilterPreset } from "@/utils/timeRange";
import { loadViewTimePrefs, saveViewTimePrefs } from "@/utils/viewPrefs";

const STAT_CARDS = [
  {
    label: "Bookings",
    description: "Fase 1 — por conectar",
    icon: ClipboardList,
    color: "#3478b5",
    gradient:
      "linear-gradient(160deg, rgba(52, 120, 181, 0.14) 0%, var(--background) 55%)",
  },
  {
    label: "Puertos",
    description: "Catálogos — por conectar",
    icon: MapPin,
    color: "#0d9488",
    gradient:
      "linear-gradient(160deg, rgba(13, 148, 136, 0.14) 0%, var(--background) 55%)",
  },
  {
    label: "Escalas",
    description: "Operación — por conectar",
    icon: CalendarDays,
    color: "#d97706",
    gradient:
      "linear-gradient(160deg, rgba(217, 119, 6, 0.12) 0%, var(--background) 55%)",
  },
  {
    label: "Barcos",
    description: "Catálogos — por conectar",
    icon: Ship,
    color: "#7c3aed",
    gradient:
      "linear-gradient(160deg, rgba(124, 58, 237, 0.14) 0%, var(--background) 55%)",
  },
] as const;

function defaultCustomFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toISOString().slice(0, 10);
}

const defaultCustomTo = (): string => new Date().toISOString().slice(0, 10);

export default function DashboardView() {
  const [timeFilter, setTimeFilter] = useState<TimeFilterPreset>("7d");
  const [customDateFrom, setCustomDateFrom] = useState(defaultCustomFrom);
  const [customDateTo, setCustomDateTo] = useState(defaultCustomTo);
  const [hasLoadedPrefs, setHasLoadedPrefs] = useState(false);

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
    [timeFilter, customDateFrom, customDateTo]
  );

  useEffect(() => {
    if (!hasLoadedPrefs) return;
    saveViewTimePrefs({ timeFilter, customDateFrom, customDateTo });
  }, [hasLoadedPrefs, timeFilter, customDateFrom, customDateTo]);

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
        description="Plantilla base — los módulos se irán habilitando según las fases del proyecto."
      />

      <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map(({ label, description, icon, color, gradient }) => (
          <ViewStatCard
            key={label}
            label={label}
            value="—"
            description={description}
            icon={icon}
            accentColor={color}
            gradient={gradient}
          />
        ))}
      </div>

      <ViewSection
        icon={Info}
        title="Bienvenido a PortPax"
        description="Punto de entrada mientras se implementa la Fase 1 (Booking)."
      >
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          El layout, header, sidebar y panel de filtros permanecen como plantilla para las
          vistas que se agreguen conforme avance el backend.
        </p>
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
          Período seleccionado: {timeRange.date_from} → {timeRange.date_to}
        </p>
      </ViewSection>
    </>
  );
}
