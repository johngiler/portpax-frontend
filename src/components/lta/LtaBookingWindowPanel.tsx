"use client";

import { useMemo } from "react";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import {
  agreementBookableBlockIndices,
  blockOverlapsAgreement,
  buildSeasonalWindowsSnapshot,
  firstLtaBlockIndex,
  type BookingWindowZone,
  type SeasonBlock,
  ZONE_LABEL,
} from "@/lib/ltaWindows";
import type { LtaBookingPolicy } from "@/types/lta";

type LtaBookingWindowPanelProps = {
  validFrom: string | null;
  validUntil: string | null;
  bookingPolicy: LtaBookingPolicy;
  ltaDepthBlocks: number;
  /** When set, LTA-zone blocks are clickable and set depth (1…N from the first LTA block). */
  onDepthChange?: (depth: number) => void;
  compact?: boolean;
};

const ZONE_STRIPE: Record<BookingWindowZone, string> = {
  current: "border-t-amber-400 bg-amber-50/50 dark:border-t-amber-500 dark:bg-amber-950/25",
  general: "border-t-emerald-400 bg-emerald-50/40 dark:border-t-emerald-500 dark:bg-emerald-950/20",
  lta_covered: "border-t-sky-400 bg-sky-50/40 dark:border-t-sky-500 dark:bg-sky-950/20",
  beyond: "border-t-zinc-300 bg-zinc-50/60 dark:border-t-zinc-600 dark:bg-zinc-900/40",
};

/** Current-period block whose end date is already past (e.g. previous season). */
const CURRENT_ELAPSED_STRIPE =
  "border-t-amber-200/70 bg-amber-50/25 text-zinc-500 opacity-55 dark:border-t-amber-800/50 dark:bg-amber-950/15 dark:opacity-50";

const ZONE_DOT: Record<BookingWindowZone, string> = {
  current: "bg-amber-400",
  general: "bg-emerald-400",
  lta_covered: "bg-sky-400",
  beyond: "bg-zinc-400",
};

function formatBlockRange(block: SeasonBlock): string {
  return `${formatIsoDateLabel(block.date_from, "short")} – ${formatIsoDateLabel(block.date_to, "short")}`;
}

function isElapsedCurrentBlock(block: SeasonBlock, referenceDate: string): boolean {
  return block.zone === "current" && block.date_to < referenceDate;
}

export default function LtaBookingWindowPanel({
  validFrom,
  validUntil,
  bookingPolicy,
  ltaDepthBlocks,
  onDepthChange,
  compact = false,
}: LtaBookingWindowPanelProps) {
  const selectable = typeof onDepthChange === "function";
  const snapshot = useMemo(() => buildSeasonalWindowsSnapshot(), []);
  const bookable = useMemo(
    () =>
      agreementBookableBlockIndices(
        bookingPolicy,
        ltaDepthBlocks,
        validFrom,
        snapshot.reference_date,
      ),
    [bookingPolicy, ltaDepthBlocks, validFrom, snapshot.reference_date],
  );

  const ltaBlocks = useMemo(
    () => snapshot.blocks.filter((b) => b.zone === "lta_covered"),
    [snapshot.blocks],
  );

  const zonesShown: BookingWindowZone[] = ["current", "general", "lta_covered"];

  function handleSelectLtaBlock(block: SeasonBlock) {
    if (!onDepthChange || block.zone !== "lta_covered") return;
    const firstLta = firstLtaBlockIndex();
    const slot = block.index - firstLta + 1;
    if (slot < 1) return;
    onDepthChange(Math.min(ltaBlocks.length, Math.max(1, slot)));
  }

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600 dark:text-zinc-400">
        {zonesShown.map((zone) => (
          <li key={zone} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${ZONE_DOT[zone]}`} aria-hidden />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {ZONE_LABEL[zone]}
            </span>
          </li>
        ))}
        <li className="text-zinc-400 dark:text-zinc-500">
          Ref. {formatIsoDateLabel(snapshot.reference_date, "short")}
        </li>
      </ul>

      {selectable ? (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Clic en un bloque de zona LTA para definir hasta dónde llega el acuerdo
          (desde el primero de la zona hasta el elegido). Período actual y open booking
          son del mercado global — no se seleccionan aquí.
        </p>
      ) : null}

      <div
        className={
          compact
            ? "flex gap-2 overflow-x-auto pb-1"
            : "grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-9"
        }
      >
        {snapshot.blocks.map((block) => {
          const inVigencia = blockOverlapsAgreement(block, validFrom, validUntil);
          const reservable = bookable.has(block.index) && inVigencia;
          const muted = validFrom || validUntil ? !inVigencia : false;
          const elapsedCurrent = isElapsedCurrentBlock(
            block,
            snapshot.reference_date,
          );
          const isLtaZone = block.zone === "lta_covered";
          const firstLta = firstLtaBlockIndex();
          const ltaSlot = block.index - firstLta + 1;
          const inSelectedDepth = isLtaZone && ltaSlot >= 1 && ltaSlot <= ltaDepthBlocks;
          const canSelect = selectable && isLtaZone;

          const stripe = elapsedCurrent
            ? CURRENT_ELAPSED_STRIPE
            : ZONE_STRIPE[block.zone];

          const className = `${compact ? "min-w-[7.5rem] shrink-0" : ""} rounded-lg border border-zinc-200/80 border-t-[3px] px-2.5 py-2 transition dark:border-zinc-700 ${stripe} ${
            muted ? "opacity-35" : ""
          } ${inSelectedDepth ? "ring-2 ring-[var(--admin-accent)]/45 ring-offset-1 ring-offset-zinc-50 dark:ring-offset-zinc-950" : ""} ${
            canSelect
              ? "cursor-pointer hover:ring-2 hover:ring-[var(--admin-accent)]/30"
              : selectable
                ? "cursor-default opacity-90"
                : ""
          }`;

          const body = (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {ZONE_LABEL[block.zone]}
                {elapsedCurrent ? " · pasado" : ""}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {block.label}
              </p>
              {!compact ? (
                <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">
                  {formatBlockRange(block)}
                </p>
              ) : null}
              {inSelectedDepth ? (
                <span className="mt-1.5 inline-block rounded bg-[var(--admin-accent)]/10 px-1.5 py-px text-[9px] font-semibold text-[var(--admin-accent)]">
                  {selectable
                    ? reservable || !validFrom
                      ? "Seleccionado"
                      : "Fuera de vigencia"
                    : reservable
                      ? "Reservable LTA"
                      : "En profundidad"}
                </span>
              ) : null}
            </>
          );

          if (canSelect) {
            return (
              <button
                key={block.index}
                type="button"
                onClick={() => handleSelectLtaBlock(block)}
                className={`${className} text-left`}
                title={`Cubrir hasta ${block.label} (${ltaSlot} bloque${ltaSlot === 1 ? "" : "s"} LTA)`}
              >
                {body}
              </button>
            );
          }

          return (
            <article
              key={block.index}
              className={className}
              title={
                selectable && !isLtaZone
                  ? "No seleccionable — ventana de mercado global"
                  : formatBlockRange(block)
              }
            >
              {body}
            </article>
          );
        })}
      </div>
    </div>
  );
}
