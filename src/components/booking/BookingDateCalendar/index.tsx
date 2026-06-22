"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  formatIsoDateLabel,
  getMonthMatrix,
  toIsoDate,
} from "@/lib/bookingDates";
import { useMotionTransition } from "@/lib/motionPresets";

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type BookingDateCalendarProps = {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  minDate?: string;
};

function todayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function BookingDateCalendar({
  selectedDates,
  onChange,
  minDate,
}: BookingDateCalendarProps) {
  const today = todayIso();
  const min = minDate ?? today;
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [direction, setDirection] = useState(0);
  const transition = useMotionTransition(0.2);

  const monthLabel = useMemo(
    () =>
      new Date(viewYear, viewMonth, 1).toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
      }),
    [viewYear, viewMonth],
  );

  const weeks = useMemo(
    () => getMonthMatrix(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);

  function shiftMonth(delta: number) {
    setDirection(delta);
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function toggleDate(day: number) {
    const iso = toIsoDate(viewYear, viewMonth, day);
    if (iso < min) return;

    if (selectedSet.has(iso)) {
      onChange(selectedDates.filter((d) => d !== iso));
    } else {
      onChange([...selectedDates, iso].sort());
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white via-[var(--admin-accent)]/[0.04] to-zinc-50 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--admin-accent)]">
            Calendario
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Toca varios días para un paquete de reservas
          </p>
        </div>
        <span className="rounded-full bg-[var(--admin-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--admin-accent)]">
          {selectedDates.length} fecha{selectedDates.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-600 transition-colors hover:border-[var(--admin-accent)]/40 hover:text-[var(--admin-accent)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-base font-semibold capitalize text-zinc-900 dark:text-zinc-50">
          {monthLabel}
        </h3>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-600 transition-colors hover:border-[var(--admin-accent)]/40 hover:text-[var(--admin-accent)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-3 pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="relative min-h-[220px] px-3 pb-4">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={`${viewYear}-${viewMonth}`}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -24 : 24 }}
            transition={transition}
            className="grid grid-cols-7 gap-1.5"
          >
            {weeks.flat().map((day, index) => {
              if (day === null) {
                return <span key={`empty-${index}`} className="h-10" aria-hidden />;
              }

              const iso = toIsoDate(viewYear, viewMonth, day);
              const isSelected = selectedSet.has(iso);
              const isToday = iso === today;
              const isDisabled = iso < min;

              return (
                <motion.button
                  key={iso}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => toggleDate(day)}
                  whileTap={isDisabled ? undefined : { scale: 0.92 }}
                  className={[
                    "relative flex h-10 cursor-pointer items-center justify-center rounded-xl text-sm font-medium transition-colors",
                    isDisabled
                      ? "cursor-not-allowed text-zinc-300 dark:text-zinc-600"
                      : isSelected
                        ? "bg-[var(--admin-accent)] text-white shadow-md shadow-[var(--admin-accent)]/25"
                        : "text-zinc-700 hover:bg-[var(--admin-accent)]/10 hover:text-[var(--admin-accent)] dark:text-zinc-200 dark:hover:bg-[var(--admin-accent)]/15",
                    isToday && !isSelected ? "ring-2 ring-[var(--admin-accent)]/30 ring-inset" : "",
                  ].join(" ")}
                  aria-label={formatIsoDateLabel(iso)}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <motion.span
                      layoutId={`booking-day-${iso}`}
                      className="absolute inset-0 rounded-xl bg-[var(--admin-accent)]"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{day}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {selectedDates.length > 0 && (
        <div className="border-t border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Seleccionadas
          </p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {selectedDates.map((iso) => (
                <motion.button
                  key={iso}
                  type="button"
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={transition}
                  onClick={() => onChange(selectedDates.filter((d) => d !== iso))}
                  className="cursor-pointer rounded-full border border-[var(--admin-accent)]/25 bg-[var(--admin-accent)]/8 px-3 py-1 text-xs font-medium text-[var(--admin-accent)] transition-colors hover:bg-[var(--admin-accent)]/15"
                >
                  {formatIsoDateLabel(iso, "short")}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
