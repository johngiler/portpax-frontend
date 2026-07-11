"use client";

import { useLayoutEffect, useRef, useState, useEffect } from "react";
import {
  useMainLayout,
  useMainLayoutOptional,
} from "@/contexts/MainLayoutContext";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
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

const exportOptions = [
  { id: "excel", label: "Exportar a Excel" },
  { id: "csv", label: "Exportar a CSV" },
] as const;

/**
 * Sidebar de filtros espejo del sidebar principal (lado derecho).
 * Incluye sección Importar/Exportar para vistas con datos (Excel/CSV).
 */
export default function FilterSidebar({ children }: FilterSidebarProps) {
  const layout = useMainLayoutOptional();
  const open = layout?.filterOpen ?? false;
  const setFilterOpen = layout?.setFilterOpen;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  if (!setFilterOpen) return null;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Placeholder: la lógica de importación se implementará más adelante
      console.info("[Import] Archivo seleccionado:", file.name);
    }
    e.target.value = "";
  };

  const handleExportOption = (id: string) => {
    setExportOpen(false);
    // Placeholder: la lógica de exportación se implementará más adelante
    console.info("[Export] Formato solicitado:", id);
  };

  // Cerrar menú export al hacer clic fuera
  useEffect(() => {
    if (!exportOpen) return;
    const close = (e: MouseEvent) => {
      if (exportMenuRef.current?.contains(e.target as Node)) return;
      setExportOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [exportOpen]);

  const iconButtonClass =
    "flex w-full cursor-pointer flex-col items-center gap-2 rounded-md py-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200";

  return (
    <aside
      className={`relative flex h-full min-h-0 shrink-0 flex-col border-l border-[var(--admin-border)] bg-[var(--admin-sidebar)]/90 backdrop-blur-md transition-[width] duration-200 ${
        open
          ? "w-[320px] shadow-[var(--admin-card-shadow-hover)]"
          : "w-16 shadow-[var(--admin-card-shadow)]"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        aria-hidden
        onChange={handleFileChange}
      />

      <nav
        className={`flex min-h-0 flex-1 flex-col ${open ? "p-4" : "px-2 pt-2"}`}
      >
        {open ? (
          <>
            <span className="shrink-0 mb-4 px-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Filtros
            </span>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain pt-1">
              {children}

              <div className="mt-4 border-t border-[var(--admin-border)] pt-4">
                <span className="mb-3 block px-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Datos
                </span>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={handleImportClick}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-zinc-600 transition-colors hover:bg-white/10 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
                    aria-label="Importar desde Excel/CSV"
                    title="Importar desde Excel o CSV"
                  >
                    <Upload className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span>Importar</span>
                  </button>
                  <div className="relative" ref={exportMenuRef}>
                    <button
                      type="button"
                      onClick={() => setExportOpen((v) => !v)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-zinc-600 transition-colors hover:bg-white/10 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
                      aria-label="Exportar"
                      aria-expanded={exportOpen}
                      aria-haspopup="true"
                      title="Exportar a Excel o CSV"
                    >
                      <Download className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span>Exportar</span>
                    </button>
                    {exportOpen && (
                      <div
                        className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] py-1 shadow-lg dark:bg-zinc-800"
                        role="menu"
                      >
                        {exportOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            role="menuitem"
                            onClick={() => handleExportOption(opt.id)}
                            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
              onClick={handleImportClick}
              className={iconButtonClass}
              aria-label="Importar"
              title="Importar desde Excel o CSV"
            >
              <Upload className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span className="text-[11px] font-medium tracking-wide">
                Importar
              </span>
            </button>
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setExportOpen((v) => !v)}
                className={iconButtonClass}
                aria-label="Exportar"
                aria-expanded={exportOpen}
                title="Exportar a Excel o CSV"
              >
                <Download
                  className="h-[18px] w-[18px] shrink-0"
                  strokeWidth={2}
                />
                <span className="text-[11px] font-medium tracking-wide">
                  Exportar
                </span>
              </button>
              {exportOpen && (
                <div
                  className="absolute right-full top-0 z-20 mr-1 min-w-[180px] rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] py-1 shadow-lg dark:bg-zinc-800"
                  role="menu"
                >
                  {exportOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleExportOption(opt.id)}
                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
  );
}
