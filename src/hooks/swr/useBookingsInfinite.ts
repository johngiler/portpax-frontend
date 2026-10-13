"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import type { ApiListResponse } from "@/services/apiClient";
import {
  fetchAllBookings,
  fetchBookings,
  type FetchBookingsParams,
} from "@/services/bookings/bookingService";
import { swrInfiniteDefaults } from "@/lib/swr/infiniteDefaults";
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
    params.first_arrival === true
      ? "1"
      : params.first_arrival === false
        ? "0"
        : "",
    params.cancellation_reason ?? "",
    params.port ?? 0,
    (params.ports ?? []).join(","),
    params.position ?? 0,
    (params.shipping_lines ?? []).join(",") || params.shipping_line || 0,
    (params.shipping_line_groups ?? []).join(",") ||
      params.shipping_line_group ||
      0,
    params.vessel ?? 0,
    (params.size_categories ?? []).join(","),
    (params.tags ?? []).join(","),
    params.call_date_from ?? "",
    params.call_date_to ?? "",
    (params.ids ?? []).join(","),
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
    useSWRInfinite(
      getKey,
      (key) => {
        const page = key[key.length - 1] as number;
        return fetchBookings({ ...params, page, pageSize });
      },
      swrInfiniteDefaults,
    );

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

  /**
   * Load every page matching the current filters into the infinite cache
   * (for “Seleccionar todas”). Returns the full list.
   */
  const loadAll = useCallback(async (): Promise<BookingListItem[]> => {
    if (!enabled) return bookings;
    if (!hasMore && bookings.length > 0) return bookings;
    const all = await fetchAllBookings({ ...params, pageSize: 100 });
    const pages: ApiListResponse<BookingListItem>[] = [];
    for (let i = 0; i < all.length; i += pageSize) {
      const chunk = all.slice(i, i + pageSize);
      const pageIndex = pages.length;
      pages.push({
        count: all.length,
        next:
          i + pageSize < all.length
            ? `page=${pageIndex + 2}`
            : null,
        previous: pageIndex > 0 ? `page=${pageIndex}` : null,
        results: chunk,
      });
    }
    if (pages.length === 0) {
      pages.push({
        count: 0,
        next: null,
        previous: null,
        results: [],
      });
    }
    await mutate(pages, { revalidate: false });
    await setSize(pages.length);
    return all;
  }, [enabled, hasMore, bookings, params, pageSize, mutate, setSize]);

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
    loadAll,
    refresh,
    mutate,
  };
}
