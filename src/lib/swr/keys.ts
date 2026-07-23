/** Stable SWR cache keys (tuple factories). */

export const swrKeys = {
  navCounts: ["nav-counts"] as const,

  portsPage: (page: number, search: string, pageSize: number) =>
    ["ports", "page", page, search, pageSize] as const,

  portsInfinite: (search: string, pageSize: number) =>
    ["ports", "infinite", search, pageSize] as const,

  portsCatalog: (pageSize = 100) => ["ports", "catalog", pageSize] as const,

  shippingLinesPage: (
    page: number,
    search: string,
    group: number,
    pageSize: number,
  ) => ["shipping-lines", "page", page, search, group, pageSize] as const,

  shippingLinesInfinite: (search: string, group: number, pageSize: number) =>
    ["shipping-lines", "infinite", search, group, pageSize] as const,

  shippingLinesCatalog: (pageSize = 100) =>
    ["shipping-lines", "catalog", pageSize] as const,

  shippingLineGroups: ["shipping-line-groups"] as const,

  vesselsCatalog: (shippingLineId?: number) =>
    ["vessels", "catalog", shippingLineId ?? 0] as const,

  usersPage: (page: number, search: string, pageSize: number) =>
    ["users", "page", page, search, pageSize] as const,

  bookingsInfinite: (paramsKey: string) =>
    ["bookings", "infinite", paramsKey] as const,

  dashboardStats: (paramsKey: string) =>
    ["dashboard", "stats", paramsKey] as const,

  report: (reportType: string, paramsKey: string) =>
    ["report", reportType, paramsKey] as const,

  calendarBookings: (paramsKey: string) =>
    ["calendar", "bookings", paramsKey] as const,
};

export type SwrKey = readonly unknown[];
