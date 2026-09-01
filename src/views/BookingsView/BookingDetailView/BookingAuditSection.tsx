"use client";

import { useMemo } from "react";
import EntityAuditHistorySection, {
  DETAIL_AUDIT_PAGE_SIZE,
} from "@/components/audit/EntityAuditHistorySection";
import { useBookingActivityInfinite } from "@/hooks/swr/useBookingActivityInfinite";
import { bookingAuditActionLabel } from "@/lib/auditActionLabels";
import { bookingActivityToRow } from "@/lib/auditHistoryRows";

type BookingAuditSectionProps = {
  bookingId: number;
};

export default function BookingAuditSection({ bookingId }: BookingAuditSectionProps) {
  const {
    items,
    totalCount,
    hasMore,
    isLoading,
    loadingMore,
    loadMore,
  } = useBookingActivityInfinite(
    {
      bookingId,
      pageSize: DETAIL_AUDIT_PAGE_SIZE,
    },
    bookingId > 0,
  );

  const rows = useMemo(
    () => items.map((item, index) => bookingActivityToRow(item, index)),
    [items],
  );

  return (
    <EntityAuditHistorySection
      rows={rows}
      resolveActionLabel={bookingAuditActionLabel}
      isLoading={isLoading}
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={loadMore}
      loadedCount={rows.length}
      totalCount={totalCount}
    />
  );
}
