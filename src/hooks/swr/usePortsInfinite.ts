"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import type { ApiListResponse } from "@/services/apiClient";
import { swrKeys } from "@/lib/swr/keys";
import { fetchPorts } from "@/services/catalogs/portService";
import type { Port } from "@/types/catalog";

const DEFAULT_PAGE_SIZE = 12;

export function usePortsInfinite(search: string, pageSize = DEFAULT_PAGE_SIZE) {
  const getKey = useCallback(
    (pageIndex: number, previousPageData: ApiListResponse<Port> | null) => {
      if (previousPageData && !previousPageData.next) return null;
      return [...swrKeys.portsInfinite(search, pageSize), pageIndex + 1] as const;
    },
    [search, pageSize],
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(getKey, (key) => {
      const page = key[key.length - 1] as number;
      return fetchPorts({ page, search, pageSize });
    });

  const ports = useMemo(
    () => (data ? data.flatMap((page) => page.results) : []),
    [data],
  );
  const totalCount = data?.[0]?.count ?? 0;
  const hasMore = ports.length < totalCount;
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
    ports,
    totalCount,
    hasMore,
    isLoading: isLoading && ports.length === 0,
    isValidating,
    loadingMore,
    error,
    loadMore,
    refresh,
    mutate,
  };
}
