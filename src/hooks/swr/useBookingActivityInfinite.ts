"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import {
  bookingActivityFilterToApiParams,
  type BookingActivityFilterValue,
} from "@/lib/bookingActivityTaxonomy";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchBookingActivity,
  type BookingActivityResponse,
} from "@/services/bookings/bookingActivityService";

export type BookingActivityFilterParams = {
  typeFilter?: BookingActivityFilterValue;
  dateFrom?: string;
  dateTo?: string;
  /** User id as string, or "system". Empty = all. */
  actor?: string;
  bookingId?: number;
  pageSize?: number;
};

function activityParamsKey(params: BookingActivityFilterParams): string {
  return [
    params.typeFilter ?? "",
    params.dateFrom ?? "",
    params.dateTo ?? "",
    params.actor ?? "",
    params.bookingId ?? 0,
    params.pageSize ?? 20,
  ].join("|");
}

export function useBookingActivityInfinite(
  params: BookingActivityFilterParams,
  enabled = true,
) {
  const paramsKey = activityParamsKey(params);
  const pageSize = params.pageSize ?? 20;
  const typeFilter = params.typeFilter ?? "";
  const apiFilters = useMemo(
    () => bookingActivityFilterToApiParams(typeFilter),
    [typeFilter],
  );
  const dateFrom = params.dateFrom?.trim() || undefined;
  const dateTo = params.dateTo?.trim() || undefined;
  const actor = params.actor?.trim() || undefined;
  const bookingId = params.bookingId && params.bookingId > 0 ? params.bookingId : undefined;

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: BookingActivityResponse | null,
    ) => {
      if (!enabled) return null;
      if (previousPageData) {
        const loaded = previousPageData.page * previousPageData.page_size;
        if (loaded >= previousPageData.count) return null;
        if (previousPageData.results.length === 0) return null;
      }
      return [
        ...swrKeys.bookingActivityInfinite(paramsKey),
        pageIndex + 1,
      ] as const;
    },
    [enabled, paramsKey],
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(getKey, (key) => {
      const page = key[key.length - 1] as number;
      return fetchBookingActivity({
        page,
        page_size: pageSize,
        date_from: dateFrom,
        date_to: dateTo,
        actor,
        booking_id: bookingId,
        ...(bookingId ? {} : apiFilters),
      });
    });

  const items = useMemo(
    () => (data ? data.flatMap((page) => page.results) : []),
    [data],
  );
  const totalCount = data?.[0]?.count ?? 0;
  const hasMore = items.length < totalCount;
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
    items,
    totalCount,
    hasMore,
    isLoading: enabled && isLoading && items.length === 0,
    isValidating,
    loadingMore,
    error,
    loadMore,
    refresh,
    mutate,
  };
}
