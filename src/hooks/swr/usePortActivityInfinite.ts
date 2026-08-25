"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchPortActivity,
  type PortActivityKind,
  type PortActivityResponse,
} from "@/services/catalogs/portActivityService";

export type PortActivityFilterParams = {
  kind?: PortActivityKind;
  dateFrom?: string;
  dateTo?: string;
  actor?: string;
  pageSize?: number;
};

function activityParamsKey(params: PortActivityFilterParams): string {
  return [
    params.kind ?? "all",
    params.dateFrom ?? "",
    params.dateTo ?? "",
    params.actor ?? "",
    params.pageSize ?? 20,
  ].join("|");
}

export function usePortActivityInfinite(
  params: PortActivityFilterParams,
  enabled = true,
) {
  const paramsKey = activityParamsKey(params);
  const pageSize = params.pageSize ?? 20;
  const kind = params.kind ?? "all";
  const dateFrom = params.dateFrom?.trim() || undefined;
  const dateTo = params.dateTo?.trim() || undefined;
  const actor = params.actor?.trim() || undefined;

  const getKey = useCallback(
    (pageIndex: number, previousPageData: PortActivityResponse | null) => {
      if (!enabled) return null;
      if (previousPageData) {
        const loaded = previousPageData.page * previousPageData.page_size;
        if (loaded >= previousPageData.count) return null;
        if (previousPageData.results.length === 0) return null;
      }
      return [...swrKeys.portActivityInfinite(paramsKey), pageIndex + 1] as const;
    },
    [enabled, paramsKey],
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(getKey, (key) => {
      const page = key[key.length - 1] as number;
      return fetchPortActivity({
        page,
        page_size: pageSize,
        kind,
        date_from: dateFrom,
        date_to: dateTo,
        actor,
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

  return {
    items,
    totalCount,
    hasMore,
    isLoading: enabled && isLoading && items.length === 0,
    isValidating,
    loadingMore,
    error,
    loadMore,
    mutate,
  };
}
