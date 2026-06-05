"use client";

import { LayoutDashboard } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import {
  loadDashboardPrefs,
  saveDashboardPrefs,
} from "@/utils/dashboardPrefs";
import {
  getTimeRange,
  TIME_FILTER_LABELS,
  type TimeFilterPreset,
  type TimeRange,
} from "@/utils/timeRange";
import DashboardChartsSection from "./DashboardChartsSection";
import DashboardSection from "./DashboardSection";
import {
  type DashboardVisibility,
  DEFAULT_DASHBOARD_VISIBILITY as DEFAULT_VISIBILITY,
} from "@/types/dashboard";

function DashboardFilters({
  visibility,
  setVisibility,
  timeFilter,
  setTimeFilter,
  customDateFrom,
  setCustomDateFrom,
  customDateTo,
  setCustomDateTo,
  timeRange,
}: {
  visibility: DashboardVisibility;
  setVisibility: (v: DashboardVisibility) => void;
  timeFilter: TimeFilterPreset;
  setTimeFilter: (v: TimeFilterPreset) => void;
  customDateFrom: string;
  setCustomDateFrom: (v: string) => void;
  customDateTo: string;
  setCustomDateTo: (v: string) => void;
  timeRange: TimeRange;
}) {
  const set = useCallback(
    (key: keyof DashboardVisibility, value: boolean) => {
      setVisibility({ ...visibility, [key]: value });
    },
    [visibility, setVisibility]
  );
  const showAll = useCallback(() => setVisibility({ ...DEFAULT_VISIBILITY }), [setVisibility]);
  const hideAll = useCallback(
    () =>
      setVisibility({
        cards: false,
        alertasOperativas: false,
        mapaPuerto: false,
        timelineMuelles: false,
        resumenMetricas: false,
        estimadoIngresos: false,
        proximasEscalas: false,
        escalasPorPuerto: false,
        paxPorPuerto: false,
        escalasPorNaviera: false,
        escalasPorMuelle: false,
        escalasPorMes: false,
        paxPorMes: false,
        escalasPaxPorAno: false,
      }),
    [setVisibility]
  );

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Período
      </p>
      <div className="flex flex-wrap gap-1.5">
        {(["hoy", "7d", "30d", "temporada"] as const).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setTimeFilter(preset)}
            className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              timeFilter === preset
                ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]"
                : "border-[var(--admin-border)] bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {TIME_FILTER_LABELS[preset]}
          </button>
        ))}
      </div>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="radio"
          name="timeFilter"
          checked={timeFilter === "custom"}
          onChange={() => setTimeFilter("custom")}
          className="h-4 w-4 cursor-pointer border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          {TIME_FILTER_LABELS.custom}
        </span>
      </label>
      {timeFilter === "custom" && (
        <div className="space-y-2 pl-6">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Desde
            </label>
            <input
              type="date"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-[var(--admin-border)] bg-white px-2.5 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Hasta
            </label>
            <input
              type="date"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-[var(--admin-border)] bg-white px-2.5 py-1.5 text-sm dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      )}
      {timeFilter !== "custom" && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {timeRange.date_from} → {timeRange.date_to}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={showAll}
          className="cursor-pointer rounded-md border border-[var(--admin-border)] bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Mostrar todo
        </button>
        <button
          type="button"
          onClick={hideAll}
          className="cursor-pointer rounded-md border border-[var(--admin-border)] bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Ocultar todo
        </button>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Secciones
      </p>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={visibility.cards}
          onChange={(e) => set("cards", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className={`text-sm ${visibility.cards ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
          Tarjetas de resumen
        </span>
      </label>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Gráficas
      </p>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={visibility.timelineMuelles}
          onChange={(e) => set("timelineMuelles", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className={`text-sm ${visibility.timelineMuelles ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
          Timeline de muelles
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={visibility.alertasOperativas}
          onChange={(e) => set("alertasOperativas", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className={`text-sm ${visibility.alertasOperativas ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
          Alertas operativas
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={visibility.mapaPuerto}
          onChange={(e) => set("mapaPuerto", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className={`text-sm ${visibility.mapaPuerto ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
          Mapa del puerto
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={visibility.resumenMetricas}
          onChange={(e) => set("resumenMetricas", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className={`text-sm ${visibility.resumenMetricas ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
          Resumen de métricas
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={visibility.estimadoIngresos}
          onChange={(e) => set("estimadoIngresos", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className={`text-sm ${visibility.estimadoIngresos ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
          Estimado de ingresos
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={visibility.proximasEscalas}
          onChange={(e) => set("proximasEscalas", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className={`text-sm ${visibility.proximasEscalas ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
          Próximas escalas
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={visibility.escalasPorPuerto}
          onChange={(e) => set("escalasPorPuerto", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className={`text-sm ${visibility.escalasPorPuerto ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
          Escalas por puerto
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={visibility.paxPorPuerto}
          onChange={(e) => set("paxPorPuerto", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className={`text-sm ${visibility.paxPorPuerto ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
          PAX por puerto
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={visibility.escalasPorNaviera}
          onChange={(e) => set("escalasPorNaviera", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className={`text-sm ${visibility.escalasPorNaviera ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
          Escalas por naviera
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={visibility.escalasPorMuelle}
          onChange={(e) => set("escalasPorMuelle", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className={`text-sm ${visibility.escalasPorMuelle ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
          Escalas por muelle
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={visibility.escalasPorMes}
          onChange={(e) => set("escalasPorMes", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className={`text-sm ${visibility.escalasPorMes ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
          Escalas por mes
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={visibility.paxPorMes}
          onChange={(e) => set("paxPorMes", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className={`text-sm ${visibility.paxPorMes ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
          PAX total por mes
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={visibility.escalasPaxPorAno}
          onChange={(e) => set("escalasPaxPorAno", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className={`text-sm ${visibility.escalasPaxPorAno ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
          Escalas y PAX por año
        </span>
      </label>
    </div>
  );
}

const defaultCustomFrom = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toISOString().slice(0, 10);
};
const defaultCustomTo = (): string => new Date().toISOString().slice(0, 10);

export default function DashboardView() {
  const [visibility, setVisibility] = useState<DashboardVisibility>(DEFAULT_VISIBILITY);
  const [timeFilter, setTimeFilter] = useState<TimeFilterPreset>("7d");
  const [customDateFrom, setCustomDateFrom] = useState(defaultCustomFrom);
  const [customDateTo, setCustomDateTo] = useState(defaultCustomTo);
  const [hasLoadedPrefs, setHasLoadedPrefs] = useState(false);

  useEffect(() => {
    const prefs = loadDashboardPrefs();
    if (prefs) {
      setVisibility(prefs.visibility);
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
    saveDashboardPrefs({
      visibility,
      timeFilter,
      customDateFrom,
      customDateTo,
    });
  }, [hasLoadedPrefs, visibility, timeFilter, customDateFrom, customDateTo]);

  return (
    <>
      <FilterSidebarContent>
        <DashboardFilters
          visibility={visibility}
          setVisibility={setVisibility}
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          customDateFrom={customDateFrom}
          setCustomDateFrom={setCustomDateFrom}
          customDateTo={customDateTo}
          setCustomDateTo={setCustomDateTo}
          timeRange={timeRange}
        />
      </FilterSidebarContent>
      <div>
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <LayoutDashboard className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Resumen del módulo Docking / Muellaje
          </p>
        </div>
        {visibility.cards && <DashboardSection />}
        <DashboardChartsSection visibility={visibility} timeRange={timeRange} />
      </div>
    </>
  );
}
