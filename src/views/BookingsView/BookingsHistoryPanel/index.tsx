"use client";

import { useCallback, useEffect, useState } from "react";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  fetchBookingActivity,
  fetchImportBatchDetail,
  type BookingActivityItem,
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
  hasActiveFilters = false,
  onClearFilters,
  initialBatchId = null,
  onInitialBatchConsumed,
  onReprocessRows,
}: BookingsHistoryPanelProps) {
  const [items, setItems] = useState<BookingActivityItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [batchOpen, setBatchOpen] = useState(false);
  const [batchDetail, setBatchDetail] = useState<ImportBatchDetail | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (replace) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const data = await fetchBookingActivity({
          page: pageNum,
          page_size: PAGE_SIZE,
          kind,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        });
        setTotal(data.count);
        setPage(data.page);
        setItems((prev) =>
          replace ? data.results : [...prev, ...data.results],
        );
      } catch (err) {
        setError(
          getApiErrorMessage(err, "No se pudo cargar el historial."),
        );
        if (replace) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [kind, dateFrom, dateTo],
  );

  useEffect(() => {
    void loadPage(1, true);
  }, [loadPage]);

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
      await loadPage(1, true);
      await openBatch(batchId);
    })();
  }, [initialBatchId, loadPage, openBatch, onInitialBatchConsumed]);

  const hasMore = items.length < total;

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

  if (loading && items.length === 0) {
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
        {error ? <FormErrorAlert message={error} className="mb-4" /> : null}

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
            onLoadMore={() => loadPage(page + 1, false)}
            loadedCount={items.length}
            totalCount={total}
            itemLabel="movimientos"
          />
        ) : null}
      </div>

      {batchModal}
    </>
  );
}
