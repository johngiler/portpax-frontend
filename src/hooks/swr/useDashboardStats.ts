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
};

function statsParamsKey(params: DashboardStatsParams): string {
  const carrierPart =
    params.carrier.type === "all"
      ? "all"
      : `${params.carrier.type}:${params.carrier.id}`;
  const portsPart = [...params.portIds].sort((a, b) => a - b).join(",");
  return [params.dateFrom, params.dateTo, portsPart || "0", carrierPart].join(
    "|",
  );
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
        shipping_line:
          params.carrier.type === "line" ? params.carrier.id : undefined,
        shipping_line_group:
          params.carrier.type === "group" ? params.carrier.id : undefined,
      }),
  );

  return {
    stats: (data ?? null) as DashboardStats | null,
    isLoading: isLoading && !data,
    isValidating,
    error,
    mutate,
  };
}
