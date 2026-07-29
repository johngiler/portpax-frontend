"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { fetchBookings } from "@/services/bookings/bookingService";

const PAGE_SIZE = 50;

export function useLtaLinkedBookings(agreementId: number, enabled: boolean) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? swrKeys.ltaLinkedBookings(agreementId) : null,
    () =>
      fetchBookings({
        long_term_agreement: agreementId,
        page: 1,
        pageSize: PAGE_SIZE,
        ordering: "call_date",
      }),
  );

  return {
    bookings: data?.results ?? [],
    totalCount: data?.count ?? 0,
    isLoading: Boolean(enabled) && isLoading && !data,
    isValidating,
    error,
    mutate,
  };
}
