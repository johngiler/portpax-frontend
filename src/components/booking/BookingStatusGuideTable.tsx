"use client";

import { ChevronDown } from "lucide-react";
import {
  BOOKING_STATUS_FILTER_GUIDE,
  BOOKING_STATUS_GUIDE,
} from "@/types/booking";

type BookingStatusGuideToggleProps = {
  open?: boolean;
  onToggle: () => void;
  /** When true, shows chevron for accordion; when false, plain link (opens modal). */
  accordion?: boolean;
  label?: string;
};

export function BookingStatusGuideToggle({
  open = false,
  onToggle,
  accordion = true,
  label,
}: BookingStatusGuideToggleProps) {
  const text =
    label ??
    (accordion
      ? open
        ? "Ocultar estados"
        : "Ver tabla de estados"
      : "Ver tabla de estados");

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={accordion ? open : undefined}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium text-[var(--admin-accent)] transition-colors hover:underline"
    >
      {text}
      {accordion ? (
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      ) : null}
    </button>
  );
}

type BookingStatusGuideTableProps = {
  /** Include list-only filter buckets (Requieren acción, Completadas). */
  includeFilterExtras?: boolean;
  className?: string;
};

export default function BookingStatusGuideTable({
  includeFilterExtras = false,
  className = "",
}: BookingStatusGuideTableProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/60 dark:bg-zinc-900/50 ${className}`}
    >
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-[var(--admin-border)] bg-white/70 dark:bg-zinc-900/80">
            <th className="whitespace-nowrap px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
              Código
            </th>
            <th className="whitespace-nowrap px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
              Estado
            </th>
            <th className="px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
              Significado
            </th>
          </tr>
        </thead>
        <tbody>
          {BOOKING_STATUS_GUIDE.map((row) => (
            <tr
              key={row.value}
              className="border-b border-[var(--admin-border)]/70 last:border-0"
            >
              <td className="whitespace-nowrap px-3 py-2 align-top font-semibold text-[var(--admin-accent)]">
                {row.code}
              </td>
              <td className="whitespace-nowrap px-3 py-2 align-top font-medium text-zinc-800 dark:text-zinc-100">
                {row.label}
              </td>
              <td className="px-3 py-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
                {row.description}
              </td>
            </tr>
          ))}
          {includeFilterExtras
            ? BOOKING_STATUS_FILTER_GUIDE.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-[var(--admin-border)]/70 last:border-0"
                >
                  <td className="whitespace-nowrap px-3 py-2 align-top text-zinc-400">
                    {row.code}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-top font-medium text-zinc-800 dark:text-zinc-100">
                    {row.label}
                  </td>
                  <td className="px-3 py-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {row.description}
                  </td>
                </tr>
              ))
            : null}
        </tbody>
      </table>
      <p className="border-t border-[var(--admin-border)]/70 px-3 py-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        Pista general (sin LTA): NR → H → CO → R. Pista LTA: NR → LTA → CL → R. En ambos
        casos puede cancelarse (C). LTD es variante LTA del histórico.
      </p>
    </div>
  );
}
