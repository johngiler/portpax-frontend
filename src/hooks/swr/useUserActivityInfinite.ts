"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import {
  userActivityFilterToApiParams,
  type UserActivityFilterValue,
} from "@/lib/userActivityTaxonomy";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchUserActivity,
  type UserActivityResponse,
} from "@/services/accounts/userActivityService";
import type { UserRole } from "@/types/accounts";

export type UserActivityFilterParams = {
  typeFilter?: UserActivityFilterValue;
  role?: UserRole | "";
  isActive?: "" | "true" | "false";
  dateFrom?: string;
  dateTo?: string;
  actor?: string;
  userId?: number;
  pageSize?: number;
};

function activityParamsKey(params: UserActivityFilterParams): string {
  return [
    params.typeFilter ?? "",
    params.role ?? "",
    params.isActive ?? "",
    params.dateFrom ?? "",
    params.dateTo ?? "",
    params.actor ?? "",
    params.userId ?? 0,
    params.pageSize ?? 20,
  ].join("|");
}

export function useUserActivityInfinite(
  params: UserActivityFilterParams,
  enabled = true,
) {
  const paramsKey = activityParamsKey(params);
  const pageSize = params.pageSize ?? 20;
  const typeFilter = params.typeFilter ?? "";
  const apiFilters = useMemo(
    () => userActivityFilterToApiParams(typeFilter),
    [typeFilter],
  );
  const role = params.role || undefined;
  const isActive = params.isActive || undefined;
  const dateFrom = params.dateFrom?.trim() || undefined;
  const dateTo = params.dateTo?.trim() || undefined;
  const actor = params.actor?.trim() || undefined;
  const userId = params.userId && params.userId > 0 ? params.userId : undefined;

  const getKey = useCallback(
    (pageIndex: number, previousPageData: UserActivityResponse | null) => {
      if (!enabled) return null;
      if (previousPageData) {
        const loaded = previousPageData.page * previousPageData.page_size;
        if (loaded >= previousPageData.count) return null;
        if (previousPageData.results.length === 0) return null;
      }
      return [...swrKeys.userActivityInfinite(paramsKey), pageIndex + 1] as const;
    },
    [enabled, paramsKey],
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(getKey, (key) => {
      const page = key[key.length - 1] as number;
      return fetchUserActivity({
        page,
        page_size: pageSize,
        ...apiFilters,
        role,
        is_active: isActive,
        date_from: dateFrom,
        date_to: dateTo,
        actor,
        user_id: userId,
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
