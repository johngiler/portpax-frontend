"use client";

import { AnimatePresence, motion } from "motion/react";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { useMotionTransition } from "@/lib/motionPresets";

type SelectedDatesListProps = {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
};

export default function SelectedDatesList({ selectedDates, onChange }: SelectedDatesListProps) {
  const transition = useMotionTransition(0.2);

  if (selectedDates.length === 0) return null;

  return (
    <div className="border-t border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Seleccionadas
        </p>
        <button
          type="button"
          onClick={() => onChange([])}
          className="cursor-pointer text-xs font-medium text-zinc-500 transition-colors hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
        >
          Limpiar
        </button>
      </div>
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
              onClick={() => onChange(selectedDates.filter((date) => date !== iso))}
              className="cursor-pointer rounded-full border border-[var(--admin-accent)]/25 bg-[var(--admin-accent)]/8 px-3 py-1 text-xs font-medium text-[var(--admin-accent)] transition-colors hover:bg-[var(--admin-accent)]/15"
            >
              {formatIsoDateLabel(iso, "short")}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
