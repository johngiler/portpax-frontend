"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { fetchNavCounts, type NavCounts } from "@/services/core/navCountsService";

/** Sidebar badge counts — cached across navigations. */
export function useNavCounts(enabled: boolean): NavCounts | null {
  const { data } = useSWR(
    enabled ? swrKeys.navCounts : null,
    () => fetchNavCounts(),
  );
  return data ?? null;
}
