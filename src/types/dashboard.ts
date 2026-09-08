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
  ports_count: number;
};

export type DashboardNamedCount = {
  id: number;
  name: string;
  code?: string;
  bookings: number;
  planned_pax?: number;
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
};

export type DashboardWeekday = {
  weekday: number;
  label: string;
  count: number;
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

export type DashboardNext30Days = {
  date_from: string;
  date_to: string;
  total_confirmed: number;
  planned_pax: number;
  by_port: DashboardNext30PortRow[];
};

/** Monday–Sunday of the current week. */
export type DashboardCurrentWeek = DashboardNext30Days & {
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

export type DashboardStats = {
  years: number[];
  year: number | null;
  date_from: string;
  date_to: string;
  day_count: number;
  kpis: DashboardKpis;
  conflicts: DashboardConflicts;
  pending_confirm?: DashboardPendingConfirm;
  action_queue: DashboardActionQueue;
  next_30_days: DashboardNext30Days;
  current_week?: DashboardCurrentWeek;
  peak_pax_by_port?: DashboardPeakPaxPortRow[];
  yoy: DashboardYoy;
  occupancy_by_port: DashboardOccupancyPortRow[];
  by_shipping_line: DashboardNamedCount[];
  by_month: DashboardMonthRow[];
  top_vessels: DashboardVesselRow[];
  by_port: DashboardPortRow[];
  by_cancellation_reason: DashboardCancelReason[];
  by_weekday: DashboardWeekday[];
  status_breakdown: DashboardStatusSlice[];
};

export type DashboardCarrierFilter =
  | { type: "all" }
  | { type: "group"; id: number }
  | { type: "line"; id: number };
