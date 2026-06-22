"use client";

import Link from "next/link";
import { CalendarDays, Plus, SearchX } from "lucide-react";

type BookingsEmptyStateProps = {
  variant: "empty" | "filtered";
  onClearFilters?: () => void;
};

const CREATE_LINK_CLASS =
  "btn-primary-gradient inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105 hover:shadow-[0_8px_22px_-14px_rgba(52,120,181,0.7)]";

export default function BookingsEmptyState({
  variant,
  onClearFilters,
}: BookingsEmptyStateProps) {
  const isFiltered = variant === "filtered";

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white via-[var(--admin-accent)]/[0.05] to-zinc-50 px-6 py-12 text-center shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
        {isFiltered ? (
          <SearchX className="h-8 w-8" strokeWidth={1.5} aria-hidden />
        ) : (
          <CalendarDays className="h-8 w-8" strokeWidth={1.5} aria-hidden />
        )}
      </div>

      <h2 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {isFiltered ? "Sin reservas con estos filtros" : "Aún no hay reservas"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        {isFiltered
          ? "Ajusta la búsqueda o el estado, o crea una nueva solicitud de escala."
          : "Registra escalas por puerto, naviera y barco. El wizard genera un código único por cada fecha."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/bookings/new" className={CREATE_LINK_CLASS}>
          <Plus className="h-4 w-4" strokeWidth={2} />
          Crear reserva
        </Link>

        {isFiltered && onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="cursor-pointer rounded-md border border-zinc-200/80 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}
