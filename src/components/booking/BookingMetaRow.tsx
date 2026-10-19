"use client";

import { Clock3, MapPinned, Ruler, Users } from "lucide-react";
import { formatLoa, formatTimeShort } from "@/lib/bookingDisplay";
import { conflictFieldHighlightClassName } from "@/lib/bookingConflictStyle";
import { cardPaxTitle, formatCardPax } from "@/lib/bookingPaxDisplay";
import type { BookingConflictSeverity } from "@/types/booking";

type BookingMetaRowProps = {
  loaM?: string | null;
  eta?: string | null;
  etd?: string | null;
  /** Disembarked / real PAX when present. */
  actualPax?: number | null;
  /** Fallback when actual is missing (average snapshot). */
  plannedPax?: number | null;
  positionLabel: string;
  /** Dense chips (calendar). */
  compact?: boolean;
  /**
   * `grid` = 2×2 on narrow screens (booking list mobile); `wrap` = default flex wrap.
   */
  layout?: "wrap" | "grid";
  /** `onColor` = light text on corp chip backgrounds. */
  tone?: "muted" | "onColor";
  className?: string;
  /** Highlight LOA when conflict is length-related. */
  highlightLoa?: boolean;
  loaHighlightSeverity?: BookingConflictSeverity | null;
  /** Highlight ETA–ETD when conflict is schedule-related. */
  highlightSchedule?: boolean;
  scheduleHighlightSeverity?: BookingConflictSeverity | null;
  /** Highlight position when conflict is berth/slot-related. */
  highlightPosition?: boolean;
  positionHighlightSeverity?: BookingConflictSeverity | null;
};

/**
 * LOA · ETA–ETD · PAX · position with icons (list cards + calendar chips).
 */
export default function BookingMetaRow({
  loaM,
  eta,
  etd,
  actualPax = null,
  plannedPax = null,
  positionLabel,
  compact = false,
  layout = "wrap",
  tone = "muted",
  className = "",
  highlightLoa = false,
  loaHighlightSeverity = null,
  highlightSchedule = false,
  scheduleHighlightSeverity = null,
  highlightPosition = false,
  positionHighlightSeverity = null,
}: BookingMetaRowProps) {
  const isGrid = layout === "grid";
  const iconClass = compact
    ? "h-2.5 w-2.5"
    : isGrid
      ? "h-3.5 w-3.5 sm:h-3.5 sm:w-3.5"
      : "h-3.5 w-3.5";
  const textClass = compact
    ? "text-[9px] leading-tight sm:text-[10px]"
    : isGrid
      ? "text-[11px] leading-tight sm:text-xs"
      : "text-xs";
  const toneClass =
    tone === "onColor"
      ? "text-white/90"
      : "text-zinc-500 dark:text-zinc-400";
  const paxLabel = formatCardPax(actualPax, plannedPax);
  const etaLabel = formatTimeShort(eta);
  const etdLabel = formatTimeShort(etd);

  const layoutClass = isGrid
    ? [
        "grid w-full grid-cols-4 gap-1 rounded-xl bg-zinc-50 px-1.5 py-2",
        "dark:bg-zinc-950/50",
        "sm:flex sm:w-auto sm:flex-wrap sm:gap-x-2.5 sm:gap-y-1 sm:rounded-none sm:bg-transparent sm:p-0 sm:dark:bg-transparent",
      ].join(" ")
    : "flex flex-wrap items-center gap-x-2.5 gap-y-1";

  const itemBase = isGrid
    ? "inline-flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-center sm:flex-row sm:gap-1 sm:text-left"
    : "inline-flex min-w-0 items-center gap-1";

  return (
    <ul
      className={[layoutClass, toneClass, textClass, className].join(" ")}
    >
      <li
        className={[
          itemBase,
          highlightLoa
            ? conflictFieldHighlightClassName(loaHighlightSeverity ?? "yellow")
            : "",
        ].join(" ")}
      >
        <Ruler className={`shrink-0 opacity-80 ${iconClass}`} aria-hidden />
        <span className="truncate font-medium tabular-nums">
          {formatLoa(loaM)}
        </span>
      </li>
      <li
        className={[
          itemBase,
          highlightSchedule
            ? conflictFieldHighlightClassName(
                scheduleHighlightSeverity ?? "yellow",
              )
            : "",
        ].join(" ")}
        title={`${etaLabel}–${etdLabel}`}
      >
        <Clock3 className={`shrink-0 opacity-80 ${iconClass}`} aria-hidden />
        <span className="font-medium tabular-nums sm:hidden">
          <span className="block leading-tight">{etaLabel}</span>
          <span className="block text-[10px] leading-tight opacity-70">
            {etdLabel}
          </span>
        </span>
        <span className="hidden truncate font-medium tabular-nums sm:inline">
          {etaLabel}–{etdLabel}
        </span>
      </li>
      <li
        className={itemBase}
        title={cardPaxTitle(actualPax, plannedPax)}
      >
        <Users className={`shrink-0 opacity-80 ${iconClass}`} aria-hidden />
        <span className="truncate font-medium tabular-nums">{paxLabel}</span>
      </li>
      <li
        className={[
          itemBase,
          highlightPosition
            ? conflictFieldHighlightClassName(
                positionHighlightSeverity ?? "yellow",
              )
            : "",
        ].join(" ")}
      >
        <MapPinned className={`shrink-0 opacity-80 ${iconClass}`} aria-hidden />
        <span className="truncate font-semibold text-zinc-700 dark:text-zinc-200 sm:font-medium sm:text-inherit">
          {positionLabel}
        </span>
      </li>
    </ul>
  );
}
