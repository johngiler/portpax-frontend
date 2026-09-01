import type {
  BookingActivityOperation,
  BookingActivityOrigin,
} from "@/services/bookings/bookingActivityService";
import type { BookingActivityItem } from "@/services/bookings/bookingActivityService";

/** Unified history type filter (sidebar select value). Empty = all. */
export type BookingActivityFilterValue =
  | ""
  | "create"
  | "create:wizard"
  | "create:mass_import"
  | "create:lta_generate"
  | "create:berthing_import"
  | "update"
  | "update:booking_update"
  | "update:mass_update"
  | "update:lta_agreement"
  | "delete";

/**
 * Booking history filters — operation · origin (display label).
 *
 * Create: wizard (1×1), mass import (Excel/paste batch), LTA generate, BERTHING batch.
 * Update: booking detail edits (label Wizard), bulk edit, LTA link/resync/regenerate.
 */
export const BOOKING_ACTIVITY_TYPE_OPTIONS: {
  value: Exclude<BookingActivityFilterValue, "">;
  label: string;
}[] = [
  { value: "create", label: "Creación" },
  { value: "create:wizard", label: "Creación · Wizard" },
  { value: "create:mass_import", label: "Creación · Masiva" },
  { value: "create:lta_generate", label: "Creación · Acuerdos LTA" },
  { value: "create:berthing_import", label: "Creación · BERTHING PAPERS" },
  { value: "update", label: "Actualización" },
  { value: "update:booking_update", label: "Actualización · Wizard" },
  { value: "update:mass_update", label: "Actualización · Masiva" },
  { value: "update:lta_agreement", label: "Actualización · Acuerdos LTA" },
  { value: "delete", label: "Eliminación" },
];

export function bookingActivityFilterToApiParams(
  filter: BookingActivityFilterValue,
): {
  operation?: BookingActivityOperation;
  origin?: BookingActivityOrigin;
} {
  if (!filter) {
    return {};
  }
  if (filter === "delete") {
    return { operation: "delete" };
  }
  if (filter === "create" || filter === "update") {
    return { operation: filter };
  }
  const sep = filter.indexOf(":");
  if (sep <= 0) {
    return {};
  }
  const operation = filter.slice(0, sep) as BookingActivityOperation;
  const origin = filter.slice(sep + 1) as BookingActivityOrigin;
  return { operation, origin };
}

export type { BookingActivityOperation, BookingActivityOrigin };

const ORIGIN_LABELS: Record<Exclude<BookingActivityOrigin, "all">, string> = {
  wizard: "Wizard",
  mass_import: "Masiva",
  lta_generate: "Acuerdos LTA",
  berthing_import: "BERTHING PAPERS",
  booking_update: "Wizard",
  mass_update: "Masiva",
  lta_agreement: "Acuerdos LTA",
  lta_link: "Acuerdos LTA",
};

function bookingActivityOriginLabel(
  origin: Exclude<BookingActivityOrigin, "all">,
): string {
  return ORIGIN_LABELS[origin];
}

function isBerthingBatch(item: BookingActivityItem): boolean {
  return (
    item.kind === "bulk" &&
    (item.label?.trim() ?? "").startsWith("BERTHING PAPERS")
  );
}

function itemOperation(item: BookingActivityItem): BookingActivityOperation {
  if (item.action === "created" || item.action === "bulk_create") {
    return "create";
  }
  if (item.action === "deleted") {
    return "delete";
  }
  return "update";
}

function itemOrigin(
  item: BookingActivityItem,
): Exclude<BookingActivityOrigin, "all"> | null {
  if (isBerthingBatch(item)) {
    return "berthing_import";
  }
  if (item.kind === "bulk") {
    return "mass_import";
  }

  const source =
    item.changes && typeof item.changes.source === "string"
      ? item.changes.source
      : null;

  if (source === "lta_agreement") {
    return "lta_agreement";
  }

  if (item.action === "lta_linked" || item.action === "lta_unlinked") {
    return "lta_agreement";
  }

  if (source === "bulk_edit") {
    return "mass_update";
  }

  if (source === "wizard") return "wizard";
  if (source === "lta_generate") return "lta_generate";
  if (
    source === "mass_import" ||
    source === "import_file" ||
    source === "import_paste"
  ) {
    return "mass_import";
  }

  if (item.action === "created") {
    return "wizard";
  }

  if (
    item.action === "operational_update" ||
    item.action === "identity_update" ||
    item.action === "status_change" ||
    item.action.startsWith("conflict_")
  ) {
    return "booking_update";
  }

  return null;
}

export type BookingActivityBadgeParts = {
  operation: string;
  origin: string | null;
};

export function bookingActivityOperationLabel(
  item: BookingActivityItem,
): string {
  switch (itemOperation(item)) {
    case "create":
      return "Creación";
    case "update":
      return "Actualización";
    case "delete":
      return "Eliminación";
    default:
      return "Movimiento";
  }
}

export function bookingActivityBadges(
  item: BookingActivityItem,
): BookingActivityBadgeParts {
  const operation = bookingActivityOperationLabel(item);
  const originKey = itemOrigin(item);
  const origin =
    originKey != null ? bookingActivityOriginLabel(originKey) : null;
  return { operation, origin };
}

/** @deprecated Use bookingActivityBadges. */
export function bookingActivityBadge(item: BookingActivityItem): string {
  const { operation, origin } = bookingActivityBadges(item);
  return origin ? `${operation} · ${origin}` : operation;
}
