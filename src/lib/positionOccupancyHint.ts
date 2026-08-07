import type { PositionOccupant } from "@/types/booking";
import { BOOKING_STATUS_LABELS } from "@/types/booking";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { formatTimeShort } from "@/lib/bookingDisplay";

export function occupantDateLabel(callDate: string | null | undefined): string | null {
  if (!callDate) return null;
  try {
    return formatIsoDateLabel(callDate, "short");
  } catch {
    return callDate;
  }
}

/** Short Spanish line when a suggested position is occupied. */
export function positionOccupancyHintFromOccupant(
  occupant: PositionOccupant | null | undefined,
  options?: { occupied?: boolean },
): string | null {
  const occupied = options?.occupied ?? true;
  if (!occupied) return null;
  if (!occupant) return "Posición ocupada en esa fecha.";
  const statusLabel =
    BOOKING_STATUS_LABELS[occupant.status as keyof typeof BOOKING_STATUS_LABELS] ||
    occupant.status.toUpperCase();
  const dateLabel = occupantDateLabel(occupant.call_date);
  const etaLabel = occupant.eta
    ? formatTimeShort(occupant.eta)
    : null;
  const etdLabel = occupant.etd
    ? formatTimeShort(occupant.etd)
    : null;
  const windowLabel =
    etaLabel || etdLabel
      ? `ETA ${etaLabel ?? "—"} – ETD ${etdLabel ?? "—"}`
      : null;
  const parts = [
    occupant.position_code ? `posición ${occupant.position_code}` : null,
    dateLabel ? `el ${dateLabel}` : null,
    windowLabel,
    occupant.vessel_name || null,
    occupant.shipping_line_name || null,
    statusLabel ? `estado ${statusLabel}` : null,
    occupant.booking_code || null,
  ].filter(Boolean);
  if (parts.length === 0) return "Posición ocupada en esa fecha.";
  return `Ocupada por ${parts.join(" · ")}.`;
}

export function positionOccupancyHint(
  position:
    | { occupied?: boolean; occupant?: PositionOccupant | null }
    | undefined
    | null,
): string | null {
  if (!position?.occupied) return null;
  return positionOccupancyHintFromOccupant(position.occupant, {
    occupied: true,
  });
}
