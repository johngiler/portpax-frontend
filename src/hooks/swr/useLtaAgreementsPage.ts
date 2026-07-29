"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { fetchLongTermAgreements } from "@/services/bookings/ltaService";

const DEFAULT_PAGE_SIZE = 20;

export function useLtaAgreementsPage(
  page: number,
  search: string,
  enabled = true,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? swrKeys.ltaAgreementsPage(page, search, pageSize) : null,
    () =>
      fetchLongTermAgreements({
        page,
        pageSize,
        search,
      }),
  );

  return {
    rows: data?.results ?? [],
    totalCount: data?.count ?? 0,
    isLoading: isLoading && !data,
    isValidating,
    error,
    mutate,
  };
}
