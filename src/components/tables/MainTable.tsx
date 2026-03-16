"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Children, cloneElement, isValidElement, useState } from "react";

/**
 * Tabla de datos: estilo consistente y moderno.
 */
type MainTableProps = {
  children: React.ReactNode;
  className?: string;
};

export default function MainTable({ children, className = "" }: MainTableProps) {
  return (
    <div
      className={`min-w-0 overflow-x-auto rounded-xl border border-[var(--admin-border)]/65 bg-[var(--admin-surface)] shadow-[var(--admin-card-shadow)] ${className}`}
    >
      {children}
    </div>
  );
}

export function MainTableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[var(--admin-border)]/60 bg-[var(--admin-surface-muted)]">
        {children}
      </tr>
    </thead>
  );
}

export function MainTableTh({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      {children}
    </th>
  );
}

export function MainTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-[var(--admin-border)]/45">{children}</tbody>;
}

export function MainTableRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={`transition-colors hover:bg-[var(--admin-surface-muted)]/75 ${className}`}
    >
      {children}
    </tr>
  );
}

export function MainTableTd({
  children,
  className = "",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <td
      className={`px-5 py-3.5 text-sm text-zinc-700 dark:text-zinc-200 ${className}`}
      title={title}
    >
      {children}
    </td>
  );
}

export function MainTableEmpty({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-5 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
      >
        {children}
      </td>
    </tr>
  );
}

/**
 * Fila con acordeón: la primera celda incluye un chevron que expande/colapsa
 * el contenido adicional debajo. Animación suave; el contenido expandido
 * puede usar grid/flex responsive para apilar en vertical cuando falte ancho.
 *
 * Uso: envuelve las celdas normales y pasa expandContent con el detalle.
 * Regla general: todas las tablas con datos pueden usar esto para mostrar
 * toda la info sin abrir el modal "Ver".
 */
export function AccordionTableRow({
  children,
  colSpan,
  expandContent,
  className = "",
}: {
  children: React.ReactNode;
  colSpan: number;
  expandContent: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const childArray = Children.toArray(children);
  const firstChild = childArray[0];
  const firstEl =
    isValidElement(firstChild) && "props" in firstChild
      ? (firstChild as React.ReactElement<{ children?: React.ReactNode }>)
      : null;
  const toggle = () => setOpen((v) => !v);
  const firstCellWithToggle =
    firstEl
      ? cloneElement(firstEl, {}, (
          <div
            role="button"
            tabIndex={0}
            onClick={toggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle();
              }
            }}
            className="flex w-full cursor-pointer items-center gap-2 py-0.5 pr-2"
            aria-expanded={open}
            aria-label={open ? "Colapsar fila" : "Expandir fila"}
            title={open ? "Colapsar" : "Expandir"}
          >
            <span className="inline-flex shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden>
              {open ? (
                <ChevronDown className="h-4 w-4" strokeWidth={2} />
              ) : (
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              )}
            </span>
            {firstEl.props.children}
          </div>
        ))
      : firstChild;

  return (
    <>
      <tr
        className={`table-accordion-row transition-colors hover:bg-[var(--admin-surface-muted)]/75 ${open ? "bg-[var(--admin-surface-muted)]/50" : ""} ${className}`}
      >
        {firstCellWithToggle}
        {childArray.slice(1)}
      </tr>
      <tr
        className="table-accordion-detail-row"
        aria-hidden={!open}
        data-open={open ? "true" : "false"}
      >
        <td colSpan={colSpan} className="p-0 align-top">
          <div className="table-accordion-expand-wrapper">
            <div className="table-accordion-expand-inner">
              <div className="table-accordion-expand-content">{expandContent}</div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
