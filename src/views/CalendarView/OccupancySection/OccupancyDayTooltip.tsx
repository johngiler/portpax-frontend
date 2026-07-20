"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Anchor,
  CalendarDays,
  MapPin,
  Ship,
  X,
} from "lucide-react";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { Booking } from "@/types/booking";
import { bookingStatusLabel } from "@/types/booking";

export type TooltipAnchor = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type OccupancyDayTooltipProps = {
  date: string;
  bookings: Booking[];
  anchor: TooltipAnchor;
  pinned: boolean;
  onClose: () => void;
  onKeepOpen: () => void;
  onHoverLeave: () => void;
};

function statusTone(status: Booking["status"]): string {
  if (status === "co" || status === "cl") {
    return "bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]";
  }
  if (status === "lta" || status === "ltd") {
    return "bg-sky-500/15 text-sky-700 dark:text-sky-400";
  }
  if (status === "r") return "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300";
  if (status === "c") return "bg-red-500/10 text-red-600 dark:text-red-400";
  if (status === "h") return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]";
}

function LogoThumb({
  src,
  alt,
  fallback,
  size = "md",
  fit = "contain",
}: {
  src: string | null | undefined;
  alt: string;
  fallback: ReactNode;
  size?: "sm" | "md";
  /** Photos use cover; brand logos stay contain. */
  fit?: "cover" | "contain";
}) {
  const box = size === "sm" ? "h-6 w-6" : "h-9 w-9";
  const imageFit = fit === "cover" ? "object-cover" : "object-contain p-0.5";
  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800`}
    >
      {src ? (
        <img src={src} alt={alt} className={`h-full w-full ${imageFit}`} />
      ) : (
        <span className="text-zinc-400 dark:text-zinc-500">{fallback}</span>
      )}
    </span>
  );
}

const TOOLTIP_WIDTH = 320;
const GAP = 8;

export default function OccupancyDayTooltip({
  date,
  bookings,
  anchor,
  pinned,
  onClose,
  onKeepOpen,
  onHoverLeave,
}: OccupancyDayTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    const height = el?.offsetHeight ?? 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = anchor.left + anchor.width / 2 - TOOLTIP_WIDTH / 2;
    left = Math.max(GAP, Math.min(left, vw - TOOLTIP_WIDTH - GAP));

    let top = anchor.top - height - GAP;
    if (top < GAP) {
      top = anchor.top + anchor.height + GAP;
    }
    if (top + height > vh - GAP) {
      top = Math.max(GAP, vh - height - GAP);
    }

    setPos({ top, left });
    setReady(true);
  }, [anchor, bookings.length, date]);

  useEffect(() => {
    if (!pinned) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    function onPointerDown(e: MouseEvent) {
      if (ref.current?.contains(e.target as Node)) return;
      onClose();
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [pinned, onClose]);

  if (typeof document === "undefined") return null;

  const active = bookings.filter((b) => b.status !== "c");

  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      onMouseEnter={onKeepOpen}
      onMouseLeave={() => {
        if (!pinned) onHoverLeave();
      }}
      className={[
        "fixed z-[80] overflow-hidden rounded-xl border border-white/70 bg-white/95 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.4)] backdrop-blur-md transition-opacity duration-150 dark:border-zinc-700/80 dark:bg-zinc-900/95",
        ready ? "opacity-100" : "opacity-0",
      ].join(" ")}
      style={{ top: pos.top, left: pos.left, width: TOOLTIP_WIDTH }}
    >
      <div className="border-b border-zinc-200/80 bg-gradient-to-r from-[var(--admin-accent)]/[0.06] to-transparent px-3.5 py-2.5 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent)]/12 text-[var(--admin-accent)]">
              <CalendarDays className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                {formatIsoDateLabel(date)}
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                {active.length} escala{active.length === 1 ? "" : "s"}
                {pinned ? "" : " · vista previa"}
              </p>
            </div>
          </div>
          {pinned ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="cursor-pointer rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {bookings.length === 0 ? (
        <p className="px-3.5 py-5 text-center text-[11px] text-zinc-400">
          Sin escalas este día
        </p>
      ) : (
        <ul className="max-h-64 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800/80">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Link
                href={`/bookings/detail?code=${encodeURIComponent(booking.booking_code)}`}
                className="flex items-start gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-[var(--admin-accent)]/[0.06]"
                onClick={onClose}
              >
                <LogoThumb
                  src={booking.vessel_logo}
                  alt={booking.vessel_name}
                  fit="cover"
                  fallback={<Ship className="h-4 w-4" />}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-[11px] font-semibold text-zinc-900 dark:text-zinc-50">
                      {booking.vessel_name}
                    </p>
                    <span
                      className={`rounded-full px-1.5 py-px text-[9px] font-semibold ${statusTone(booking.status)}`}
                    >
                      {bookingStatusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="mt-1.5 space-y-1">
                    <p className="flex min-w-0 items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                      <LogoThumb
                        src={booking.shipping_line_logo}
                        alt={booking.shipping_line_name}
                        size="sm"
                        fallback={<Anchor className="h-3 w-3" />}
                      />
                      <span className="truncate">{booking.shipping_line_name}</span>
                    </p>
                    <p className="flex min-w-0 items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                      <LogoThumb
                        src={booking.port_logo}
                        alt={booking.port_name}
                        size="sm"
                        fallback={<MapPin className="h-3 w-3" />}
                      />
                      <span className="truncate">
                        {booking.port_name}
                        {booking.position_code ? ` · ${booking.position_code}` : ""}
                      </span>
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>,
    document.body,
  );
}

export function anchorFromElement(el: Element): TooltipAnchor {
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}
