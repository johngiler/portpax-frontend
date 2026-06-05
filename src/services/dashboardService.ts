/**
 * Dashboard metrics — stubs until Booking/catalog endpoints are wired.
 */
import type {
  BerthTimeline,
  DockingStats,
  OperationsAlerts,
  OperationsToday,
  PaginatedResponse,
  RevenueEstimate,
  Scale,
  ScalesByMonth,
  ScalesByYear,
  ScalesListParams,
} from "@/types/dashboardMetrics";
import type { GlobalSearchResult } from "@/types/search";

const EMPTY_STATS: DockingStats = {
  shipping_lines: 0,
  ports: 0,
  berths: 0,
  ships: 0,
  scales: 0,
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDockingStats(): Promise<DockingStats> {
  return EMPTY_STATS;
}

export async function getOperationsToday(): Promise<OperationsToday> {
  return {
    date: todayIso(),
    ships_in_port_today: 0,
    scales_today: 0,
    pax_today: 0,
    berths_occupied_today: 0,
    total_berths: 0,
    capacity_occupied_pct: 0,
  };
}

export async function getScales(_params?: ScalesListParams): Promise<PaginatedResponse<Scale>> {
  return { count: 0, next: null, previous: null, results: [] };
}

export async function getScalesByMonth(): Promise<ScalesByMonth[]> {
  return [];
}

export async function getScalesByYear(): Promise<ScalesByYear[]> {
  return [];
}

export async function getRevenueEstimate(): Promise<RevenueEstimate> {
  return { total_estimated_revenue_usd: 0, by_year: [], by_month: [] };
}

export async function getBerthTimeline(_params?: {
  date_from?: string;
  date_to?: string;
}): Promise<BerthTimeline> {
  return { dates: [], berths: [] };
}

export async function getOperationsAlerts(_params?: { date?: string }): Promise<OperationsAlerts> {
  return { date: todayIso(), berth_conflicts: [], passenger_overflows: [] };
}

export async function globalSearch(q: string): Promise<GlobalSearchResult> {
  if (q.trim().length < 2) {
    return { shipping_lines: [], ports: [], ships: [], scales: [] };
  }
  return { shipping_lines: [], ports: [], ships: [], scales: [] };
}
