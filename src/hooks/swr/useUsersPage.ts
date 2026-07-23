"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { fetchUsers } from "@/services/accounts/userService";

const DEFAULT_PAGE_SIZE = 20;

export function useUsersPage(
  page: number,
  search: string,
  enabled = true,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? swrKeys.usersPage(page, search, pageSize) : null,
    () => fetchUsers({ page, search, pageSize }),
  );

  return {
    users: data?.results ?? [],
    totalCount: data?.count ?? 0,
    isLoading: isLoading && !data,
    isValidating,
    error,
    mutate,
  };
}
