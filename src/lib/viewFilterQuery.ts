import {
  CANCELLATION_REASON_OPTIONS,
  DEFAULT_BOOKINGS_LIST_STATUSES,
  parseBookingStatusFilters,
  serializeBookingStatusFilters,
  type BookingStatusFilterValue,
  type CancellationReason,
} from "@/types/booking";
import {
  parseVesselSizeCategoryFilters,
  type VesselSizeCategory,
} from "@/types/cruise";

import type { ConflictTypeFilterValue } from "@/lib/bookingConflictLabels";
import { parseIsoDate } from "@/lib/bookingDates";

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
const PAX_BASES = new Set<"planned" | "capacity">(["planned", "capacity"]);

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
  /** Empty = all ports. One or more for lista / calendario / disponibilidad. */
  ports: number[];
  /** Shipping line groups (empty = all). Multi select. */
  groups: number[];
  /** Shipping lines (empty = all). Wins over groups when set. */
  lines: number[];
  vessel: number;
  /** Vessel.size_category multi-filter (list / export). */
  sizeCategories: VesselSizeCategory[];
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
  /** Annual view: selected months (0–11). Empty = use season / full year. */
  months: number[];
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
  /** Only bookings marked primer arribo (first_arrival=true). */
  firstArrival: boolean;
  /** Single cancellation reason; only applies when status includes cancelled. */
  cancellationReason: CancellationReason | "";
  /** Booking tag IDs (multi). Empty = all tags. */
  tags: number[];
  /**
   * List passenger KPI basis (same as reports Base PAX).
   * Real always wins when set; otherwise planned or vessel max capacity.
   */
  paxBasis: "planned" | "capacity";
  /** Availability: discrete dates from Excel/paste import (ISO YYYY-MM-DD). */
  importedDates: string[];
};

export type ConflictFilterValue = BookingsWorkspaceFilters["conflict"];

const CANCELLATION_REASONS = new Set<CancellationReason>(
  CANCELLATION_REASON_OPTIONS.map((option) => option.value),
);

function parseCancellationReason(
  raw: string | null,
): CancellationReason | "" {
  const value = (raw ?? "").trim();
  return CANCELLATION_REASONS.has(value as CancellationReason)
    ? (value as CancellationReason)
    : "";
}

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

/** Query `months=1,3,6` (1-based) → unique sorted 0–11 indexes. */
function parseMonthIndexes(raw: string | null): number[] {
  if (!raw) return [];
  const seen = new Set<number>();
  const out: number[] = [];
  for (const part of raw.split(",")) {
    const n = Number(part.trim());
    if (!Number.isFinite(n)) continue;
    const index = Math.trunc(n) - 1;
    if (index < 0 || index > 11 || seen.has(index)) continue;
    seen.add(index);
    out.push(index);
  }
  out.sort((a, b) => a - b);
  if (out.length === 12) return [];
  return out;
}

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
  const modeRawResolved =
    modeRaw && MODES.has(modeRaw as CalendarViewModeQuery)
      ? (modeRaw as CalendarViewModeQuery)
      : "monthly";
  const week = sp.get("week") || defaults.week;
  let year = yearRaw ? Number(yearRaw) : defaults.year;
  const monthNum = monthRaw ? Number(monthRaw) : defaults.month + 1;
  let monthIndex =
    Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12
      ? Math.trunc(monthNum) - 1
      : defaults.month;
  if (modeRawResolved === "weekly" && /^\d{4}-\d{2}-\d{2}$/.test(week)) {
    const parsedWeek = parseIsoDate(week);
    year = parsedWeek.year;
    monthIndex = parsedWeek.monthIndex;
  }
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
  const paxRaw = sp.get("pax");

  // `ports=1,2` preferred; legacy `port=1` still accepted.
  const portsCsv = sp.get("ports") || sp.get("port");
  const ports = (portsCsv ?? "")
    .split(",")
    .map((p) => parseIntId(p.trim()))
    .filter((id) => id > 0);
  // No `status` param → default operational set; explicit empty `status=` → all.
  const status = sp.has("status")
    ? parseBookingStatusFilters(statusRaw)
    : [...DEFAULT_BOOKINGS_LIST_STATUSES];
  // Groups + lines as CSV. Legacy `group` / `line` still accepted.
  const groupsCsv = sp.get("groups") || sp.get("group");
  const groups = (groupsCsv ?? "")
    .split(",")
    .map((p) => parseIntId(p.trim()))
    .filter((id) => id > 0);
  const linesCsv = sp.get("lines") || sp.get("line");
  const lines = (linesCsv ?? "")
    .split(",")
    .map((p) => parseIntId(p.trim()))
    .filter((id) => id > 0);

  return {
    tab,
    status,
    search: sp.get("q")?.trim() ?? "",
    ports,
    groups,
    lines,
    vessel: parseIntId(sp.get("vessel")),
    sizeCategories: parseVesselSizeCategoryFilters(sp.get("size")),
    datePreset: isDatePreset(dateRaw) ? dateRaw : "all",
    customFrom: sp.get("from") || defaults.customFrom,
    customTo: sp.get("to") || defaults.customTo,
    mode: modeRawResolved,
    season:
      seasonRaw && SEASONS.has(seasonRaw as CalendarSeasonQuery)
        ? (seasonRaw as CalendarSeasonQuery)
        : "natural",
    position: parseIntId(sp.get("position")),
    week,
    year: Number.isFinite(year) && year >= 2000 ? Math.trunc(year) : defaults.year,
    month: monthIndex,
    months:
      modeRawResolved === "annual" ? parseMonthIndexes(sp.get("months")) : [],
    heat,
    density,
    conflict,
    firstArrival: ["1", "true", "yes", "si", "sí"].includes(
      (sp.get("first_arrival") || "").trim().toLowerCase(),
    ),
    cancellationReason: status.includes("c")
      ? parseCancellationReason(sp.get("cancellation_reason"))
      : "",
    tags: (sp.get("tags") ?? "")
      .split(",")
      .map((p) => parseIntId(p.trim()))
      .filter((id) => id > 0),
    paxBasis:
      paxRaw && PAX_BASES.has(paxRaw as "planned" | "capacity")
        ? (paxRaw as "planned" | "capacity")
        : "planned",
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
  if (state.ports.length > 0) sp.set("ports", state.ports.join(","));
  if (state.groups.length > 0) sp.set("groups", state.groups.join(","));
  if (state.lines.length > 0) sp.set("lines", state.lines.join(","));
  if (state.vessel > 0) sp.set("vessel", String(state.vessel));
  if (state.sizeCategories.length > 0) {
    sp.set("size", state.sizeCategories.join(","));
  }
  if (state.tags.length > 0) sp.set("tags", state.tags.join(","));
  if (
    state.conflict === "yes" ||
    state.conflict === "no" ||
    state.conflict === "yellow" ||
    state.conflict === "red" ||
    CONFLICT_TYPE_VALUES.has(state.conflict as ConflictTypeFilterValue)
  ) {
    sp.set("conflict", state.conflict);
  }
  if (state.firstArrival) sp.set("first_arrival", "1");
  if (state.status.includes("c") && state.cancellationReason) {
    sp.set("cancellation_reason", state.cancellationReason);
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
  if (state.mode === "annual" && state.months.length > 0) {
    sp.set(
      "months",
      state.months
        .filter((index) => index >= 0 && index <= 11)
        .sort((a, b) => a - b)
        .map((index) => index + 1)
        .join(","),
    );
  } else if (state.mode === "annual" && state.season !== "natural") {
    sp.set("season", state.season);
  }
  if (state.position > 0) sp.set("position", String(state.position));
  // Availability criterion/density: stash across tabs (only occupancy consumes density).
  if (state.heat === "occupancy") sp.set("heat", "occupancy");
  if (state.density >= 1) sp.set("density", String(state.density));
  if (state.paxBasis === "capacity") sp.set("pax", "capacity");
  if (state.importedDates.length > 0) {
    sp.set("idates", state.importedDates.join(","));
  }
  return sp.toString();
}
