"use client";

import { Clock3, MapPinned, Ruler } from "lucide-react";
import { formatLoa, formatTimeShort } from "@/lib/bookingDisplay";

type BookingMetaRowProps = {
  loaM?: string | null;
  eta?: string | null;
  etd?: string | null;
  positionLabel: string;
  /** Dense chips (calendar). */
  compact?: boolean;
  /** `onColor` = light text on corp chip backgrounds. */
  tone?: "muted" | "onColor";
  className?: string;
};

/**
 * LOA · ETA–ETD · position with icons (list cards + calendar chips).
 */
export default function BookingMetaRow({
  loaM,
  eta,
  etd,
  positionLabel,
  compact = false,
  tone = "muted",
  className = "",
}: BookingMetaRowProps) {
  const iconClass = compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5";
  const textClass = compact
    ? "text-[9px] leading-tight sm:text-[10px]"
    : "text-xs";
  const toneClass =
    tone === "onColor"
      ? "text-white/90"
      : "text-zinc-500 dark:text-zinc-400";

  return (
    <ul
      className={[
        "flex flex-wrap items-center gap-x-2.5 gap-y-1",
        toneClass,
        textClass,
        className,
      ].join(" ")}
    >
      <li className="inline-flex min-w-0 items-center gap-1">
        <Ruler className={`shrink-0 opacity-80 ${iconClass}`} aria-hidden />
        <span className="truncate font-medium">{formatLoa(loaM)}</span>
      </li>
      <li className="inline-flex min-w-0 items-center gap-1">
        <Clock3 className={`shrink-0 opacity-80 ${iconClass}`} aria-hidden />
        <span className="truncate font-medium">
          {formatTimeShort(eta)}–{formatTimeShort(etd)}
        </span>
      </li>
      <li className="inline-flex min-w-0 items-center gap-1">
        <MapPinned className={`shrink-0 opacity-80 ${iconClass}`} aria-hidden />
        <span className="truncate font-medium">{positionLabel}</span>
      </li>
    </ul>
  );
}
