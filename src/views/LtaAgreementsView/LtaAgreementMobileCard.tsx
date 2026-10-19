"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import TableActionButtons from "@/components/tables/TableActionButtons";
import { formatCompactCount } from "@/lib/formatCompactCount";
import {
  LTA_WEEKDAY_OPTIONS,
  type LongTermAgreement,
} from "@/types/lta";

const WEEKDAY_SHORT: Record<number, string> = Object.fromEntries(
  LTA_WEEKDAY_OPTIONS.map((o) => [o.value, o.label.slice(0, 3)]),
);

function cadenceLabel(row: LongTermAgreement): string {
  if (row.interval_days != null && row.cadence_anchor) {
    return `Cada ${row.interval_days} d`;
  }
  return `${row.advance_months_min}–${row.advance_months_max} m`;
}

function weekdaysShort(weekdays: number[]): string {
  if (!weekdays.length) return "Todos";
  return weekdays
    .map((d) => WEEKDAY_SHORT[d] ?? String(d))
    .join(", ");
}

type LtaAgreementMobileCardProps = {
  agreement: LongTermAgreement;
  expanded: boolean;
  canWrite: boolean;
  detail: ReactNode;
  onToggleExpand: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function LtaAgreementMobileCard({
  agreement,
  expanded,
  canWrite,
  detail,
  onToggleExpand,
  onEdit,
  onDelete,
}: LtaAgreementMobileCardProps) {
  const linked = agreement.linked_bookings_count ?? 0;
  const metaParts = [
    agreement.port_name,
    agreement.shipping_line_group_name,
  ].filter(Boolean);
  const scheduleParts = [
    weekdaysShort(agreement.weekdays),
    agreement.position_codes.length
      ? agreement.position_codes.join(", ")
      : null,
    cadenceLabel(agreement),
  ].filter(Boolean);

  return (
    <li>
      <article
        className={[
          "min-w-0 max-w-full overflow-hidden rounded-2xl border bg-white shadow-[var(--admin-card-shadow)] transition-colors dark:bg-zinc-900/80",
          expanded
            ? "border-[var(--admin-accent)]/35"
            : "border-zinc-200/80 dark:border-zinc-800",
        ].join(" ")}
      >
        <div className="flex items-start gap-2 p-3">
          <button
            type="button"
            onClick={onToggleExpand}
            className="min-w-0 flex-1 cursor-pointer text-left"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 truncate text-[15px] font-semibold text-[var(--admin-accent)]">
                {agreement.code}
              </span>
              <span
                className={[
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  agreement.is_active
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                ].join(" ")}
              >
                {agreement.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
              {agreement.name}
            </p>
            {metaParts.length ? (
              <p className="mt-2 truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">
                {metaParts.join(" · ")}
              </p>
            ) : null}
            {scheduleParts.length ? (
              <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                {scheduleParts.join(" · ")}
              </p>
            ) : null}
            <div className="mt-2 flex items-center justify-between gap-2">
              <span
                className={
                  linked > 0
                    ? "text-xs font-medium tabular-nums text-zinc-800 dark:text-zinc-100"
                    : "text-xs tabular-nums text-zinc-400"
                }
              >
                {formatCompactCount(linked)}{" "}
                {linked === 1 ? "reserva" : "reservas"}
              </span>
              <ChevronDown
                className={[
                  "h-4 w-4 shrink-0 text-zinc-300 transition-transform",
                  expanded ? "rotate-180 text-[var(--admin-accent)]" : "",
                ].join(" ")}
                strokeWidth={2}
                aria-hidden
              />
            </div>
          </button>

          <div className="shrink-0 pt-0.5">
            <TableActionButtons
              onView={onToggleExpand}
              viewActive={expanded}
              onEdit={canWrite ? onEdit : undefined}
              onDelete={canWrite ? onDelete : undefined}
              deleteLabel={`el acuerdo ${agreement.code}`}
            />
          </div>
        </div>

        {expanded ? (
          <div className="min-w-0 max-w-full overflow-x-hidden border-t border-zinc-100 px-2 py-3 dark:border-zinc-800 sm:px-3">
            {detail}
          </div>
        ) : null}
      </article>
    </li>
  );
}
