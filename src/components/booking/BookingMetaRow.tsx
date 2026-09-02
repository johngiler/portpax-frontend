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
  tone = "muted",
  className = "",
  highlightLoa = false,
  loaHighlightSeverity = null,
  highlightSchedule = false,
  scheduleHighlightSeverity = null,
  highlightPosition = false,
  positionHighlightSeverity = null,
}: BookingMetaRowProps) {
  const iconClass = compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5";
  const textClass = compact
    ? "text-[9px] leading-tight sm:text-[10px]"
    : "text-xs";
  const toneClass =
    tone === "onColor"
      ? "text-white/90"
      : "text-zinc-500 dark:text-zinc-400";
  const paxLabel = formatCardPax(actualPax, plannedPax);

  return (
    <ul
      className={[
        "flex flex-wrap items-center gap-x-2.5 gap-y-1",
        toneClass,
        textClass,
        className,
      ].join(" ")}
    >
      <li
        className={[
          "inline-flex min-w-0 items-center gap-1",
          highlightLoa
            ? conflictFieldHighlightClassName(loaHighlightSeverity ?? "yellow")
            : "",
        ].join(" ")}
      >
        <Ruler className={`shrink-0 opacity-80 ${iconClass}`} aria-hidden />
        <span className="truncate font-medium">{formatLoa(loaM)}</span>
      </li>
      <li
        className={[
          "inline-flex min-w-0 items-center gap-1",
          highlightSchedule
            ? conflictFieldHighlightClassName(
                scheduleHighlightSeverity ?? "yellow",
              )
            : "",
        ].join(" ")}
      >
        <Clock3 className={`shrink-0 opacity-80 ${iconClass}`} aria-hidden />
        <span className="truncate font-medium">
          {formatTimeShort(eta)}–{formatTimeShort(etd)}
        </span>
      </li>
      <li
        className="inline-flex min-w-0 items-center gap-1"
        title={cardPaxTitle(actualPax, plannedPax)}
      >
        <Users className={`shrink-0 opacity-80 ${iconClass}`} aria-hidden />
        <span className="truncate font-medium">{paxLabel}</span>
      </li>
      <li
        className={[
          "inline-flex min-w-0 items-center gap-1",
          highlightPosition
            ? conflictFieldHighlightClassName(
                positionHighlightSeverity ?? "yellow",
              )
            : "",
        ].join(" ")}
      >
        <MapPinned className={`shrink-0 opacity-80 ${iconClass}`} aria-hidden />
        <span className="truncate font-medium">{positionLabel}</span>
      </li>
    </ul>
  );
}
