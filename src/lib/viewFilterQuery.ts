import {
  parseBookingStatusFilters,
  serializeBookingStatusFilters,
  type BookingStatusFilterValue,
} from "@/types/booking";

import type { ConflictTypeFilterValue } from "@/lib/bookingConflictLabels";

export type BookingsDatePresetQuery =
  | "all"
  | "hoy"
  | "7d"
  | "30d"
  | "temporada"
  | "custom";

export type CalendarViewModeQuery = "weekly" | "monthly" | "annual";

export type CalendarSeasonQuery = "natural" | "summer" | "winter";

export type BookingsTabQuery = "list" | "calendar" | "availability" | "proximity";

/** Heatmap focus on Disponibilidad de puerto tab. */
export type AvailabilityHeatModeQuery = "availability" | "occupancy";

const DATE_PRESETS = new Set<BookingsDatePresetQuery>([
  "all",
  "hoy",
  "7d",
  "30d",
  "temporada",
  "custom",
]);

const MODES = new Set<CalendarViewModeQuery>(["weekly", "monthly", "annual"]);
const SEASONS = new Set<CalendarSeasonQuery>(["natural", "summer", "winter"]);
const TABS = new Set<BookingsTabQuery>(["list", "calendar", "availability", "proximity"]);
const HEAT_MODES = new Set<AvailabilityHeatModeQuery>([
  "availability",
  "occupancy",
]);

function parseIntId(raw: string | null): number {
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

function isDatePreset(value: string | null): value is BookingsDatePresetQuery {
  return value != null && DATE_PRESETS.has(value as BookingsDatePresetQuery);
}

export type BookingsWorkspaceFilters = {
  tab: BookingsTabQuery;
  /** Empty = all statuses. */
  status: BookingStatusFilterValue[];
  search: string;
  /** Single shared port (0 = all ports for list/calendar). */
  port: number;
  line: number;
  vessel: number;
  datePreset: BookingsDatePresetQuery;
  customFrom: string;
  customTo: string;
  mode: CalendarViewModeQuery;
  /** Annual range: natural year / Summer / Winter. */
  season: CalendarSeasonQuery;
  position: number;
  week: string;
  year: number;
  month: number; // 0-11
  /** Disponibilidad vs ocupación (availability tab only). */
  heat: AvailabilityHeatModeQuery;
  /**
   * Occupancy-only: exact ships-per-day density (0 = all days with any occupancy).
   */
  density: number;
  /** Conflict filter: empty = all; yes/no; yellow/red severity; or conflict type. */
  conflict:
    | ""
    | "yes"
    | "no"
    | "yellow"
    | "red"
    | ConflictTypeFilterValue;
  /** Availability: discrete dates from Excel/paste import (ISO YYYY-MM-DD). */
  importedDates: string[];
};

export type ConflictFilterValue = BookingsWorkspaceFilters["conflict"];

const CONFLICT_TYPE_VALUES = new Set<ConflictTypeFilterValue>([
  "proximity",
  "loa",
  "schedule",
  "position",
  "lta",
  "physical",
]);

function parseConflictFilter(raw: string | null): ConflictFilterValue {
  if (raw === "all") return "";
  if (raw === "yes" || raw === "true" || raw === "1") return "yes";
  if (raw === "no" || raw === "false" || raw === "0") return "no";
  if (raw === "yellow" || raw === "red") return raw;
  if (raw && CONFLICT_TYPE_VALUES.has(raw as ConflictTypeFilterValue)) {
    return raw as ConflictTypeFilterValue;
  }
  return "";
}
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Discrete imported availability dates from `idates` query param. */
export function parseImportedIsoDates(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const iso = part.trim();
    if (!ISO_DATE.test(iso) || seen.has(iso)) continue;
    seen.add(iso);
    out.push(iso);
  }
  out.sort();
  return out;
}

/** Map sidebar conflict filter to list/availability API params. */
export function conflictFilterToApiParams(filter: ConflictFilterValue): {
  has_conflict?: boolean;
  conflict_severity?: "yellow" | "red";
  conflict_type?: ConflictTypeFilterValue;
} {
  if (filter === "yes") return { has_conflict: true };
  if (filter === "no") return { has_conflict: false };
  if (filter === "yellow") return { conflict_severity: "yellow" };
  if (filter === "red") return { conflict_severity: "red" };
  if (CONFLICT_TYPE_VALUES.has(filter as ConflictTypeFilterValue)) {
    return { conflict_type: filter as ConflictTypeFilterValue };
  }
  return {};
}

export function parseBookingsWorkspaceFilters(
  sp: URLSearchParams,
  defaults: { customFrom: string; customTo: string; week: string; year: number; month: number },
): BookingsWorkspaceFilters {
  const tabRaw = sp.get("tab");
  const statusRaw = sp.getAll("status").join(",") || sp.get("status");
  const dateRaw = sp.get("date");
  const modeRaw = sp.get("mode");
  const seasonRaw = sp.get("season");
  const heatRaw = sp.get("heat");
  const densityRaw = sp.get("density");
  const yearRaw = sp.get("year");
  const monthRaw = sp.get("month");
  const year = yearRaw ? Number(yearRaw) : defaults.year;
  const monthNum = monthRaw ? Number(monthRaw) : defaults.month + 1;
  const heat: AvailabilityHeatModeQuery =
    heatRaw && HEAT_MODES.has(heatRaw as AvailabilityHeatModeQuery)
      ? (heatRaw as AvailabilityHeatModeQuery)
      : "availability";
  const densityNum = densityRaw ? Number(densityRaw) : 0;
  // Keep density across heat criteria (gaps ignores it; occupancy reuses it).
  const density =
    Number.isFinite(densityNum) && densityNum >= 1 && densityNum <= 4
      ? Math.trunc(densityNum)
      : 0;
  const tab: BookingsTabQuery =
    tabRaw === "history"
      ? "list"
      : tabRaw && TABS.has(tabRaw as BookingsTabQuery)
        ? (tabRaw as BookingsTabQuery)
        : "list";
  const conflict = parseConflictFilter(
    sp.get("conflict") ?? sp.get("has_conflict"),
  );

  // Legacy /calendar?ports=1,2 → first port
  const portsCsv = sp.get("ports");
  const portFromCsv = portsCsv
    ?.split(",")
    .map((p) => parseIntId(p.trim()))
    .find((id) => id > 0);

  return {
    tab,
    status: parseBookingStatusFilters(statusRaw),
    search: sp.get("q")?.trim() ?? "",
    port: parseIntId(sp.get("port")) || portFromCsv || 0,
    line: parseIntId(sp.get("line")),
    vessel: parseIntId(sp.get("vessel")),
    datePreset: isDatePreset(dateRaw) ? dateRaw : "all",
    customFrom: sp.get("from") || defaults.customFrom,
    customTo: sp.get("to") || defaults.customTo,
    mode:
      modeRaw && MODES.has(modeRaw as CalendarViewModeQuery)
        ? (modeRaw as CalendarViewModeQuery)
        : "monthly",
    season:
      seasonRaw && SEASONS.has(seasonRaw as CalendarSeasonQuery)
        ? (seasonRaw as CalendarSeasonQuery)
        : "natural",
    position: parseIntId(sp.get("position")),
    week: sp.get("week") || defaults.week,
    year: Number.isFinite(year) && year >= 2000 ? Math.trunc(year) : defaults.year,
    month:
      Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12
        ? Math.trunc(monthNum) - 1
        : defaults.month,
    heat,
    density,
    conflict,
    importedDates: parseImportedIsoDates(
      sp.getAll("idates").join(",") || sp.get("idates"),
    ),
  };
}

export function buildBookingsWorkspaceQuery(
  state: BookingsWorkspaceFilters,
): string {
  const sp = new URLSearchParams();
  if (state.tab !== "list") sp.set("tab", state.tab);
  const statusCsv = serializeBookingStatusFilters(state.status);
  if (statusCsv) sp.set("status", statusCsv);
  if (state.search) sp.set("q", state.search);
  if (state.port > 0) sp.set("port", String(state.port));
  if (state.line > 0) sp.set("line", String(state.line));
  if (state.vessel > 0) sp.set("vessel", String(state.vessel));
  if (
    state.conflict === "yes" ||
    state.conflict === "no" ||
    state.conflict === "yellow" ||
    state.conflict === "red" ||
    CONFLICT_TYPE_VALUES.has(state.conflict as ConflictTypeFilterValue)
  ) {
    sp.set("conflict", state.conflict);
  }
  if (state.datePreset !== "all") {
    sp.set("date", state.datePreset);
    if (state.datePreset === "custom") {
      if (state.customFrom) sp.set("from", state.customFrom);
      if (state.customTo) sp.set("to", state.customTo);
    }
  }
  // Calendar view params: keep across tabs so returning restores mode/year/month.
  if (state.mode !== "monthly") sp.set("mode", state.mode);
  if (state.mode === "weekly" && state.week) sp.set("week", state.week);
  if (state.mode === "monthly" || state.mode === "annual") {
    sp.set("year", String(state.year));
  }
  if (state.mode === "monthly") {
    sp.set("month", String(state.month + 1));
  }
  if (state.mode === "annual" && state.season !== "natural") {
    sp.set("season", state.season);
  }
  if (state.position > 0) sp.set("position", String(state.position));
  // Availability criterion/density: stash across tabs (only occupancy consumes density).
  if (state.heat === "occupancy") sp.set("heat", "occupancy");
  if (state.density >= 1) sp.set("density", String(state.density));
  if (state.importedDates.length > 0) {
    sp.set("idates", state.importedDates.join(","));
  }
  return sp.toString();
}
