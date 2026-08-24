"use client";

import { ChevronDown } from "lucide-react";
import { LTA_BOOKING_POLICY_GUIDE } from "@/types/lta";

type LtaBookingPolicyGuideToggleProps = {
  open?: boolean;
  onToggle: () => void;
  label?: string;
};

export function LtaBookingPolicyGuideToggle({
  open = false,
  onToggle,
  label,
}: LtaBookingPolicyGuideToggleProps) {
  const text =
    label ?? (open ? "Ocultar políticas" : "Ver guía de políticas");

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium text-[var(--admin-accent)] transition-colors hover:underline"
    >
      {text}
      <ChevronDown
        className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        aria-hidden
      />
    </button>
  );
}

type LtaBookingPolicyGuideTableProps = {
  className?: string;
};

export default function LtaBookingPolicyGuideTable({
  className = "",
}: LtaBookingPolicyGuideTableProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/60 dark:bg-zinc-900/50 ${className}`}
    >
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-[var(--admin-border)] bg-white/70 dark:bg-zinc-900/80">
            <th className="whitespace-nowrap px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
              Política
            </th>
            <th className="px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
              Cómo aplica en zona LTA
            </th>
          </tr>
        </thead>
        <tbody>
          {LTA_BOOKING_POLICY_GUIDE.map((row) => (
            <tr
              key={row.value}
              className="border-b border-[var(--admin-border)]/70 last:border-0"
            >
              <td className="whitespace-nowrap px-3 py-2 align-top font-semibold text-[var(--admin-accent)]">
                {row.label}
              </td>
              <td className="px-3 py-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-[var(--admin-border)]/70 px-3 py-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        El período actual y open booking (bloques B0–B3) siguen abiertos al
        mercado. La política solo restringe cómo se usan los bloques de zona
        LTA según la profundidad elegida en el mapa.
      </p>
    </div>
  );
}
