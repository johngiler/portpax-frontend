"use client";

import { useMemo } from "react";
import EntityAuditHistorySection, {
  DETAIL_AUDIT_PAGE_SIZE,
} from "@/components/audit/EntityAuditHistorySection";
import { useUserActivityInfinite } from "@/hooks/swr/useUserActivityInfinite";
import { userAuditActionLabel } from "@/lib/auditActionLabels";
import { userActivityToRow } from "@/lib/auditHistoryRows";

type UserDetailAuditSectionProps = {
  userId: number;
};

export default function UserDetailAuditSection({
  userId,
}: UserDetailAuditSectionProps) {
  const {
    items,
    totalCount,
    hasMore,
    isLoading,
    loadingMore,
    loadMore,
  } = useUserActivityInfinite(
    {
      userId,
      pageSize: DETAIL_AUDIT_PAGE_SIZE,
    },
    userId > 0,
  );

  const rows = useMemo(
    () => items.map((item, index) => userActivityToRow(item, index)),
    [items],
  );

  return (
    <EntityAuditHistorySection
      rows={rows}
      resolveActionLabel={userAuditActionLabel}
      isLoading={isLoading}
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={loadMore}
      loadedCount={rows.length}
      totalCount={totalCount}
    />
  );
}
