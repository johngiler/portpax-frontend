"use client";

import { AnimatePresence, motion } from "motion/react";
import type { CalendarCell } from "@/lib/bookingDates";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { useMotionTransition } from "@/lib/motionPresets";

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type CalendarGridProps = {
  weeks: CalendarCell[][];
  viewYear: number;
  viewMonth: number;
  direction: number;
  todayIso: string;
  minIso: string;
  selectedSet: Set<string>;
  onDayClick: (cell: CalendarCell) => void;
};

export default function CalendarGrid({
  weeks,
  viewYear,
  viewMonth,
  direction,
  todayIso,
  minIso,
  selectedSet,
  onDayClick,
}: CalendarGridProps) {
  const transition = useMotionTransition(0.2);

  return (
    <>
      <div className="grid grid-cols-7 gap-1 px-3 pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="relative min-h-[252px] px-3 pb-4">
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
            {weeks.flat().map((cell) => {
              const isSelected = selectedSet.has(cell.iso);
              const isToday = cell.iso === todayIso;
              const isDisabled = cell.iso < minIso;

              return (
                <motion.button
                  key={cell.iso}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onDayClick(cell)}
                  whileTap={isDisabled ? undefined : { scale: 0.92 }}
                  className={[
                    "relative flex h-10 cursor-pointer items-center justify-center rounded-xl text-sm font-medium transition-colors",
                    !cell.isCurrentMonth && !isSelected ? "opacity-45" : "",
                    isDisabled
                      ? "cursor-not-allowed text-zinc-300 dark:text-zinc-600"
                      : isSelected
                        ? "text-white shadow-md shadow-[var(--admin-accent)]/25"
                        : "text-zinc-700 hover:bg-[var(--admin-accent)]/10 hover:text-[var(--admin-accent)] dark:text-zinc-200 dark:hover:bg-[var(--admin-accent)]/15",
                    isToday && !isSelected
                      ? "ring-2 ring-[var(--admin-accent)]/30 ring-inset"
                      : "",
                  ].join(" ")}
                  aria-label={formatIsoDateLabel(cell.iso)}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <motion.span
                      layoutId={`booking-day-${cell.iso}`}
                      className="absolute inset-0 rounded-xl bg-[var(--admin-accent)]"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{cell.day}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
