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

  ltaAgreementsPage: (page: number, search: string, pageSize: number) =>
    ["lta-agreements", "page", page, search, pageSize] as const,

  ltaAgreementDetail: (agreementId: number) =>
    ["lta-agreements", "detail", agreementId] as const,

  ltaLinkedBookings: (agreementId: number, pageSize = 12) =>
    ["lta-agreements", "bookings", agreementId, pageSize] as const,

  bookingsInfinite: (paramsKey: string) =>
    ["bookings", "infinite", paramsKey] as const,

  availabilityInfinite: (
    portId: number,
    dateFrom: string,
    dateTo: string,
    filtersKey = "",
  ) =>
    ["availability", "infinite", portId, dateFrom, dateTo, filtersKey] as const,

  vesselProximityInfinite: (
    vesselId: number,
    dateFrom: string,
    dateTo: string,
    filtersKey = "",
  ) =>
    [
      "vessel-proximity",
      "infinite",
      vesselId,
      dateFrom,
      dateTo,
      filtersKey,
    ] as const,

  dashboardStats: (paramsKey: string) =>
    ["dashboard", "stats", paramsKey] as const,

  report: (reportType: string, paramsKey: string) =>
    ["report", reportType, paramsKey] as const,

  reportInfinite: (reportType: string, paramsKey: string) =>
    ["report", "infinite", reportType, paramsKey] as const,

  calendarBookings: (paramsKey: string) =>
    ["calendar", "bookings", paramsKey] as const,

  wizardOccupancy: (
    portId: number,
    vesselId: number,
    from: string,
    to: string,
  ) => ["wizard", "occupancy", portId, vesselId, from, to] as const,

  wizardDayPeers: (portId: number, from: string, to: string) =>
    ["wizard", "day-peers", portId, from, to] as const,

  bookingActivityInfinite: (paramsKey: string) =>
    ["bookings", "activity", "infinite", paramsKey] as const,

  bookingActivityActors: ["bookings", "activity", "actors"] as const,

  userActivityInfinite: (paramsKey: string) =>
    ["users", "activity", "infinite", paramsKey] as const,

  userActivityActors: ["users", "activity", "actors"] as const,

  ltaActivityInfinite: (paramsKey: string) =>
    ["lta-agreements", "activity", "infinite", paramsKey] as const,

  ltaActivityActors: ["lta-agreements", "activity", "actors"] as const,

  portActivityInfinite: (paramsKey: string) =>
    ["ports", "activity", "infinite", paramsKey] as const,

  portActivityActors: ["ports", "activity", "actors"] as const,

  shippingLineActivityInfinite: (paramsKey: string) =>
    ["shipping-lines", "activity", "infinite", paramsKey] as const,

  shippingLineActivityActors: ["shipping-lines", "activity", "actors"] as const,
};

export type SwrKey = readonly unknown[];
