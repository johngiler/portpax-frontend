import {
  buildBookingsWorkspaceQuery,
  type BookingsWorkspaceFilters,
} from "@/lib/viewFilterQuery";
import type { BookingStatusFilterValue } from "@/types/booking";
import type { DashboardCarrierFilter } from "@/types/dashboard";

export type DashboardBookingsLinkBase = {
  dateFrom: string;
  dateTo: string;
  portIds: number[];
  carrier: DashboardCarrierFilter;
};

export function dashboardBookingsHref(
  base: DashboardBookingsLinkBase,
  overrides?: {
    portIds?: number[];
    status?: BookingStatusFilterValue[];
    dateFrom?: string;
    dateTo?: string;
    conflict?: "" | "yes";
  },
): string {
  const dateFrom = overrides?.dateFrom ?? base.dateFrom;
  const dateTo = overrides?.dateTo ?? base.dateTo;
  const year = Number(dateFrom.slice(0, 4)) || new Date().getFullYear();
  const state: BookingsWorkspaceFilters = {
    tab: "list",
    status: overrides?.status ?? [],
    search: "",
    ports: overrides?.portIds ?? base.portIds,
    line: base.carrier.type === "line" ? base.carrier.id : 0,
    vessel: 0,
    datePreset: "custom",
    customFrom: dateFrom,
    customTo: dateTo,
    mode: "monthly",
    season: "natural",
    position: 0,
    week: dateFrom,
    year,
    month: Math.max(0, Number(dateFrom.slice(5, 7)) - 1) || 0,
    heat: "availability",
    density: 0,
    conflict: overrides?.conflict ?? "",
    importedDates: [],
  };
  const qs = buildBookingsWorkspaceQuery(state);
  return qs ? `/bookings?${qs}` : "/bookings";
}
