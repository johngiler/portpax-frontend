"use client";

import { useCallback, useEffect, useState } from "react";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { useBookingActivityInfinite } from "@/hooks/swr/useBookingActivityInfinite";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import type { BookingActivityFilterValue } from "@/lib/bookingActivityTaxonomy";
import {
  fetchImportBatchDetail,
  fetchRunBatchDetail,
  type ImportBatchDetail,
  type ImportBatchRetryRow,
  type RunBatchDetail,
} from "@/services/bookings/bookingActivityService";
import BookingsHistorySkeleton from "./BookingsHistorySkeleton";
import HistoryFeed from "./HistoryFeed";
import ImportBatchDetailModal from "./ImportBatchDetailModal";
import RunBatchDetailModal from "./RunBatchDetailModal";

const PAGE_SIZE = 20;

type BookingsHistoryPanelProps = {
  typeFilter: BookingActivityFilterValue;
  dateFrom: string;
  dateTo: string;
  actor?: string;
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
  typeFilter,
  dateFrom,
  dateTo,
  actor = "",
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
      typeFilter,
      dateFrom,
      dateTo,
      actor,
      pageSize: PAGE_SIZE,
    },
    enabled,
  );

  const [importOpen, setImportOpen] = useState(false);
  const [importDetail, setImportDetail] = useState<ImportBatchDetail | null>(
    null,
  );
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [runOpen, setRunOpen] = useState(false);
  const [runDetail, setRunDetail] = useState<RunBatchDetail | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const openImportBatch = useCallback(async (batchId: number) => {
    setImportOpen(true);
    setImportDetail(null);
    setImportError(null);
    setImportLoading(true);
    try {
      const detail = await fetchImportBatchDetail(batchId, { page: 1 });
      setImportDetail(detail);
    } catch (err) {
      setImportError(
        getApiErrorMessage(err, "No se pudo cargar el detalle de la importación."),
      );
    } finally {
      setImportLoading(false);
    }
  }, []);

  const openRunBatch = useCallback(async (batchId: number) => {
    setRunOpen(true);
    setRunDetail(null);
    setRunError(null);
    setRunLoading(true);
    try {
      const detail = await fetchRunBatchDetail(batchId, { page: 1 });
      setRunDetail(detail);
    } catch (err) {
      setRunError(
        getApiErrorMessage(err, "No se pudo cargar el detalle del lote."),
      );
    } finally {
      setRunLoading(false);
    }
  }, []);

  const openBatch = useCallback(
    async (batchId: number, batchType?: string | null) => {
      if (!batchType || batchType === "import") {
        await openImportBatch(batchId);
        return;
      }
      await openRunBatch(batchId);
    },
    [openImportBatch, openRunBatch],
  );

  useEffect(() => {
    if (initialBatchId == null) return;
    const batchId = initialBatchId;
    onInitialBatchConsumed?.();
    void (async () => {
      await refresh();
      await openImportBatch(batchId);
    })();
  }, [initialBatchId, refresh, openImportBatch, onInitialBatchConsumed]);

  const handleReprocess = useCallback(
    (rows: ImportBatchRetryRow[]) => {
      if (!onReprocessRows) return;
      const source = importDetail?.source === "paste" ? "paste" : "file";
      const label = importDetail?.label || "Reproceso";
      setImportOpen(false);
      setImportDetail(null);
      setImportError(null);
      onReprocessRows({ rows, label, source });
    },
    [importDetail, onReprocessRows],
  );

  const errorMessage = error
    ? getApiErrorMessage(error, "No se pudo cargar el historial.")
    : null;

  const batchModals = (
    <>
      <ImportBatchDetailModal
        open={importOpen}
        detail={importDetail}
        loading={importLoading}
        error={importError}
        onClose={() => {
          setImportOpen(false);
          setImportDetail(null);
          setImportError(null);
        }}
        onReprocess={onReprocessRows ? handleReprocess : undefined}
        onDetailChange={(next) => {
          setImportDetail(next);
          void refresh();
        }}
      />
      <RunBatchDetailModal
        open={runOpen}
        detail={runDetail}
        loading={runLoading}
        error={runError}
        onClose={() => {
          setRunOpen(false);
          setRunDetail(null);
          setRunError(null);
        }}
        onDetailChange={(next) => {
          setRunDetail(next);
          void refresh();
        }}
      />
    </>
  );

  if (isLoading) {
    return (
      <>
        <BookingsHistorySkeleton />
        {batchModals}
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
          onOpenBatch={(id, batchType) => void openBatch(id, batchType)}
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

      {batchModals}
    </>
  );
}
