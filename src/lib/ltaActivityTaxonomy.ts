import type {
  LtaActivityOperation,
  LtaActivityOrigin,
} from "@/services/bookings/ltaActivityService";
import type { LtaActivityItem } from "@/services/bookings/ltaActivityService";

/** Unified LTA history type filter. Empty = all. */
export type LtaActivityFilterValue =
  | ""
  | "create"
  | "update"
  | "delete"
  | "link:booking"
  | "generate:booking"
  | "regenerate:booking";

export const LTA_ACTIVITY_TYPE_OPTIONS: {
  value: Exclude<LtaActivityFilterValue, "">;
  label: string;
}[] = [
  { value: "create", label: "Creación" },
  { value: "update", label: "Actualización" },
  { value: "delete", label: "Eliminación" },
  { value: "link:booking", label: "Vinculación · Reservas" },
  { value: "generate:booking", label: "Generación · Reservas" },
  { value: "regenerate:booking", label: "Regeneración · Reservas" },
];

export function ltaActivityFilterToApiParams(
  filter: LtaActivityFilterValue,
): {
  operation?: LtaActivityOperation;
  origin?: LtaActivityOrigin;
} {
  if (!filter) {
    return {};
  }
  if (filter === "create" || filter === "update" || filter === "delete") {
    return { operation: filter };
  }
  const sep = filter.indexOf(":");
  if (sep <= 0) {
    return {};
  }
  const operation = filter.slice(0, sep) as LtaActivityOperation;
  const origin = filter.slice(sep + 1) as LtaActivityOrigin;
  return { operation, origin };
}

export type { LtaActivityOperation, LtaActivityOrigin };

const ORIGIN_LABELS: Record<Exclude<LtaActivityOrigin, "all">, string> = {
  booking: "Reservas",
};

function ltaActivityOriginLabel(
  origin: Exclude<LtaActivityOrigin, "all">,
): string {
  return ORIGIN_LABELS[origin];
}

export type LtaActivityBadgeParts = {
  operation: string;
  origin: string | null;
};

export function ltaActivityBadges(item: LtaActivityItem): LtaActivityBadgeParts {
  switch (item.action) {
    case "created":
      return { operation: "Creación", origin: null };
    case "updated":
      return { operation: "Actualización", origin: null };
    case "deleted":
      return { operation: "Eliminación", origin: null };
    case "link_bookings":
      return {
        operation: "Vinculación",
        origin: ltaActivityOriginLabel("booking"),
      };
    case "generate_bookings": {
      const jobKind =
        item.changes && typeof item.changes.job_kind === "string"
          ? item.changes.job_kind
          : null;
      return {
        operation: jobKind === "regenerate" ? "Regeneración" : "Generación",
        origin: ltaActivityOriginLabel("booking"),
      };
    }
    default:
      return { operation: item.action, origin: null };
  }
}
