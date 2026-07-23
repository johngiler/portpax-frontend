"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import type { ApiListResponse } from "@/services/apiClient";
import { swrKeys } from "@/lib/swr/keys";
import { fetchShippingLines } from "@/services/catalogs/shippingLineService";
import type { ShippingLine } from "@/types/cruise";

const DEFAULT_PAGE_SIZE = 12;

export function useShippingLinesInfinite(
  search: string,
  groupId: number,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: ApiListResponse<ShippingLine> | null,
    ) => {
      if (previousPageData && !previousPageData.next) return null;
      return [
        ...swrKeys.shippingLinesInfinite(search, groupId, pageSize),
        pageIndex + 1,
      ] as const;
    },
    [search, groupId, pageSize],
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(getKey, (key) => {
      const page = key[key.length - 1] as number;
      return fetchShippingLines({
        page,
        search,
        group: groupId > 0 ? groupId : undefined,
        pageSize,
      });
    });

  const lines = useMemo(
    () => (data ? data.flatMap((page) => page.results) : []),
    [data],
  );
  const totalCount = data?.[0]?.count ?? 0;
  const hasMore = lines.length < totalCount;
  const loadingMore = isValidating && size > 1 && hasMore;

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || isLoading) return;
    void setSize(size + 1);
  }, [loadingMore, hasMore, isLoading, setSize, size]);

  const refresh = useCallback(async () => {
    await setSize(1);
    await mutate();
  }, [mutate, setSize]);

  return {
    lines,
    totalCount,
    hasMore,
    isLoading: isLoading && lines.length === 0,
    isValidating,
    loadingMore,
    error,
    loadMore,
    refresh,
    mutate,
  };
}
