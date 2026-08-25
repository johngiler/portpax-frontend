"use client";

import FormErrorAlert from "@/components/ui/FormErrorAlert";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import Skeleton from "@/components/ui/Skeleton";
import { useUserActivityInfinite } from "@/hooks/swr/useUserActivityInfinite";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import type { UserActivityKind } from "@/services/accounts/userActivityService";
import UsersHistoryFeed from "./UsersHistoryFeed";

const PAGE_SIZE = 20;

type UsersHistoryPanelProps = {
  kind: UserActivityKind;
  dateFrom: string;
  dateTo: string;
  actor?: string;
  enabled?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
};

export default function UsersHistoryPanel({
  kind,
  dateFrom,
  dateTo,
  actor = "",
  enabled = true,
  hasActiveFilters = false,
  onClearFilters,
}: UsersHistoryPanelProps) {
  const {
    items,
    totalCount,
    hasMore,
    isLoading,
    loadingMore,
    error,
    loadMore,
  } = useUserActivityInfinite(
    {
      kind,
      dateFrom,
      dateTo,
      actor,
      pageSize: PAGE_SIZE,
    },
    enabled,
  );

  const errorMessage = error
    ? getApiErrorMessage(error, "No se pudo cargar el historial.")
    : null;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {errorMessage ? (
        <FormErrorAlert message={errorMessage} className="mb-4" />
      ) : null}

      <UsersHistoryFeed
        items={items}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />

      {items.length > 0 ? (
        <InfiniteScrollFooter
          hasMore={hasMore}
          loading={loadingMore}
          onLoadMore={loadMore}
          loadedCount={items.length}
          totalCount={totalCount}
          itemLabel="movimientos"
        />
      ) : null}
    </div>
  );
}
