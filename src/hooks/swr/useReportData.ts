"use client";

import { useCallback, useEffect, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchPortCarrierMatrixReport,
  fetchPortsTotalsMatrixReport,
  fetchPortTrendsReport,
  REPORT_MATRIX_SECTION_PAGE_SIZE,
  REPORT_TRENDS_LINE_PAGE_SIZE,
  type PortCarrierMatrixReport,
  type PortsTotalsMatrixReport,
  type PortTrendsReport,
} from "@/services/bookings/bookingService";

export type ReportTab = "ports_totals" | "port_carrier" | "port_trends";

export type ReportFilters = {
  tab: ReportTab;
  dateFrom: string;
  dateTo: string;
  portFilter: number;
  withoutLta: boolean;
};

function reportParamsKey(filters: ReportFilters): string {
  return [
    filters.tab,
    filters.dateFrom,
    filters.dateTo,
    filters.portFilter,
    filters.withoutLta ? 1 : 0,
  ].join("|");
}

export type ReportPayload =
  | { tab: "ports_totals"; data: PortsTotalsMatrixReport }
  | { tab: "port_carrier"; data: PortCarrierMatrixReport }
  | { tab: "port_trends"; data: PortTrendsReport };

type ReportPage =
  | PortsTotalsMatrixReport
  | PortCarrierMatrixReport
  | PortTrendsReport;

function reportFetchEnabled(filters: ReportFilters, ready: boolean): boolean {
  if (!ready) return false;
  if (filters.tab === "ports_totals") return true;
  return filters.portFilter > 0;
}

async function fetchReportPage(
  filters: ReportFilters,
  page: number,
): Promise<ReportPage> {
  const base = {
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
    without_lta: filters.withoutLta,
    page,
  };

  if (filters.tab === "ports_totals") {
    return fetchPortsTotalsMatrixReport({
      ...base,
      page_size: REPORT_MATRIX_SECTION_PAGE_SIZE,
    });
  }
  if (filters.tab === "port_carrier") {
    return fetchPortCarrierMatrixReport({
      ...base,
      port: filters.portFilter,
      page_size: REPORT_MATRIX_SECTION_PAGE_SIZE,
    });
  }
  return fetchPortTrendsReport({
    ...base,
    port: filters.portFilter,
    page_size: REPORT_TRENDS_LINE_PAGE_SIZE,
  });
}

function reportPayloadMatchesFilters(
  payload: ReportPayload | null,
  filters: ReportFilters,
): payload is ReportPayload {
  if (!payload || payload.tab !== filters.tab) return false;
  const { data } = payload;
  if (
    data.date_from !== filters.dateFrom ||
    data.date_to !== filters.dateTo ||
    data.without_lta !== filters.withoutLta
  ) {
    return false;
  }
  if (filters.tab === "port_carrier" || filters.tab === "port_trends") {
    return data.port.id === filters.portFilter;
  }
  return true;
}

function mergeReportPages(pages: ReportPage[]): ReportPayload | null {
  if (!pages.length) return null;
  const head = pages[0];
  if (head.kind === "ports_totals") {
    return {
      tab: "ports_totals",
      data: {
        ...head,
        sections: pages.flatMap((page) =>
          page.kind === "ports_totals" ? page.sections : [],
        ),
      },
    };
  }
  if (head.kind === "port_carrier") {
    return {
      tab: "port_carrier",
      data: {
        ...head,
        sections: pages.flatMap((page) =>
          page.kind === "port_carrier" ? page.sections : [],
        ),
      },
    };
  }
  return {
    tab: "port_trends",
    data: {
      ...head,
      lines: pages.flatMap((page) =>
        page.kind === "port_trends" ? page.lines : [],
      ),
    },
  };
}

export function useReportInfinite(filters: ReportFilters, ready = true) {
  const paramsKey = reportParamsKey(filters);
  const enabled = reportFetchEnabled(filters, ready);

  const getKey = useCallback(
    (pageIndex: number, previousPageData: ReportPage | null) => {
      if (!enabled) return null;
      if (previousPageData && !previousPageData.has_more) return null;
      return [...swrKeys.reportInfinite(filters.tab, paramsKey), pageIndex + 1] as const;
    },
    [enabled, filters.tab, paramsKey],
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(
      getKey,
      (key) => {
        const page = key[key.length - 1] as number;
        return fetchReportPage(filters, page);
      },
      { keepPreviousData: false },
    );

  useEffect(() => {
    void setSize(1);
  }, [paramsKey, setSize]);

  const rawPayload = useMemo(() => mergeReportPages(data ?? []), [data]);
  const payload = reportPayloadMatchesFilters(rawPayload, filters)
    ? rawPayload
    : null;

  const lastPage = data?.[data.length - 1];
  const totalCount = payload ? (lastPage?.total_count ?? 0) : 0;
  const loadedCount =
    payload?.tab === "port_trends"
      ? payload.data.lines.length
      : payload?.tab === "ports_totals" || payload?.tab === "port_carrier"
        ? payload.data.sections.length
        : 0;
  const hasMore = Boolean(payload && lastPage?.has_more);
  const loadingMore = Boolean(payload) && isValidating && size > 1 && hasMore;
  const isFilterLoading =
    enabled && !loadingMore && !payload && (isLoading || isValidating);

  const loadMore = useCallback(() => {
    if (!enabled || loadingMore || !hasMore || isFilterLoading) return;
    void setSize(size + 1);
  }, [enabled, hasMore, isFilterLoading, loadingMore, setSize, size]);

  return {
    payload,
    totalCount,
    loadedCount,
    hasMore,
    isLoading: isFilterLoading,
    isValidating,
    loadingMore,
    error,
    loadMore,
    mutate,
  };
}

/** @deprecated Use useReportInfinite */
export const useReportData = useReportInfinite;
