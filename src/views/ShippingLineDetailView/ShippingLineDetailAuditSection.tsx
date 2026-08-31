"use client";

import { useMemo } from "react";
import EntityAuditHistorySection, {
  DETAIL_AUDIT_PAGE_SIZE,
} from "@/components/audit/EntityAuditHistorySection";
import { useShippingLineActivityInfinite } from "@/hooks/swr/useShippingLineActivityInfinite";
import { catalogAuditActionLabel } from "@/lib/auditActionLabels";
import { shippingLineActivityToRow } from "@/lib/auditHistoryRows";

type ShippingLineDetailAuditSectionProps = {
  shippingLineId: number;
};

export default function ShippingLineDetailAuditSection({
  shippingLineId,
}: ShippingLineDetailAuditSectionProps) {
  const {
    items,
    totalCount,
    hasMore,
    isLoading,
    loadingMore,
    loadMore,
  } = useShippingLineActivityInfinite(
    {
      shippingLineId,
      pageSize: DETAIL_AUDIT_PAGE_SIZE,
    },
    shippingLineId > 0,
  );

  const rows = useMemo(
    () => items.map((item, index) => shippingLineActivityToRow(item, index)),
    [items],
  );

  return (
    <EntityAuditHistorySection
      rows={rows}
      resolveActionLabel={catalogAuditActionLabel}
      isLoading={isLoading}
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={loadMore}
      loadedCount={rows.length}
      totalCount={totalCount}
    />
  );
}
