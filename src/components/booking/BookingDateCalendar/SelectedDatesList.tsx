"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { useMotionTransition } from "@/lib/motionPresets";

type SelectedDatesListProps = {
  selectedDates: string[];
  /** Dates that have occupancy (chip opens accordion). */
  datesWithOccupancy?: ReadonlySet<string>;
  /** Date whose occupancy accordion is currently open (carousel focus). */
  activeDate?: string | null;
  onSelectDate: (iso: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onClear: () => void;
};

export default function SelectedDatesList({
  selectedDates,
  datesWithOccupancy,
  activeDate = null,
  onSelectDate,
  onPrev,
  onNext,
  onClear,
}: SelectedDatesListProps) {
  const transition = useMotionTransition(0.2);
  const showArrows = Boolean(onPrev || onNext);

  if (selectedDates.length === 0) return null;

  return (
    <div className="border-t border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Seleccionadas
        </p>
        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer text-xs font-medium text-zinc-500 transition-colors hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
        >
          Limpiar
        </button>
      </div>
      <div className="mb-2.5 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--admin-accent)]"
            aria-hidden
          />
          Vista actual
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full border border-[var(--admin-accent)]/40 bg-[var(--admin-accent)]/15"
            aria-hidden
          />
          Con ocupación (navegar)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800"
            aria-hidden
          />
          Sin ocupación
        </span>
      </div>
      <div className="flex items-center gap-2">
        {showArrows ? (
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            aria-label="Fecha anterior con ocupación"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-200/80 bg-white text-zinc-600 transition-colors hover:border-[var(--admin-accent)]/40 hover:text-[var(--admin-accent)] disabled:pointer-events-none disabled:opacity-30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {selectedDates.map((iso) => {
              const hasOccupancy = datesWithOccupancy?.has(iso) ?? false;
              const isActive = activeDate === iso;
              return (
                <motion.button
                  key={iso}
                  type="button"
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={transition}
                  disabled={!hasOccupancy}
                  onClick={() => {
                    if (!hasOccupancy) return;
                    onSelectDate(iso);
                  }}
                  aria-pressed={isActive}
                  title={
                    hasOccupancy
                      ? "Ver ocupaciones de esta fecha"
                      : "Sin ocupaciones este día"
                  }
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    !hasOccupancy
                      ? "cursor-default border-zinc-200/80 bg-zinc-100/80 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-500"
                      : isActive
                        ? "cursor-pointer border-[var(--admin-accent)] bg-[var(--admin-accent)] text-white shadow-sm shadow-[var(--admin-accent)]/25"
                        : "cursor-pointer border-[var(--admin-accent)]/25 bg-[var(--admin-accent)]/8 text-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/15",
                  ].join(" ")}
                >
                  {formatIsoDateLabel(iso, "short")}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
        {showArrows ? (
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            aria-label="Siguiente fecha con ocupación"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-200/80 bg-white text-zinc-600 transition-colors hover:border-[var(--admin-accent)]/40 hover:text-[var(--admin-accent)] disabled:pointer-events-none disabled:opacity-30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
