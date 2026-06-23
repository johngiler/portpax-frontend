"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, X } from "lucide-react";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { useMotionTransition } from "@/lib/motionPresets";
import CalendarOccupancyCard from "./CalendarOccupancyCard";
import CalendarOccupancyLegend from "./CalendarOccupancyLegend";
import type { CalendarDayBooking } from "./types";

type CalendarDayAccordionProps = {
  dateIso: string | null;
  bookings: CalendarDayBooking[];
  onClose: () => void;
};

export default function CalendarDayAccordion({
  dateIso,
  bookings,
  onClose,
}: CalendarDayAccordionProps) {
  const transition = useMotionTransition(0.22);

  return (
    <AnimatePresence initial={false}>
      {dateIso ? (
        <motion.div
          key={dateIso}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={transition}
          className="overflow-hidden border-t border-zinc-200/80 dark:border-zinc-800"
        >
          <div className="bg-gradient-to-b from-zinc-50/90 to-white px-5 py-4 dark:from-zinc-950/60 dark:to-zinc-900/40">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
                  <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <div>
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

            {bookings.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {bookings.map((booking) => (
                  <CalendarOccupancyCard key={booking.booking_code} booking={booking} />
                ))}
              </div>
            ) : null}

            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200/60 dark:border-zinc-800">
              <CalendarOccupancyLegend />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
