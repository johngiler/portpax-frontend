"use client";

import { AlertTriangle } from "lucide-react";
import { conflictBadgeClassName } from "@/lib/bookingConflictStyle";
import type { BookingConflictChip } from "@/types/booking";

type ConflictTypeChipsProps = {
  chips?: BookingConflictChip[];
  size?: "sm" | "md";
  className?: string;
};

export default function ConflictTypeChips({
  chips = [],
  size = "sm",
  className = "",
}: ConflictTypeChipsProps) {
  if (chips.length === 0) return null;

  const sizeClass =
    size === "sm"
      ? "gap-0.5 px-1.5 py-0.5 text-[10px]"
      : "gap-1 px-2 py-0.5 text-[11px]";

  return (
    <>
      {chips.map((chip) => (
        <span
          key={`${chip.type}:${chip.label}`}
          className={[
            conflictBadgeClassName(chip.severity),
            "inline-flex items-center font-semibold uppercase tracking-wide",
            sizeClass,
            className,
          ].join(" ")}
        >
          <AlertTriangle
            className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"}
            aria-hidden
          />
          {chip.label}
        </span>
      ))}
    </>
  );
}
