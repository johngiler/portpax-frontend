"use client";

import { LayoutDashboard } from "lucide-react";
import { useCallback, useState } from "react";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import DashboardChartsSection from "./DashboardChartsSection";
import DashboardSection from "./DashboardSection";
import {
  type DashboardVisibility,
  DEFAULT_DASHBOARD_VISIBILITY as DEFAULT_VISIBILITY,
} from "@/types/dashboard";

function DashboardFilters({
  visibility,
  setVisibility,
}: {
  visibility: DashboardVisibility;
  setVisibility: (v: DashboardVisibility) => void;
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

export default function DashboardView() {
  const [visibility, setVisibility] = useState<DashboardVisibility>(DEFAULT_VISIBILITY);

  return (
    <>
      <FilterSidebarContent>
        <DashboardFilters visibility={visibility} setVisibility={setVisibility} />
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
        <DashboardChartsSection visibility={visibility} />
      </div>
    </>
  );
}
