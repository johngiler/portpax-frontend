"use client";

import useSWR from "swr";
import {
  fetchBookings,
  type FetchBookingsParams,
} from "@/services/bookings/bookingService";

export type FirstMatchProbeFilters = Omit<
  FetchBookingsParams,
  "page" | "pageSize" | "ordering" | "call_date_from" | "call_date_to"
>;

function probeKey(filters: FirstMatchProbeFilters): string {
  return [
    filters.search ?? "",
    filters.port ?? 0,
    (filters.ports ?? []).join(","),
    filters.position ?? 0,
    filters.shipping_line ?? 0,
    filters.vessel ?? 0,
    (filters.statuses ?? []).join(","),
    filters.has_conflict === true
      ? "1"
      : filters.has_conflict === false
        ? "0"
        : "",
    filters.conflict_severity ?? "",
    filters.conflict_type ?? "",
    (filters.call_dates ?? []).join(","),
  ].join("|");
}

/**
 * Earliest call_date matching sidebar filters (ignores the current visual
 * date window so we can hint “results from …” outside the open month/range).
 */
export function useFirstMatchingCallDate(
  filters: FirstMatchProbeFilters,
  enabled: boolean,
) {
  const key = probeKey(filters);
  const { data, isLoading } = useSWR(
    enabled ? (["bookings-first-match", key] as const) : null,
    async () => {
      const res = await fetchBookings({
        ...filters,
        ordering: "call_date",
        page: 1,
        pageSize: 1,
      });
      return res.results[0]?.call_date ?? null;
    },
    { revalidateOnFocus: false, dedupingInterval: 5000 },
  );
  return { firstDate: data ?? null, isLoading };
}
