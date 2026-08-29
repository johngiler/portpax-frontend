import { BOOKINGS_DATE_PRESET_LABELS } from "@/views/BookingsView/BookingsDateFilters";
import type { BookingsDatePreset } from "@/views/BookingsView/BookingsDateFilters";
import type {
  AvailabilityHeatModeQuery,
  ConflictFilterValue,
} from "@/lib/viewFilterQuery";
import {
  BOOKING_STATUS_MULTI_OPTIONS,
  type BookingStatusFilterValue,
} from "@/types/booking";

const CONFLICT_CHIP_LABELS: Partial<Record<ConflictFilterValue, string>> = {
  yes: "Con conflicto",
  no: "Sin conflicto",
  yellow: "Conflicto amarillo",
  red: "Conflicto rojo",
  proximity: "Tipo · Proximidad",
  loa: "Tipo · Eslora",
  schedule: "Tipo · Horario",
  position: "Tipo · Posición",
  lta: "Tipo · LTA",
  physical: "Tipo · Físico",
};

const STATUS_LABEL = Object.fromEntries(
  BOOKING_STATUS_MULTI_OPTIONS.map((o) => [o.value, o.label]),
) as Record<BookingStatusFilterValue, string>;

export type ActiveFilterChipIcon =
  | "port"
  | "position"
  | "shipping_line"
  | "vessel"
  | "status"
  | "conflict"
  | "search"
  | "dates"
  | "heat"
  | "density"
  | "calendar"
  | "lta";

export type ActiveFilterChip = {
  id: string;
  label: string;
  icon: ActiveFilterChipIcon;
};

export type BookingsActiveFilterChipInput = {
  tab: "list" | "calendar" | "availability" | "proximity";
  portLabel?: string | null;
  positionLabel?: string | null;
  lineLabel?: string | null;
  vesselLabel?: string | null;
  statuses: BookingStatusFilterValue[];
  conflict: ConflictFilterValue;
  search: string;
  datePreset: BookingsDatePreset;
  importedDatesCount: number;
  heatMode: AvailabilityHeatModeQuery;
  density: number;
  calendarModeLabel?: string | null;
};

/** Short chips for the “Vista filtrada” banner (only filters that affect this tab). */
export function buildBookingsActiveFilterChips(
  input: BookingsActiveFilterChipInput,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  const { tab } = input;

  if (tab !== "proximity" && input.portLabel) {
    chips.push({
      id: "port",
      label: input.portLabel,
      icon: "port",
    });
  }
  if (tab !== "proximity" && input.positionLabel) {
    chips.push({
      id: "position",
      label: `Pos. ${input.positionLabel}`,
      icon: "position",
    });
  }

  const gapsOnly =
    tab === "availability" && input.heatMode === "availability";

  if (!gapsOnly) {
    if (input.lineLabel) {
      chips.push({
        id: "line",
        label: input.lineLabel,
        icon: "shipping_line",
      });
    }
    if (input.vesselLabel) {
      chips.push({
        id: "vessel",
        label: input.vesselLabel,
        icon: "vessel",
      });
    }

    for (const status of input.statuses) {
      const label = STATUS_LABEL[status];
      if (label) {
        chips.push({ id: `status-${status}`, label, icon: "status" });
      }
    }

    if (input.conflict) {
      chips.push({
        id: `conflict-${input.conflict}`,
        label:
          CONFLICT_CHIP_LABELS[input.conflict] ??
          `Conflicto · ${input.conflict}`,
        icon: "conflict",
      });
    }
  }

  if (tab === "list" && input.search.trim()) {
    const q = input.search.trim();
    chips.push({
      id: "search",
      label: q.length > 28 ? `Buscar: ${q.slice(0, 28)}…` : `Buscar: ${q}`,
      icon: "search",
    });
  }

  if (input.importedDatesCount > 0) {
    chips.push({
      id: "imported-dates",
      label: `${input.importedDatesCount} fecha${input.importedDatesCount === 1 ? "" : "s"} importada${input.importedDatesCount === 1 ? "" : "s"}`,
      icon: "dates",
    });
  } else if (tab !== "calendar" && input.datePreset !== "all") {
    chips.push({
      id: "date-preset",
      label: BOOKINGS_DATE_PRESET_LABELS[input.datePreset],
      icon: "dates",
    });
  }

  if (tab === "availability") {
    if (input.heatMode === "occupancy") {
      chips.push({
        id: "heat",
        label: "Criterio: Ocupación",
        icon: "heat",
      });
      if (input.density >= 1) {
        chips.push({
          id: "density",
          label: `${input.density} barco${input.density === 1 ? "" : "s"}/día`,
          icon: "density",
        });
      }
    } else {
      chips.push({
        id: "heat",
        label: "Criterio: Disponibilidad",
        icon: "heat",
      });
    }
  }

  if (tab === "calendar" && input.calendarModeLabel) {
    chips.push({
      id: "calendar-mode",
      label: input.calendarModeLabel,
      icon: "calendar",
    });
  }

  return chips;
}
