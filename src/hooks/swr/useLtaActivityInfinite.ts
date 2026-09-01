"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import {
  ltaActivityFilterToApiParams,
  type LtaActivityFilterValue,
} from "@/lib/ltaActivityTaxonomy";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchLtaActivity,
  type LtaActivityResponse,
} from "@/services/bookings/ltaActivityService";

export type LtaActivityFilterParams = {
  typeFilter?: LtaActivityFilterValue;
  dateFrom?: string;
  dateTo?: string;
  actor?: string;
  agreementId?: number;
  pageSize?: number;
};

function activityParamsKey(params: LtaActivityFilterParams): string {
  return [
    params.typeFilter ?? "",
    params.dateFrom ?? "",
    params.dateTo ?? "",
    params.actor ?? "",
    params.agreementId ?? 0,
    params.pageSize ?? 20,
  ].join("|");
}

export function useLtaActivityInfinite(
  params: LtaActivityFilterParams,
  enabled = true,
) {
  const paramsKey = activityParamsKey(params);
  const pageSize = params.pageSize ?? 20;
  const typeFilter = params.typeFilter ?? "";
  const apiFilters = useMemo(
    () => ltaActivityFilterToApiParams(typeFilter),
    [typeFilter],
  );
  const dateFrom = params.dateFrom?.trim() || undefined;
  const dateTo = params.dateTo?.trim() || undefined;
  const actor = params.actor?.trim() || undefined;
  const agreementId =
    params.agreementId && params.agreementId > 0 ? params.agreementId : undefined;

  const getKey = useCallback(
    (pageIndex: number, previousPageData: LtaActivityResponse | null) => {
      if (!enabled) return null;
      if (previousPageData) {
        const loaded = previousPageData.page * previousPageData.page_size;
        if (loaded >= previousPageData.count) return null;
        if (previousPageData.results.length === 0) return null;
      }
      return [...swrKeys.ltaActivityInfinite(paramsKey), pageIndex + 1] as const;
    },
    [enabled, paramsKey],
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(getKey, (key) => {
      const page = key[key.length - 1] as number;
      return fetchLtaActivity({
        page,
        page_size: pageSize,
        date_from: dateFrom,
        date_to: dateTo,
        actor,
        agreement_id: agreementId,
        ...(agreementId ? {} : apiFilters),
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
