"use client";

import { useLayoutEffect, useState } from "react";
import {
  useMainLayout,
  useMainLayoutOptional,
} from "@/contexts/MainLayoutContext";
import { useDataActivity } from "@/lib/dataActivityStore";
import { useDataExport } from "@/lib/dataExportStore";
import { useDataImport } from "@/lib/dataImportStore";
import ExportOptionsModal from "@/components/ui/ExportOptionsModal";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  History,
  Upload,
} from "lucide-react";

type FilterSidebarProps = {
  children: React.ReactNode;
};

/**
 * Las páginas con filtros usan este componente para inyectar el contenido del panel.
 * No renderiza nada; el layout muestra el FilterSidebar a la derecha con este contenido.
 */
export function FilterSidebarContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setFilterContent } = useMainLayout();
  useLayoutEffect(() => {
    setFilterContent(children);
    return () => setFilterContent(null);
  }, [children, setFilterContent]);
  return null;
}

/**
 * Sidebar de filtros espejo del sidebar principal (lado derecho).
 * Incluye sección Datos: Importar / Exportar / Historial.
 */
export default function FilterSidebar({ children }: FilterSidebarProps) {
  const layout = useMainLayoutOptional();
  const open = layout?.filterOpen ?? false;
  const setFilterOpen = layout?.setFilterOpen;
  const { canExport, runExport } = useDataExport();
  const { canImport, runImport } = useDataImport();
  const { canOpenActivity, runActivity } = useDataActivity();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [openingActivity, setOpeningActivity] = useState(false);

  if (!setFilterOpen) return null;

  const handleImportClick = async () => {
    if (!canImport || importing) return;
    setImporting(true);
    try {
      await runImport();
    } finally {
      setImporting(false);
    }
  };

  const handleExportClick = () => {
    if (!canExport || exporting) return;
    setExportModalOpen(true);
  };

  const handleExportOption = async (id: "xlsx" | "csv") => {
    if (!canExport || exporting) return;
    setExporting(true);
    try {
      await runExport(id);
      setExportModalOpen(false);
    } finally {
      setExporting(false);
    }
  };

  const handleActivityClick = async () => {
    if (!canOpenActivity || openingActivity) return;
    setOpeningActivity(true);
    try {
      await runActivity();
    } finally {
      setOpeningActivity(false);
    }
  };

  const exportDisabled = !canExport || exporting;
  const importDisabled = !canImport || importing;
  const activityDisabled = !canOpenActivity || openingActivity;

  const iconButtonClass =
    "flex w-full cursor-pointer flex-col items-center gap-2 rounded-md py-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200";

  const importTitle = canImport
    ? importing
      ? "Abriendo…"
      : "Opciones de importación"
    : "Importación no disponible en esta vista";

  const exportTitle = canExport
    ? exporting
      ? "Exportando…"
      : "Opciones de exportación"
    : "Exportación no disponible en esta vista";

  const activityTitle = canOpenActivity
    ? openingActivity
      ? "Abriendo…"
      : "Historial de movimientos de esta vista"
    : "Historial no disponible en esta vista";

  const dataActionClass =
    "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-zinc-600 transition-colors hover:bg-white/10 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200";

  return (
    <>
      <aside
        className={`relative flex h-full min-h-0 shrink-0 flex-col border-l border-[var(--admin-border)] bg-[var(--admin-sidebar)]/90 backdrop-blur-md transition-[width] duration-200 ${
          open
            ? "w-[320px] shadow-[var(--admin-card-shadow-hover)]"
            : "w-16 shadow-[var(--admin-card-shadow)]"
        }`}
      >
        <nav
          className={`flex min-h-0 flex-1 flex-col ${open ? "p-4" : "px-2 pt-2"}`}
        >
          {open ? (
            <>
              <span className="shrink-0 mb-4 px-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Filtros
              </span>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain pt-1">
                <div className="flex flex-col gap-3 [&>*]:!mb-0">{children}</div>

                <div className="mt-4 border-t border-[var(--admin-border)] pt-4">
                  <span className="mb-3 block px-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Datos
                  </span>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={importDisabled}
                      onClick={handleImportClick}
                      className={dataActionClass}
                      aria-label="Importar desde Excel/CSV"
                      title={importTitle}
                    >
                      <Upload className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span>{importing ? "Abriendo…" : "Importar"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={exportDisabled}
                      onClick={handleExportClick}
                      className={dataActionClass}
                      aria-label="Exportar"
                      title={exportTitle}
                    >
                      <Download className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span>{exporting ? "Exportando…" : "Exportar"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={activityDisabled}
                      onClick={() => void handleActivityClick()}
                      className={dataActionClass}
                      aria-label="Historial de movimientos"
                      title={activityTitle}
                    >
                      <History className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span>
                        {openingActivity ? "Abriendo…" : "Historial"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-5">
              <button
                type="button"
                onClick={() => setFilterOpen(!open)}
                className={iconButtonClass}
                aria-label="Expandir filtros"
                title="Expandir filtros"
              >
                <Filter className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                <span className="text-[11px] font-medium tracking-wide">
                  Filtros
                </span>
              </button>
              <button
                type="button"
                disabled={importDisabled}
                onClick={handleImportClick}
                className={`${iconButtonClass} disabled:cursor-not-allowed disabled:opacity-40`}
                aria-label="Importar"
                title={importTitle}
              >
                <Upload className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                <span className="text-[11px] font-medium tracking-wide">
                  {importing ? "…" : "Importar"}
                </span>
              </button>
              <button
                type="button"
                disabled={exportDisabled}
                onClick={handleExportClick}
                className={`${iconButtonClass} disabled:cursor-not-allowed disabled:opacity-40`}
                aria-label="Exportar"
                title={exportTitle}
              >
                <Download
                  className="h-[18px] w-[18px] shrink-0"
                  strokeWidth={2}
                />
                <span className="text-[11px] font-medium tracking-wide">
                  {exporting ? "…" : "Exportar"}
                </span>
              </button>
              <button
                type="button"
                disabled={activityDisabled}
                onClick={() => void handleActivityClick()}
                className={`${iconButtonClass} disabled:cursor-not-allowed disabled:opacity-40`}
                aria-label="Historial"
                title={activityTitle}
              >
                <History
                  className="h-[18px] w-[18px] shrink-0"
                  strokeWidth={2}
                />
                <span className="text-[11px] font-medium tracking-wide">
                  {openingActivity ? "…" : "Historial"}
                </span>
              </button>
            </div>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setFilterOpen(!open)}
          className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-sidebar)] shadow-[var(--admin-card-shadow)] text-zinc-500 transition-colors duration-200 hover:bg-white hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
          aria-label={open ? "Recoger filtros" : "Expandir filtros"}
          title={open ? "Recoger filtros" : "Expandir filtros"}
        >
          {open ? (
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          ) : (
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </aside>

      <ExportOptionsModal
        open={exportModalOpen}
        onClose={() => !exporting && setExportModalOpen(false)}
        onExport={handleExportOption}
        disabled={!canExport}
        exporting={exporting}
      />
    </>
  );
}
