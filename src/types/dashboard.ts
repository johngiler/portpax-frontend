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

export type DashboardStats = {
  years: number[];
  year: number | null;
  date_from: string;
  date_to: string;
  day_count: number;
  kpis: DashboardKpis;
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
