"use client";

import ViewSection from "@/components/layout/ViewSection";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { ReportDualMatrix } from "@/components/reports/ReportMatrixTable";
import { reportViewSectionBody } from "@/components/reports/reportMatrixStyles";
import { BarChart3 } from "lucide-react";
import type { PortsTotalsMatrixReport } from "@/services/bookings/bookingService";
import ReportsEmptyState from "./ReportsEmptyState";

type Props = {
  data: PortsTotalsMatrixReport;
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  loadedCount: number;
  totalCount: number;
};

export default function PortsTotalsMatrixSection({
  data,
  hasActiveFilters,
  onClearFilters,
  hasMore,
  loadingMore,
  onLoadMore,
  loadedCount,
  totalCount,
}: Props) {
  if (totalCount === 0) {
    return (
      <ReportsEmptyState
        variant={hasActiveFilters ? "filtered" : "empty"}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <ViewSection
      icon={BarChart3}
      title={data.title}
      description={
        data.without_lta
          ? `${data.note} Excluye LTA / CL / LTD.`
          : data.note
      }
      bodyClassName={reportViewSectionBody}
    >
      <ReportDualMatrix
        monthLabels={data.month_labels}
        sections={data.sections}
      />
      <InfiniteScrollFooter
        hasMore={hasMore}
        loading={loadingMore}
        onLoadMore={onLoadMore}
        loadedCount={loadedCount}
        totalCount={totalCount}
        itemLabel="bloques"
      />
    </ViewSection>
  );
}
