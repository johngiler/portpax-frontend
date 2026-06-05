export type DockingStats = {
  shipping_lines: number;
  ports: number;
  berths: number;
  ships: number;
  scales: number;
};

export type OperationsToday = {
  date: string;
  ships_in_port_today: number;
  scales_today: number;
  pax_today: number;
  berths_occupied_today: number;
  total_berths: number;
  capacity_occupied_pct: number;
};

export type Scale = {
  id: number;
  ship: number;
  ship_name: string;
  shipping_line_name?: string;
  port: number;
  port_name: string;
  berth: number | null;
  berth_name: string | null;
  date: string;
  pax_count: number | null;
  crew_count?: number | null;
};

export type ScalesListParams = {
  page?: number;
  page_size?: number;
  date_after?: string;
  date_before?: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ScalesByMonth = {
  year: number;
  month: number;
  month_label: string;
  scales: number;
  pax_total: number;
};

export type ScalesByYear = {
  year: number;
  scales: number;
  pax_total: number;
};

export type RevenueEstimate = {
  total_estimated_revenue_usd: number;
  by_year: { year: number; estimated_revenue_usd: number }[];
  by_month: { year: number; month: number; month_label: string; estimated_revenue_usd: number }[];
};

export type BerthTimelineDay = {
  date: string;
  scales: { scale_id: number; ship_name: string; pax_count: number | null }[];
  has_conflict: boolean;
};

export type BerthTimelineBerth = {
  berth_id: number;
  berth_name: string;
  port_name: string;
  days: BerthTimelineDay[];
};

export type BerthTimeline = {
  dates: string[];
  berths: BerthTimelineBerth[];
};

export type OperationsAlerts = {
  date: string;
  berth_conflicts: {
    date: string;
    berth_id: number;
    berth_name: string;
    port_name: string;
    scales: { scale_id: number; ship_name: string }[];
  }[];
  passenger_overflows: {
    scale_id: number;
    ship_name: string;
    port_name: string;
    berth_name: string;
    date: string;
    pax_count: number;
    capacity: number;
    capacity_type: "ship" | "berth";
  }[];
};
