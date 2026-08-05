"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { useMotionTransition } from "@/lib/motionPresets";
import type { Booking } from "@/types/booking";
import CalendarOccupancyCard from "./CalendarOccupancyCard";
import CalendarOccupancyLegend from "./CalendarOccupancyLegend";
import type { CalendarDayBooking } from "./types";

type CalendarDayAccordionProps = {
  dateIso: string | null;
  bookings: CalendarDayBooking[];
  /** 1 = next (slide from right), -1 = prev (slide from left). */
  carouselDirection?: number;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
  canReassign?: boolean;
  onBookingReassigned?: (updated: Booking) => void;
  onReassignSavingChange?: (bookingId: number, saving: boolean) => void;
};

export default function CalendarDayAccordion({
  dateIso,
  bookings,
  carouselDirection = 1,
  canGoPrev = false,
  canGoNext = false,
  onPrev,
  onNext,
  onClose,
  canReassign = false,
  onBookingReassigned,
  onReassignSavingChange,
}: CalendarDayAccordionProps) {
  const shellTransition = useMotionTransition(0.22);
  const slideTransition = useMotionTransition(0.28);
  const showArrows = Boolean(onPrev || onNext) && (canGoPrev || canGoNext);

  return (
    <AnimatePresence initial={false}>
      {dateIso ? (
        <motion.div
          key="occupancy-carousel-shell"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={shellTransition}
          className="overflow-hidden border-t border-zinc-200/80 dark:border-zinc-800"
        >
          <div className="relative bg-gradient-to-b from-zinc-50/90 to-white px-5 py-4 dark:from-zinc-950/60 dark:to-zinc-900/40">
            {showArrows ? (
              <>
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={!canGoPrev}
                  aria-label="Fecha anterior con ocupación"
                  className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-zinc-200/80 bg-white/95 text-zinc-600 shadow-sm transition-colors hover:border-[var(--admin-accent)]/40 hover:text-[var(--admin-accent)] disabled:pointer-events-none disabled:opacity-30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 sm:left-3"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!canGoNext}
                  aria-label="Siguiente fecha con ocupación"
                  className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-zinc-200/80 bg-white/95 text-zinc-600 shadow-sm transition-colors hover:border-[var(--admin-accent)]/40 hover:text-[var(--admin-accent)] disabled:pointer-events-none disabled:opacity-30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 sm:right-3"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2} />
                </button>
              </>
            ) : null}

            <div className={showArrows ? "px-8 sm:px-10" : ""}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
                    <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0 overflow-hidden">
                    <AnimatePresence mode="wait" initial={false} custom={carouselDirection}>
                      <motion.div
                        key={`head-${dateIso}`}
                        custom={carouselDirection}
                        initial={{
                          opacity: 0,
                          x: carouselDirection >= 0 ? 28 : -28,
                        }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{
                          opacity: 0,
                          x: carouselDirection >= 0 ? -28 : 28,
                        }}
                        transition={slideTransition}
                      >
                        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--admin-accent)]">
                          Escalas del día
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          {formatIsoDateLabel(dateIso, "long")}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {bookings.length === 0
                            ? "Sin reservas — día libre en el puerto"
                            : `${bookings.length} escala${bookings.length === 1 ? "" : "s"} registrada${bookings.length === 1 ? "" : "s"}`}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-pointer rounded-lg border border-zinc-200/80 bg-white p-1.5 text-zinc-400 transition-colors hover:border-zinc-300 hover:text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:text-zinc-200"
                  aria-label="Cerrar detalle del día"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <div className="relative mt-4 overflow-hidden">
                <AnimatePresence mode="wait" initial={false} custom={carouselDirection}>
                  <motion.div
                    key={dateIso}
                    custom={carouselDirection}
                    initial={{
                      opacity: 0,
                      x: carouselDirection >= 0 ? 48 : -48,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{
                      opacity: 0,
                      x: carouselDirection >= 0 ? -48 : 48,
                    }}
                    transition={slideTransition}
                  >
                    {bookings.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {bookings.map((booking) => (
                          <CalendarOccupancyCard
                            key={booking.id}
                            booking={booking}
                            canReassign={canReassign}
                            onReassigned={onBookingReassigned}
                            onSavingChange={onReassignSavingChange}
                          />
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                      <CalendarOccupancyLegend />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
