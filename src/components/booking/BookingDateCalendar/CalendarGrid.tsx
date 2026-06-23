"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { CalendarCell } from "@/lib/bookingDates";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { useMotionTransition } from "@/lib/motionPresets";
import type { CalendarDayBooking } from "./types";

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type CalendarGridProps = {
  weeks: CalendarCell[][];
  viewYear: number;
  viewMonth: number;
  direction: number;
  todayIso: string;
  minIso: string;
  selectedSet: Set<string>;
  blockedSet: Set<string>;
  occupancyByDate: Record<string, CalendarDayBooking[]>;
  expandedDate: string | null;
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
  blockedSet,
  occupancyByDate,
  expandedDate,
  onDayClick,
}: CalendarGridProps) {
  const transition = useMotionTransition(0.2);

  return (
    <>
      <div className="grid grid-cols-7 gap-2 px-5 pb-2 text-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="relative min-h-[22rem] px-5 pb-4">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={`${viewYear}-${viewMonth}`}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -24 : 24 }}
            transition={transition}
            className="grid grid-cols-7 gap-2"
          >
            {weeks.flat().map((cell) => {
              const dayBookings = occupancyByDate[cell.iso] ?? [];
              const occupancyCount = dayBookings.length;
              const isSelected = selectedSet.has(cell.iso);
              const isBlocked = blockedSet.has(cell.iso) && !isSelected;
              const isToday = cell.iso === todayIso;
              const isPast = cell.iso < minIso;
              const isExpanded = expandedDate === cell.iso && occupancyCount > 0;
              const isAvailableSelected =
                isSelected && !isBlocked && occupancyCount === 0 && !isPast;
              const hasPortBookings = dayBookings.some(
                (booking) => booking.isCurrentPort && !booking.blocksSelection,
              );
              const hasVesselElsewhere = dayBookings.some((booking) => !booking.isCurrentPort);
              const occupancyLabel = dayBookings
                .map(
                  (booking) =>
                    `${booking.vessel_name} · ${booking.shipping_line_name} · ${booking.port_name}`,
                )
                .join("; ");

              return (
                <motion.button
                  key={cell.iso}
                  type="button"
                  disabled={isPast}
                  onClick={() => onDayClick(cell)}
                  whileTap={isPast ? undefined : { scale: 0.97 }}
                  className={[
                    "group relative flex min-h-[4.75rem] cursor-pointer flex-col items-center justify-between rounded-2xl border px-1 pb-1.5 pt-2 text-left transition-all duration-200",
                    !cell.isCurrentMonth && !isSelected && !isPast ? "opacity-35" : "",
                    isPast
                      ? "cursor-not-allowed border-zinc-100/60 bg-zinc-50/40 opacity-55 dark:border-zinc-800/40 dark:bg-zinc-900/15"
                      : isSelected
                        ? "border-[var(--admin-accent)] bg-[var(--admin-accent)] text-white shadow-lg shadow-[var(--admin-accent)]/25"
                        : isExpanded
                          ? "border-[var(--admin-accent)]/60 bg-white shadow-md ring-2 ring-[var(--admin-accent)]/15 dark:bg-zinc-900"
                          : isBlocked
                            ? "border-amber-200/80 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/25"
                            : occupancyCount > 0
                              ? "border-zinc-200/90 bg-white/90 hover:border-[var(--admin-accent)]/35 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70"
                              : "border-zinc-200/70 bg-white/60 hover:border-[var(--admin-accent)]/30 hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-900",
                    isToday && !isSelected && !isExpanded && !isPast
                      ? "ring-1 ring-[var(--admin-accent)]/25"
                      : "",
                  ].join(" ")}
                  aria-label={
                    occupancyCount > 0
                      ? `${formatIsoDateLabel(cell.iso)} — ${occupancyLabel}`
                      : isAvailableSelected
                        ? `${formatIsoDateLabel(cell.iso)} — disponible para reservar`
                        : formatIsoDateLabel(cell.iso)
                  }
                  aria-expanded={isExpanded}
                  aria-pressed={isSelected}
                >
                  <span
                    className={[
                      "w-full text-center text-base font-semibold leading-none",
                      isPast
                        ? "text-zinc-300 dark:text-zinc-600"
                        : isBlocked && !isSelected
                          ? "text-amber-800 line-through dark:text-amber-300"
                          : isSelected
                            ? "text-white"
                            : "text-zinc-800 dark:text-zinc-100",
                    ].join(" ")}
                  >
                    {cell.day}
                  </span>

                  <span className="flex min-h-[1.35rem] w-full flex-col items-center justify-center gap-0.5">
                    {isAvailableSelected ? (
                      <>
                        <span className="h-0.5 w-5 rounded-full bg-white/35" aria-hidden />
                        <span className="text-[7px] font-bold uppercase leading-none tracking-[0.14em] text-white/95">
                          Disponible
                        </span>
                      </>
                    ) : occupancyCount > 0 && !isSelected ? (
                      <span className="flex items-center justify-center gap-0.5">
                        {hasPortBookings ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        ) : null}
                        {hasVesselElsewhere ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                        ) : null}
                        {isBlocked ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-700" />
                        ) : null}
                        {occupancyCount > 1 ? (
                          <span className="text-[9px] font-bold text-zinc-500">
                            +{occupancyCount - 1}
                          </span>
                        ) : null}
                      </span>
                    ) : isExpanded ? (
                      <ChevronDown
                        className={[
                          "h-3.5 w-3.5",
                          isSelected ? "text-white/90" : "text-[var(--admin-accent)]",
                        ].join(" ")}
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
