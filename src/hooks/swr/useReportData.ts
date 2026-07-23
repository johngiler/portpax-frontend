"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchBookingTotalsReport,
  fetchCarrierPanoramaReport,
  fetchCumplimientoRealReport,
  fetchMovementsReport,
  type BookingTotalsReport,
  type CarrierPanoramaReport,
  type CumplimientoRealReport,
  type MovementsReport,
} from "@/services/bookings/bookingService";

export type ReportTab = "totals" | "movements" | "panorama" | "cumplimiento";

export type ReportFilters = {
  tab: ReportTab;
  dateFrom: string;
  dateTo: string;
  portFilter: number;
  lineFilter: number;
  withoutLta: boolean;
};

function reportParamsKey(filters: ReportFilters): string {
  return [
    filters.tab,
    filters.dateFrom,
    filters.dateTo,
    filters.portFilter,
    filters.lineFilter,
    filters.withoutLta ? 1 : 0,
  ].join("|");
}

export type ReportPayload =
  | { tab: "totals"; data: BookingTotalsReport }
  | { tab: "movements"; data: MovementsReport }
  | { tab: "panorama"; data: CarrierPanoramaReport }
  | { tab: "cumplimiento"; data: CumplimientoRealReport };

async function fetchReport(filters: ReportFilters): Promise<ReportPayload> {
  const port = filters.portFilter > 0 ? filters.portFilter : undefined;
  const line = filters.lineFilter > 0 ? filters.lineFilter : undefined;

  if (filters.tab === "movements") {
    const data = await fetchMovementsReport({
      date_from: filters.dateFrom,
      date_to: filters.dateTo,
      port,
    });
    return { tab: "movements", data };
  }
  if (filters.tab === "panorama") {
    if (!filters.lineFilter) {
      throw new Error("Selecciona una naviera para el panorama.");
    }
    const data = await fetchCarrierPanoramaReport({
      date_from: filters.dateFrom,
      date_to: filters.dateTo,
      shipping_line: filters.lineFilter,
    });
    return { tab: "panorama", data };
  }
  if (filters.tab === "cumplimiento") {
    const data = await fetchCumplimientoRealReport({
      date_from: filters.dateFrom,
      date_to: filters.dateTo,
      port,
    });
    return { tab: "cumplimiento", data };
  }
  const data = await fetchBookingTotalsReport({
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
    port,
    shipping_line: line,
    without_lta: filters.withoutLta,
  });
  return { tab: "totals", data };
}

export function useReportData(filters: ReportFilters, enabled = true) {
  const key = reportParamsKey(filters);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? swrKeys.report(filters.tab, key) : null,
    () => fetchReport(filters),
  );

  return {
    payload: data ?? null,
    isLoading: isLoading && !data,
    isValidating,
    error,
    mutate,
  };
}
