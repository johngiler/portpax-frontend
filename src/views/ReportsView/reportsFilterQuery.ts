import { toIsoDate } from "@/lib/bookingDates";
import {
  defaultReportDateFrom,
  defaultReportDateTo,
} from "./reportsFilterDefaults";

export type ReportTab =
  | "ports_totals"
  | "port_carrier"
  | "port_trends"
  | "solicitudes_port"
  | "booking_movements"
  | "weekly_report";

/** Basis for passenger totals when actual_pax is missing. */
export type ReportPaxBasis = "planned" | "capacity";

export type ReportsWorkspaceFilters = {
  tab: ReportTab;
  dateFrom: string;
  dateTo: string;
  port: number;
  withoutLta: boolean;
  paxBasis: ReportPaxBasis;
  /** Calendar years for resumen (multi) or movimientos / semanal (single). */
  years: number[];
  /** ISO week for Reporte Semanal (1–53). */
  week: number;
  /** Booking tag IDs (OR). */
  tagIds: number[];
  /** Shipping line group — filters alone or scopes the naviera select. 0 = none. */
  shippingLineGroupId: number;
  /** Single shipping line — optional when a group is selected. 0 = none. */
  shippingLineId: number;
};

const TABS = new Set<ReportTab>([
  "ports_totals",
  "port_carrier",
  "port_trends",
  "solicitudes_port",
  "booking_movements",
  "weekly_report",
]);
const PAX_BASES = new Set<ReportPaxBasis>(["planned", "capacity"]);

export const MIN_REPORT_YEAR = 2025;

function parseIntId(raw: string | null): number {
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

function parseIdList(raw: string | null): number[] {
  if (!raw) return [];
  const out: number[] = [];
  for (const part of raw.split(",")) {
    const n = Number(part.trim());
    if (!Number.isFinite(n) || n <= 0) continue;
    const id = Math.trunc(n);
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

/** ISO week number + ISO week-year for a local Date. */
export function isoYearWeek(d = new Date()): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const year = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { year, week };
}

/** Last ISO week number of a calendar/ISO year (52 or 53). */
export function maxIsoWeek(year: number): number {
  return isoYearWeek(new Date(year, 11, 28)).week;
}

export function clampIsoWeek(year: number, week: number): number {
  const max = maxIsoWeek(year);
  if (!Number.isFinite(week) || week < 1) return 1;
  if (week > max) return max;
  return Math.trunc(week);
}

/** Years in [from, to] inclusive, from MIN_REPORT_YEAR upward. */
export function yearsInReportRange(dateFrom: string, dateTo: string): number[] {
  const fromY = Number(dateFrom.slice(0, 4));
  const toY = Number(dateTo.slice(0, 4));
  if (!Number.isFinite(fromY) || !Number.isFinite(toY)) return [];
  const start = Math.max(MIN_REPORT_YEAR, Math.min(fromY, toY));
  const end = Math.max(fromY, toY);
  const years: number[] = [];
  for (let y = start; y <= end; y += 1) years.push(y);
  return years;
}

/** Year choices for solicitudes / movimientos (2025 … current+4). */
export function solicitudesYearOptions(): number[] {
  const end = new Date().getFullYear() + 4;
  const years: number[] = [];
  for (let y = MIN_REPORT_YEAR; y <= end; y += 1) years.push(y);
  return years;
}

/**
 * Year choices for audit-based reports (Movimientos + Semanal):
 * past + current only — no future ops years.
 * Uses max(calendar, ISO year) so late-Dec ISO week 1 of next year is selectable.
 */
export function auditOpsYearOptions(): number[] {
  const cal = new Date().getFullYear();
  const { year: isoY } = isoYearWeek();
  const end = Math.max(cal, isoY);
  const years: number[] = [];
  for (let y = MIN_REPORT_YEAR; y <= end; y += 1) years.push(y);
  return years;
}

/** @deprecated Prefer auditOpsYearOptions — same list. */
export function weeklyReportYearOptions(): number[] {
  return auditOpsYearOptions();
}

/** Default single year for Movimientos de bookings / defaults. */
export function defaultMovementYear(): number {
  const now = new Date().getFullYear();
  const options = auditOpsYearOptions();
  if (options.includes(now)) return now;
  return options[options.length - 1] ?? MIN_REPORT_YEAR;
}

/** Default ISO year + week for Reporte Semanal (current week). */
export function defaultWeeklyYearWeek(): { year: number; week: number } {
  const { year, week } = isoYearWeek();
  const options = new Set(auditOpsYearOptions());
  if (options.has(year)) return { year, week: clampIsoWeek(year, week) };
  const fallback = auditOpsYearOptions().at(-1) ?? MIN_REPORT_YEAR;
  return { year: fallback, week: clampIsoWeek(fallback, 1) };
}

export function weekOptionsForYear(year: number): number[] {
  const max = maxIsoWeek(year);
  return Array.from({ length: max }, (_, i) => i + 1);
}

/** Date range derived from selected years (or full solicitudes window). */
export function dateRangeFromSolicitudesYears(years: number[]): {
  dateFrom: string;
  dateTo: string;
} {
  const fallback = solicitudesYearOptions();
  const selected = (years.length ? years : fallback)
    .slice()
    .sort((a, b) => a - b);
  const minY = selected[0] ?? MIN_REPORT_YEAR;
  const maxY = selected[selected.length - 1] ?? MIN_REPORT_YEAR;
  return {
    dateFrom: toIsoDate(minY, 0, 1),
    dateTo: toIsoDate(maxY, 11, 31),
  };
}

export function defaultReportsFilters(): ReportsWorkspaceFilters {
  const dateFrom = defaultReportDateFrom();
  const weekly = defaultWeeklyYearWeek();
  return {
    tab: "ports_totals",
    dateFrom,
    dateTo: defaultReportDateTo(dateFrom),
    port: 0,
    withoutLta: false,
    paxBasis: "planned",
    years: [],
    week: weekly.week,
    tagIds: [],
    shippingLineGroupId: 0,
    shippingLineId: 0,
  };
}

export function parseReportsFilters(
  searchParams: URLSearchParams,
): ReportsWorkspaceFilters {
  const defaults = defaultReportsFilters();
  const tabRaw = searchParams.get("tab");
  const tab =
    tabRaw && TABS.has(tabRaw as ReportTab)
      ? (tabRaw as ReportTab)
      : defaults.tab;
  const dateFrom = searchParams.get("from")?.trim() || defaults.dateFrom;
  const dateTo = searchParams.get("to")?.trim() || defaultReportDateTo(dateFrom);
  const paxRaw = searchParams.get("pax");
  const paxBasis =
    paxRaw && PAX_BASES.has(paxRaw as ReportPaxBasis)
      ? (paxRaw as ReportPaxBasis)
      : defaults.paxBasis;
  const yearChoices =
    tab === "weekly_report" || tab === "booking_movements"
      ? new Set(auditOpsYearOptions())
      : tab === "solicitudes_port"
        ? new Set(solicitudesYearOptions())
        : new Set(yearsInReportRange(dateFrom, dateTo));
  let years = parseIdList(
    searchParams.get("year") || searchParams.get("years"),
  ).filter((y) => yearChoices.has(y));
  if (tab === "booking_movements") {
    const y = years[0] ?? defaultMovementYear();
    years = yearChoices.has(y) ? [y] : [defaultMovementYear()];
  }
  const weeklyDefault = defaultWeeklyYearWeek();
  if (tab === "weekly_report") {
    const y = years[0] ?? weeklyDefault.year;
    years = yearChoices.has(y) ? [y] : [weeklyDefault.year];
  }
  const yearForWeek = years[0] ?? weeklyDefault.year;
  const weekRaw = Number(searchParams.get("week"));
  const week =
    tab === "weekly_report"
      ? clampIsoWeek(
          yearForWeek,
          Number.isFinite(weekRaw) && weekRaw > 0
            ? weekRaw
            : yearForWeek === weeklyDefault.year
              ? weeklyDefault.week
              : 1,
        )
      : defaults.week;

  return {
    tab,
    dateFrom,
    dateTo,
    port: parseIntId(searchParams.get("port")),
    withoutLta: ["1", "true", "yes"].includes(
      (searchParams.get("without_lta") || "").toLowerCase(),
    ),
    paxBasis,
    years,
    week,
    tagIds: parseIdList(searchParams.get("tags")),
    shippingLineGroupId: parseIntId(searchParams.get("group")),
    shippingLineId: parseIntId(
      searchParams.get("shipping_line") ||
        searchParams.get("shipping_lines") ||
        searchParams.get("lines"),
    ),
  };
}

/** Compatible filters kept when switching report tabs. */
export function reportsFiltersForTab(
  current: ReportsWorkspaceFilters,
  tab: ReportTab,
): ReportsWorkspaceFilters {
  if (tab === "booking_movements") {
    const y = current.years[0] ?? defaultMovementYear();
    const allowed = new Set(auditOpsYearOptions());
    return {
      ...current,
      tab,
      years: [allowed.has(y) ? y : defaultMovementYear()],
      port: 0,
      tagIds: [],
      shippingLineGroupId: 0,
      shippingLineId: 0,
      withoutLta: false,
      paxBasis: "planned",
    };
  }
  if (tab === "weekly_report") {
    const weekly = defaultWeeklyYearWeek();
    const allowed = new Set(auditOpsYearOptions());
    const y = current.years[0] ?? weekly.year;
    const year = allowed.has(y) ? y : weekly.year;
    const week =
      current.tab === "weekly_report"
        ? clampIsoWeek(year, current.week)
        : year === weekly.year
          ? weekly.week
          : clampIsoWeek(year, current.week || 1);
    return {
      ...current,
      tab,
      years: [year],
      week,
      port: 0,
      tagIds: [],
      shippingLineGroupId: 0,
      shippingLineId: 0,
      // Keep Sin LTA when switching into weekly (Beto).
      paxBasis: "planned",
    };
  }
  return {
    ...current,
    tab,
  };
}

export function serializeReportsFilters(
  filters: ReportsWorkspaceFilters,
): URLSearchParams {
  const defaults = defaultReportsFilters();
  const sp = new URLSearchParams();
  if (filters.tab !== defaults.tab) sp.set("tab", filters.tab);
  // Year-driven tabs omit from/to in the URL.
  if (
    filters.tab !== "solicitudes_port" &&
    filters.tab !== "booking_movements" &&
    filters.tab !== "weekly_report"
  ) {
    if (filters.dateFrom !== defaults.dateFrom) {
      sp.set("from", filters.dateFrom);
    }
    if (filters.dateTo !== defaultReportDateTo(filters.dateFrom)) {
      sp.set("to", filters.dateTo);
    }
  }
  if (filters.port > 0) sp.set("port", String(filters.port));
  if (filters.withoutLta) sp.set("without_lta", "1");
  if (filters.paxBasis !== "planned") sp.set("pax", filters.paxBasis);
  if (
    (filters.tab === "booking_movements" || filters.tab === "weekly_report") &&
    filters.years[0]
  ) {
    sp.set("year", String(filters.years[0]));
  } else if (filters.years.length) {
    sp.set("years", filters.years.join(","));
  }
  if (filters.tab === "weekly_report" && filters.week > 0) {
    sp.set("week", String(filters.week));
  }
  if (filters.tagIds.length) sp.set("tags", filters.tagIds.join(","));
  if (filters.shippingLineGroupId > 0) {
    sp.set("group", String(filters.shippingLineGroupId));
  }
  if (filters.shippingLineId > 0) {
    sp.set("shipping_line", String(filters.shippingLineId));
  }
  return sp;
}

export const REPORT_PAX_BASIS_OPTIONS: {
  value: ReportPaxBasis;
  label: string;
}[] = [
  { value: "planned", label: "Planificado" },
  { value: "capacity", label: "Cap. máx." },
];
