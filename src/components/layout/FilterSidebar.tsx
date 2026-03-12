"use client";

import { useLayoutEffect } from "react";
import { useAdminLayout, useAdminLayoutOptional } from "@/contexts/AdminLayoutContext";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";

type FilterSidebarProps = {
  children: React.ReactNode;
};

/**
 * Las páginas con filtros usan este componente para inyectar el contenido del panel.
 * No renderiza nada; el layout muestra el FilterSidebar a la derecha con este contenido.
 */
export function FilterSidebarContent({ children }: { children: React.ReactNode }) {
  const { setFilterContent } = useAdminLayout();
  useLayoutEffect(() => {
    setFilterContent(children);
    return () => setFilterContent(null);
  }, [children, setFilterContent]);
  return null;
}

/**
 * Sidebar de filtros espejo del sidebar principal (lado derecho).
 * - Colapsado: mismo ancho que sidebar principal colapsado (w-16)
 * - Expandido: mismo ancho que sidebar principal expandido (w-64)
 */
export default function FilterSidebar({ children }: FilterSidebarProps) {
  const layout = useAdminLayoutOptional();
  const open = layout?.filterOpen ?? false;
  const setFilterOpen = layout?.setFilterOpen;

  if (!setFilterOpen) return null;

  return (
    <aside
      className={`relative flex min-h-0 self-stretch shrink-0 flex-col border-l border-[var(--admin-border)] bg-[var(--admin-sidebar)]/90 backdrop-blur-md transition-[width] duration-200 ${
        open ? "w-64 shadow-[var(--admin-card-shadow-hover)]" : "w-16 shadow-[var(--admin-card-shadow)]"
      }`}
    >
      <nav
        className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${open ? "p-4" : "px-2 pt-2"}`}
      >
        {open ? (
          <>
            <span className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Filtros
            </span>
            <div className="pt-1">{children}</div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setFilterOpen(!open)}
            className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-md py-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
            aria-label="Expandir filtros"
            title="Expandir filtros"
          >
            <Filter className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            <span className="text-[11px] font-medium tracking-wide">Filtros</span>
          </button>
        )}
      </nav>

      {/* Flecha espejo: centrada en borde interno, igual al sidebar izquierdo */}
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

