"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import type { ApiListResponse } from "@/services/apiClient";
import { swrKeys } from "@/lib/swr/keys";
import { fetchBookings } from "@/services/bookings/bookingService";
import type { BookingListItem } from "@/types/booking";

const DEFAULT_PAGE_SIZE = 12;

export function useLtaLinkedBookings(
  agreementId: number,
  enabled: boolean,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: ApiListResponse<BookingListItem> | null,
    ) => {
      if (!enabled) return null;
      if (previousPageData && !previousPageData.next) return null;
      return [
        ...swrKeys.ltaLinkedBookings(agreementId, pageSize),
        pageIndex + 1,
      ] as const;
    },
    [agreementId, enabled, pageSize],
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(getKey, (key) => {
      const page = key[key.length - 1] as number;
      return fetchBookings({
        long_term_agreement: agreementId,
        page,
        pageSize,
        ordering: "call_date",
      });
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

  return {
    bookings,
    totalCount,
    hasMore,
    isLoading: Boolean(enabled) && isLoading && !data,
    loadingMore,
    isValidating,
    error,
    loadMore,
    mutate,
  };
}
