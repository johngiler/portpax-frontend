"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";

const swrDefaults = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  shouldRetryOnError: false,
  keepPreviousData: true,
} as const;

export default function SwrProvider({ children }: { children: ReactNode }) {
  return <SWRConfig value={swrDefaults}>{children}</SWRConfig>;
}
