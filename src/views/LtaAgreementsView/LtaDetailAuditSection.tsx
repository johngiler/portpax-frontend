"use client";

import { useMemo } from "react";
import EntityAuditHistorySection, {
  DETAIL_AUDIT_PAGE_SIZE,
} from "@/components/audit/EntityAuditHistorySection";
import { useLtaActivityInfinite } from "@/hooks/swr/useLtaActivityInfinite";
import { ltaAuditActionLabel } from "@/lib/auditActionLabels";
import { ltaActivityToRow } from "@/lib/auditHistoryRows";

type LtaDetailAuditSectionProps = {
  agreementId: number;
  active?: boolean;
};

export default function LtaDetailAuditSection({
  agreementId,
  active = true,
}: LtaDetailAuditSectionProps) {
  const {
    items,
    totalCount,
    hasMore,
    isLoading,
    loadingMore,
    loadMore,
  } = useLtaActivityInfinite(
    {
      agreementId,
      pageSize: DETAIL_AUDIT_PAGE_SIZE,
    },
    active && agreementId > 0,
  );

  const rows = useMemo(
    () => items.map((item, index) => ltaActivityToRow(item, index)),
    [items],
  );

  return (
    <EntityAuditHistorySection
      rows={rows}
      resolveActionLabel={ltaAuditActionLabel}
      isLoading={isLoading}
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={loadMore}
      loadedCount={rows.length}
      totalCount={totalCount}
    />
  );
}
