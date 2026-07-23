import {
  isBookingListStatusFilter,
  type BookingListStatusFilter,
} from "@/types/booking";

export type BookingsDatePresetQuery =
  | "all"
  | "hoy"
  | "7d"
  | "30d"
  | "temporada"
  | "custom";

export type CalendarViewModeQuery = "weekly" | "monthly" | "annual";

export type BookingsTabQuery = "list" | "calendar" | "availability";

const DATE_PRESETS = new Set<BookingsDatePresetQuery>([
  "all",
  "hoy",
  "7d",
  "30d",
  "temporada",
  "custom",
]);

const MODES = new Set<CalendarViewModeQuery>(["weekly", "monthly", "annual"]);
const TABS = new Set<BookingsTabQuery>(["list", "calendar", "availability"]);

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
  status: BookingListStatusFilter;
  search: string;
  /** Single shared port (0 = all ports for list/calendar). */
  port: number;
  line: number;
  vessel: number;
  datePreset: BookingsDatePresetQuery;
  customFrom: string;
  customTo: string;
  mode: CalendarViewModeQuery;
  position: number;
  week: string;
  year: number;
  month: number; // 0-11
};

export function parseBookingsWorkspaceFilters(
  sp: URLSearchParams,
  defaults: { customFrom: string; customTo: string; week: string; year: number; month: number },
): BookingsWorkspaceFilters {
  const tabRaw = sp.get("tab");
  const statusRaw = sp.get("status");
  const dateRaw = sp.get("date");
  const modeRaw = sp.get("mode");
  const yearRaw = sp.get("year");
  const monthRaw = sp.get("month");
  const year = yearRaw ? Number(yearRaw) : defaults.year;
  const monthNum = monthRaw ? Number(monthRaw) : defaults.month + 1;

  // Legacy /calendar?ports=1,2 → first port
  const portsCsv = sp.get("ports");
  const portFromCsv = portsCsv
    ?.split(",")
    .map((p) => parseIntId(p.trim()))
    .find((id) => id > 0);

  return {
    tab:
      tabRaw && TABS.has(tabRaw as BookingsTabQuery)
        ? (tabRaw as BookingsTabQuery)
        : "list",
    status: isBookingListStatusFilter(statusRaw) ? statusRaw : "",
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
    position: parseIntId(sp.get("position")),
    week: sp.get("week") || defaults.week,
    year: Number.isFinite(year) && year >= 2000 ? Math.trunc(year) : defaults.year,
    month:
      Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12
        ? Math.trunc(monthNum) - 1
        : defaults.month,
  };
}

export function buildBookingsWorkspaceQuery(
  state: BookingsWorkspaceFilters,
): string {
  const sp = new URLSearchParams();
  if (state.tab !== "list") sp.set("tab", state.tab);
  if (state.status) sp.set("status", state.status);
  if (state.search) sp.set("q", state.search);
  if (state.port > 0) sp.set("port", String(state.port));
  if (state.line > 0) sp.set("line", String(state.line));
  if (state.vessel > 0) sp.set("vessel", String(state.vessel));
  if (state.datePreset !== "all") {
    sp.set("date", state.datePreset);
    if (state.datePreset === "custom") {
      if (state.customFrom) sp.set("from", state.customFrom);
      if (state.customTo) sp.set("to", state.customTo);
    }
  }
  if (state.tab === "calendar") {
    if (state.mode !== "monthly") sp.set("mode", state.mode);
    if (state.position > 0) sp.set("position", String(state.position));
    if (state.mode === "weekly" && state.week) sp.set("week", state.week);
    if (state.mode === "monthly" || state.mode === "annual") {
      sp.set("year", String(state.year));
    }
    if (state.mode === "monthly") {
      sp.set("month", String(state.month + 1));
    }
  }
  return sp.toString();
}
