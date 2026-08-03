"use client";

import { useCallback, useEffect, useState } from "react";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { useBookingActivityInfinite } from "@/hooks/swr/useBookingActivityInfinite";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  fetchImportBatchDetail,
  type BookingActivityKind,
  type ImportBatchDetail,
  type ImportBatchRetryRow,
} from "@/services/bookings/bookingActivityService";
import BookingsHistorySkeleton from "./BookingsHistorySkeleton";
import HistoryFeed from "./HistoryFeed";
import ImportBatchDetailModal from "./ImportBatchDetailModal";

const PAGE_SIZE = 20;

type BookingsHistoryPanelProps = {
  kind: BookingActivityKind;
  dateFrom: string;
  dateTo: string;
  /** When false, SWR does not fetch (e.g. history modal closed). */
  enabled?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  /** Open this batch detail when set (e.g. after mass import). */
  initialBatchId?: number | null;
  onInitialBatchConsumed?: () => void;
  onReprocessRows?: (payload: {
    rows: ImportBatchRetryRow[];
    label: string;
    source: "file" | "paste";
  }) => void;
};

export default function BookingsHistoryPanel({
  kind,
  dateFrom,
  dateTo,
  enabled = true,
  hasActiveFilters = false,
  onClearFilters,
  initialBatchId = null,
  onInitialBatchConsumed,
  onReprocessRows,
}: BookingsHistoryPanelProps) {
  const {
    items,
    totalCount,
    hasMore,
    isLoading,
    loadingMore,
    error,
    loadMore,
    refresh,
  } = useBookingActivityInfinite(
    {
      kind,
      dateFrom,
      dateTo,
      pageSize: PAGE_SIZE,
    },
    enabled,
  );

  const [batchOpen, setBatchOpen] = useState(false);
  const [batchDetail, setBatchDetail] = useState<ImportBatchDetail | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  const openBatch = useCallback(async (batchId: number) => {
    setBatchOpen(true);
    setBatchDetail(null);
    setBatchError(null);
    setBatchLoading(true);
    try {
      const detail = await fetchImportBatchDetail(batchId);
      setBatchDetail(detail);
    } catch (err) {
      setBatchError(
        getApiErrorMessage(err, "No se pudo cargar el detalle de la importación."),
      );
    } finally {
      setBatchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialBatchId == null) return;
    const batchId = initialBatchId;
    onInitialBatchConsumed?.();
    void (async () => {
      await refresh();
      await openBatch(batchId);
    })();
  }, [initialBatchId, refresh, openBatch, onInitialBatchConsumed]);

  const handleReprocess = useCallback(
    (rows: ImportBatchRetryRow[]) => {
      if (!onReprocessRows) return;
      const source = batchDetail?.source === "paste" ? "paste" : "file";
      const label = batchDetail?.label || "Reproceso";
      setBatchOpen(false);
      setBatchDetail(null);
      setBatchError(null);
      onReprocessRows({ rows, label, source });
    },
    [batchDetail, onReprocessRows],
  );

  const errorMessage = error
    ? getApiErrorMessage(error, "No se pudo cargar el historial.")
    : null;

  const batchModal = (
    <ImportBatchDetailModal
      open={batchOpen}
      detail={batchDetail}
      loading={batchLoading}
      error={batchError}
      onClose={() => {
        setBatchOpen(false);
        setBatchDetail(null);
        setBatchError(null);
      }}
      onReprocess={onReprocessRows ? handleReprocess : undefined}
    />
  );

  if (isLoading) {
    return (
      <>
        <BookingsHistorySkeleton />
        {batchModal}
      </>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {errorMessage ? (
          <FormErrorAlert message={errorMessage} className="mb-4" />
        ) : null}

        <HistoryFeed
          items={items}
          onOpenBatch={(id) => void openBatch(id)}
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

      {batchModal}
    </>
  );
}
