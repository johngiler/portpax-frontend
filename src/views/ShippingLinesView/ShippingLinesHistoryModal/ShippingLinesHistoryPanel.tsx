"use client";

import FormErrorAlert from "@/components/ui/FormErrorAlert";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import Skeleton from "@/components/ui/Skeleton";
import { useShippingLineActivityInfinite } from "@/hooks/swr/useShippingLineActivityInfinite";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import type { CatalogActivityFilterValue } from "@/lib/catalogActivityTaxonomy";
import ShippingLinesHistoryFeed from "./ShippingLinesHistoryFeed";

const PAGE_SIZE = 20;

type ShippingLinesHistoryPanelProps = {
  typeFilter: CatalogActivityFilterValue;
  dateFrom: string;
  dateTo: string;
  actor?: string;
  enabled?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
};

export default function ShippingLinesHistoryPanel({
  typeFilter,
  dateFrom,
  dateTo,
  actor = "",
  enabled = true,
  hasActiveFilters = false,
  onClearFilters,
}: ShippingLinesHistoryPanelProps) {
  const {
    items,
    totalCount,
    hasMore,
    isLoading,
    loadingMore,
    error,
    loadMore,
  } = useShippingLineActivityInfinite(
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

      <ShippingLinesHistoryFeed
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
