"use client";

import { useMemo } from "react";
import EntityAuditHistorySection, {
  DETAIL_AUDIT_PAGE_SIZE,
} from "@/components/audit/EntityAuditHistorySection";
import { usePortActivityInfinite } from "@/hooks/swr/usePortActivityInfinite";
import { catalogAuditActionLabel } from "@/lib/auditActionLabels";
import { portActivityToRow } from "@/lib/auditHistoryRows";

type PortDetailAuditSectionProps = {
  portId: number;
};

export default function PortDetailAuditSection({
  portId,
}: PortDetailAuditSectionProps) {
  const {
    items,
    totalCount,
    hasMore,
    isLoading,
    loadingMore,
    loadMore,
  } = usePortActivityInfinite(
    {
      portId,
      pageSize: DETAIL_AUDIT_PAGE_SIZE,
    },
    portId > 0,
  );

  const rows = useMemo(
    () => items.map((item, index) => portActivityToRow(item, index)),
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
