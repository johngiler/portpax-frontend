"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { fetchDashboardStats } from "@/services/bookings/bookingService";
import type { DashboardCarrierFilter, DashboardStats } from "@/types/dashboard";

export type DashboardStatsParams = {
  dateFrom: string;
  dateTo: string;
  portIds: number[];
  carrier: DashboardCarrierFilter;
  withoutLta?: boolean;
  paxBasis?: "planned" | "capacity";
};

function sortedIdsKey(ids: number[]): string {
  return [...ids].sort((x, y) => x - y).join(",");
}

function statsParamsKey(params: DashboardStatsParams): string {
  const portsPart = sortedIdsKey(params.portIds) || "0";
  const groupsPart = sortedIdsKey(params.carrier.groupIds) || "0";
  const linesPart = sortedIdsKey(params.carrier.lineIds) || "0";
  return [
    params.dateFrom,
    params.dateTo,
    portsPart,
    `g:${groupsPart}`,
    `l:${linesPart}`,
    params.withoutLta ? "1" : "0",
    params.paxBasis ?? "planned",
  ].join("|");
}

export function useDashboardStats(params: DashboardStatsParams, enabled = true) {
  const key = statsParamsKey(params);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled && params.dateFrom && params.dateTo
      ? swrKeys.dashboardStats(key)
      : null,
    () =>
      fetchDashboardStats({
        date_from: params.dateFrom,
        date_to: params.dateTo,
        ports: params.portIds.length > 0 ? params.portIds : undefined,
        shipping_lines:
          params.carrier.lineIds.length > 0
            ? params.carrier.lineIds
            : undefined,
        shipping_line_groups:
          params.carrier.lineIds.length === 0 &&
          params.carrier.groupIds.length > 0
            ? params.carrier.groupIds
            : undefined,
        without_lta: params.withoutLta || undefined,
        pax_basis: params.paxBasis,
      }),
    // Avoid showing previous filter totals while the new request is in flight.
    { keepPreviousData: false },
  );

  return {
    stats: (data ?? null) as DashboardStats | null,
    isLoading: Boolean(isLoading || (isValidating && !data)),
    isValidating,
    error,
    mutate,
  };
}
