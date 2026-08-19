"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import type { ApiListResponse } from "@/services/apiClient";
import {
  fetchBookings,
  type FetchBookingsParams,
} from "@/services/bookings/bookingService";
import { swrKeys } from "@/lib/swr/keys";
import type { BookingListItem } from "@/types/booking";

export type BookingsListFilterParams = Omit<FetchBookingsParams, "page">;

function listParamsKey(params: BookingsListFilterParams): string {
  return [
    params.search ?? "",
    (params.statuses ?? []).join(",") || (params.status ?? ""),
    params.has_conflict === true
      ? "1"
      : params.has_conflict === false
        ? "0"
        : "",
    params.conflict_severity ?? "",
    params.conflict_type ?? "",
    params.port ?? 0,
    params.position ?? 0,
    params.shipping_line ?? 0,
    params.vessel ?? 0,
    params.call_date_from ?? "",
    params.call_date_to ?? "",
    params.ordering ?? "",
    params.pageSize ?? 20,
  ].join("|");
}

export function useBookingsInfinite(
  params: BookingsListFilterParams,
  enabled = true,
) {
  const paramsKey = listParamsKey(params);
  const pageSize = params.pageSize ?? 20;

  const getKey = useCallback(
    (pageIndex: number, previousPageData: ApiListResponse<BookingListItem> | null) => {
      if (!enabled) return null;
      if (previousPageData && !previousPageData.next) return null;
      return [...swrKeys.bookingsInfinite(paramsKey), pageIndex + 1] as const;
    },
    [enabled, paramsKey],
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(getKey, (key) => {
      const page = key[key.length - 1] as number;
      return fetchBookings({ ...params, page, pageSize });
    });

  const bookings = useMemo(
    () => (data ? data.flatMap((page) => page.results) : []),
    [data],
  );
  const totalCount = data?.[0]?.count ?? 0;
  const hasMore = bookings.length < totalCount;
  const loadingMore = isValidating && size > 1 && hasMore;

  const loadMore = useCallback(() => {
    if (!enabled || loadingMore || !hasMore || isLoading) return;
    void setSize(size + 1);
  }, [enabled, loadingMore, hasMore, isLoading, setSize, size]);

  const refresh = useCallback(async () => {
    await setSize(1);
    await mutate();
  }, [mutate, setSize]);

  return {
    bookings,
    totalCount,
    hasMore,
    isLoading: enabled && isLoading && bookings.length === 0,
    isValidating,
    loadingMore,
    error,
    loadMore,
    refresh,
    mutate,
  };
}
