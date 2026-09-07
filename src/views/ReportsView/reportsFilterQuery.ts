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
  | "booking_movements";

/** Basis for passenger totals when actual_pax is missing. */
export type ReportPaxBasis = "planned" | "capacity";

export type ReportsWorkspaceFilters = {
  tab: ReportTab;
  dateFrom: string;
  dateTo: string;
  port: number;
  withoutLta: boolean;
  paxBasis: ReportPaxBasis;
  /** Calendar years for resumen (multi) or movimientos (single). */
  years: number[];
  /** Booking tag IDs (OR). */
  tagIds: number[];
  /** Single shipping line — drives the carrier summary box. 0 = none. */
  shippingLineId: number;
};

const TABS = new Set<ReportTab>([
  "ports_totals",
  "port_carrier",
  "port_trends",
  "solicitudes_port",
  "booking_movements",
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

/** Default single year for Movimientos de bookings. */
export function defaultMovementYear(): number {
  const now = new Date().getFullYear();
  const options = solicitudesYearOptions();
  if (options.includes(now)) return now;
  return options[options.length - 1] ?? MIN_REPORT_YEAR;
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
  return {
    tab: "ports_totals",
    dateFrom,
    dateTo: defaultReportDateTo(dateFrom),
    port: 0,
    withoutLta: false,
    paxBasis: "planned",
    years: [],
    tagIds: [],
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
    tab === "solicitudes_port" || tab === "booking_movements"
      ? new Set(solicitudesYearOptions())
      : new Set(yearsInReportRange(dateFrom, dateTo));
  let years = parseIdList(
    searchParams.get("year") || searchParams.get("years"),
  ).filter((y) => yearChoices.has(y));
  if (tab === "booking_movements") {
    const y = years[0] ?? defaultMovementYear();
    years = yearChoices.has(y) ? [y] : [defaultMovementYear()];
  }
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
    tagIds: parseIdList(searchParams.get("tags")),
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
    const allowed = new Set(solicitudesYearOptions());
    return {
      ...current,
      tab,
      years: [allowed.has(y) ? y : defaultMovementYear()],
      port: 0,
      tagIds: [],
      shippingLineId: 0,
      withoutLta: false,
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
    filters.tab !== "booking_movements"
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
  if (filters.tab === "booking_movements" && filters.years[0]) {
    sp.set("year", String(filters.years[0]));
  } else if (filters.years.length) {
    sp.set("years", filters.years.join(","));
  }
  if (filters.tagIds.length) sp.set("tags", filters.tagIds.join(","));
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
