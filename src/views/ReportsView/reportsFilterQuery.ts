import {
  defaultReportDateFrom,
  defaultReportDateTo,
} from "./reportsFilterDefaults";

export type ReportTab = "ports_totals" | "port_carrier" | "port_trends";

/** Basis for passenger totals when actual_pax is missing. */
export type ReportPaxBasis = "planned" | "capacity";

export type ReportsWorkspaceFilters = {
  tab: ReportTab;
  dateFrom: string;
  dateTo: string;
  port: number;
  withoutLta: boolean;
  paxBasis: ReportPaxBasis;
};

const TABS = new Set<ReportTab>([
  "ports_totals",
  "port_carrier",
  "port_trends",
]);
const PAX_BASES = new Set<ReportPaxBasis>(["planned", "capacity"]);

function parseIntId(raw: string | null): number {
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
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
  return {
    tab,
    dateFrom,
    dateTo,
    port: parseIntId(searchParams.get("port")),
    withoutLta: ["1", "true", "yes"].includes(
      (searchParams.get("without_lta") || "").toLowerCase(),
    ),
    paxBasis,
  };
}

/** Compatible filters kept when switching report tabs. */
export function reportsFiltersForTab(
  current: ReportsWorkspaceFilters,
  tab: ReportTab,
): ReportsWorkspaceFilters {
  return {
    ...current,
    tab,
    // Port only applies to carrier / trends; keep value for round-trip.
    port: tab === "ports_totals" ? current.port : current.port,
  };
}

export function serializeReportsFilters(
  filters: ReportsWorkspaceFilters,
): URLSearchParams {
  const defaults = defaultReportsFilters();
  const sp = new URLSearchParams();
  if (filters.tab !== defaults.tab) sp.set("tab", filters.tab);
  if (filters.dateFrom !== defaults.dateFrom) sp.set("from", filters.dateFrom);
  if (filters.dateTo !== defaultReportDateTo(filters.dateFrom)) {
    sp.set("to", filters.dateTo);
  }
  if (filters.port > 0) sp.set("port", String(filters.port));
  if (filters.withoutLta) sp.set("without_lta", "1");
  if (filters.paxBasis !== "planned") sp.set("pax", filters.paxBasis);
  return sp;
}

export const REPORT_PAX_BASIS_OPTIONS: {
  value: ReportPaxBasis;
  label: string;
}[] = [
  { value: "planned", label: "Planificado" },
  { value: "capacity", label: "Cap. máx." },
];
