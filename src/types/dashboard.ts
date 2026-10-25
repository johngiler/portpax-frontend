export type DashboardKpis = {
  occupancy_pct: number;
  capacity_slot_days: number;
  occupied_slot_days: number;
  position_count: number;
  total_bookings: number;
  nr: number;
  h: number;
  co: number;
  r: number;
  c: number;
  planned_pax: number;
  actual_pax: number;
  avg_pax_per_call?: number;
  ports_count: number;
  /** Bookings with first_arrival=True in the period (CO/CL/R debuts). */
  first_arrivals?: number;
  /** Present when the date range spans more than one calendar year. */
  by_year?: DashboardKpiYearRow[];
};

export type DashboardKpiYearRow = {
  year: number;
  bookings: number;
  calls: number;
  planned_pax: number;
  avg_pax_per_call: number;
  occupancy_pct?: number;
  occupied_slot_days?: number;
  capacity_slot_days?: number;
  first_arrivals?: number;
  conflicts?: number;
  bookings_yoy_pct: number | null;
  pax_yoy_pct: number | null;
  occupancy_yoy_pct?: number | null;
  avg_pax_yoy_pct?: number | null;
};

export type DashboardNamedCount = {
  id: number;
  name: string;
  code?: string;
  bookings: number;
  planned_pax?: number;
  avg_planned_pax?: number;
};

export type DashboardMonthRow = {
  month: number;
  nr: number;
  h: number;
  co: number;
  r: number;
  c: number;
  total: number;
};

export type DashboardVesselRow = {
  id: number;
  name: string;
  shipping_line_name: string;
  bookings: number;
  planned_pax: number;
};

export type DashboardPortRow = {
  id: number;
  name: string;
  code: string;
  bookings: number;
};

export type DashboardCancelReason = {
  reason: string;
  label: string;
  count: number;
  planned_pax?: number;
  port_name?: string | null;
  shipping_line_name?: string | null;
};

export type DashboardWeekday = {
  weekday: number;
  label: string;
  count: number;
  days_in_period?: number;
  days_used?: number;
};

export type DashboardStatusSlice = {
  status: string;
  label: string;
  count: number;
};

export type DashboardYoyMetric = {
  current: number;
  prior: number;
  delta_pct: number | null;
};

export type DashboardYoy = {
  prior_date_from: string;
  prior_date_to: string;
  calls: DashboardYoyMetric;
  planned_pax: DashboardYoyMetric;
  avg_pax_per_call?: DashboardYoyMetric;
  occupancy: DashboardYoyMetric;
};

export type DashboardActionPortRow = {
  port_id: number;
  name: string;
  code: string;
  holds: number;
  new_requests: number;
};

export type DashboardActionQueue = {
  as_of: string;
  holds: number;
  new_requests: number;
  by_port: DashboardActionPortRow[];
};

export type DashboardPendingConfirmPortRow = {
  port_id: number;
  name: string;
  code: string;
  logo?: string | null;
  holds: number;
  lta: number;
  total: number;
};

export type DashboardPendingConfirm = {
  holds: number;
  lta: number;
  total: number;
  hold_since: string | null;
  lta_since: string | null;
  by_port: DashboardPendingConfirmPortRow[];
};

export type DashboardPeakPaxPortRow = {
  port_id: number;
  name: string;
  code: string;
  logo?: string | null;
  call_date: string;
  calls: number;
  passengers: number;
  base_pax: "real" | "planificado";
};

export type DashboardConflictTypeRow = {
  type: string;
  label: string;
  count: number;
};

export type DashboardConflicts = {
  total: number;
  by_type: DashboardConflictTypeRow[];
};

export type DashboardNext30PortRow = {
  port_id: number;
  name: string;
  code: string;
  calls: number;
  planned_pax: number;
};

/** Monday–Sunday of the current week. */
export type DashboardCurrentWeek = {
  date_from: string;
  date_to: string;
  total_confirmed: number;
  planned_pax: number;
  by_port: DashboardNext30PortRow[];
  iso_week?: number;
};

export type DashboardOccupancyPortRow = {
  port_id: number;
  name: string;
  code: string;
  position_count: number;
  capacity_slot_days: number;
  occupied_slot_days: number;
  occupancy_pct: number;
};

export type DashboardPortMonthPoint = {
  month: number;
  calls: number;
  passengers: number;
};

export type DashboardPortMonthSeries = {
  port_id: number;
  name: string;
  code: string;
  months: DashboardPortMonthPoint[];
};

export type DashboardByPortMonth = {
  ports: DashboardPortMonthSeries[];
};

export type DashboardOccupancyTrendSlice = {
  year?: number;
  month?: number;
  season?: string;
  label?: string;
  date_from: string;
  date_to: string;
  by_port: DashboardOccupancyPortRow[];
};

export type DashboardOccupancyDockRow = {
  position_id: number;
  port_id: number;
  port_name: string;
  code: string;
  capacity_slot_days: number;
  occupied_slot_days: number;
  occupancy_pct: number;
};

export type DashboardOccupancyTrends = {
  by_month: DashboardOccupancyTrendSlice[];
  by_season: DashboardOccupancyTrendSlice[];
  by_dock: DashboardOccupancyDockRow[];
};

export type DashboardStats = {
  years: number[];
  year: number | null;
  date_from: string;
  date_to: string;
  day_count: number;
  without_lta?: boolean;
  pax_basis?: "planned" | "capacity";
  kpis: DashboardKpis;
  conflicts: DashboardConflicts;
  pending_confirm?: DashboardPendingConfirm;
  action_queue: DashboardActionQueue;
  current_week?: DashboardCurrentWeek;
  peak_pax_by_port?: DashboardPeakPaxPortRow[];
  yoy: DashboardYoy;
  occupancy_by_port: DashboardOccupancyPortRow[];
  occupancy_trends?: DashboardOccupancyTrends;
  by_port_month?: DashboardByPortMonth;
  by_shipping_line: DashboardNamedCount[];
  by_month: DashboardMonthRow[];
  top_vessels: DashboardVesselRow[];
  by_port: DashboardPortRow[];
  /** First arrivals (debut vessel×port) counted per port in the period. */
  first_arrivals_by_port?: DashboardPortRow[];
  by_cancellation_reason: DashboardCancelReason[];
  by_weekday: DashboardWeekday[];
  status_breakdown: DashboardStatusSlice[];
};

/** Empty arrays = all carriers. Lines win over groups when both are set. */
export type DashboardCarrierFilter = {
  groupIds: number[];
  lineIds: number[];
};

export const EMPTY_DASHBOARD_CARRIER: DashboardCarrierFilter = {
  groupIds: [],
  lineIds: [],
};

export function dashboardCarrierIsAll(filter: DashboardCarrierFilter): boolean {
  return filter.groupIds.length === 0 && filter.lineIds.length === 0;
}
