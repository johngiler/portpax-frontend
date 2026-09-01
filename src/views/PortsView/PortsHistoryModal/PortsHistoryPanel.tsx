"use client";

import FormErrorAlert from "@/components/ui/FormErrorAlert";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import Skeleton from "@/components/ui/Skeleton";
import { usePortActivityInfinite } from "@/hooks/swr/usePortActivityInfinite";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import type { CatalogActivityFilterValue } from "@/lib/catalogActivityTaxonomy";
import PortsHistoryFeed from "./PortsHistoryFeed";

const PAGE_SIZE = 20;

type PortsHistoryPanelProps = {
  typeFilter: CatalogActivityFilterValue;
  dateFrom: string;
  dateTo: string;
  actor?: string;
  enabled?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
};

export default function PortsHistoryPanel({
  typeFilter,
  dateFrom,
  dateTo,
  actor = "",
  enabled = true,
  hasActiveFilters = false,
  onClearFilters,
}: PortsHistoryPanelProps) {
  const {
    items,
    totalCount,
    hasMore,
    isLoading,
    loadingMore,
    error,
    loadMore,
  } = usePortActivityInfinite(
    { typeFilter, dateFrom, dateTo, actor, pageSize: PAGE_SIZE },
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

      <PortsHistoryFeed
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
