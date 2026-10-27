"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  previewBulkEdit,
  type BulkEditRow,
} from "@/services/bookings/bulkEditService";
import {
  recapDraftMatchPercent,
  scoreDraftAgainstRecap,
  type RecapScheduleRef,
} from "./recapScheduleScore";

export const BULK_EDIT_PAGE_SIZE = 20;

function stripRecapWarnings(row: BulkEditRow): BulkEditRow {
  const warnings = (row.warnings ?? []).filter(
    (issue) => issue.code !== "recap_mismatch",
  );
  if (warnings.length === (row.warnings ?? []).length) return row;
  return { ...row, warnings };
}

function attachLiveRecap(
  row: BulkEditRow,
  recapSchedule: Record<number, RecapScheduleRef> | undefined,
): BulkEditRow {
  const cleaned = stripRecapWarnings(row);
  const score = scoreDraftAgainstRecap(
    cleaned,
    recapSchedule?.[cleaned.booking_id],
  );
  if (!score || score.avisos.length === 0) return cleaned;
  const existing = new Set((cleaned.warnings ?? []).map((issue) => issue.message));
  const added = score.avisos
    .filter((message) => message && !existing.has(message))
    .map((message) => ({
      level: "warning" as const,
      code: "recap_mismatch",
      message,
    }));
  if (added.length === 0) return cleaned;
  return { ...cleaned, warnings: [...(cleaned.warnings ?? []), ...added] };
}

function chunkIds(ids: number[], size: number): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    out.push(ids.slice(i, i + size));
  }
  return out;
}

type UseBulkEditPagedRowsArgs = {
  open: boolean;
  bookingIds: number[];
  recapSchedule?: Record<number, RecapScheduleRef>;
  /** When recap is present, show only rows below 100% match. */
  mismatchOnly?: boolean;
};

export function useBulkEditPagedRows({
  open,
  bookingIds,
  recapSchedule,
  mismatchOnly = false,
}: UseBulkEditPagedRowsArgs) {
  const idsKey = bookingIds.join(",");
  const stableIds = useMemo(
    () =>
      idsKey
        ? idsKey.split(",").map((part) => Number(part)).filter((n) => n > 0)
        : [],
    [idsKey],
  );

  const [page, setPage] = useState(1);
  const [rowsById, setRowsById] = useState<Record<number, BulkEditRow>>({});
  const [loadedIdSet, setLoadedIdSet] = useState<Set<number>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [selectAllValidIntent, setSelectAllValidIntent] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadGenRef = useRef(0);
  /** True while open-hydrate (pages 1–2) is in flight — skips nav fetch race. */
  const hydratingRef = useRef(false);

  const totalCount = stableIds.length;

  const recapMatch = useMemo(() => {
    if (!recapSchedule) return null;
    let total = 0;
    let perfect = 0;
    for (const id of stableIds) {
      const recap = recapSchedule[id];
      if (!recap) continue;
      total += 1;
      const percent = recapDraftMatchPercent(rowsById[id], recap);
      if (percent != null && percent >= 100) perfect += 1;
    }
    if (total === 0) return null;
    return { perfect, total };
  }, [recapSchedule, stableIds, rowsById]);

  const displayIds = useMemo(() => {
    if (!mismatchOnly || !recapSchedule) return stableIds;
    return stableIds.filter((id) => {
      const recap = recapSchedule[id];
      if (!recap) return true;
      const percent = recapDraftMatchPercent(rowsById[id], recap);
      return percent == null || percent < 100;
    });
  }, [mismatchOnly, recapSchedule, stableIds, rowsById]);

  const displayCount = displayIds.length;
  const totalPages = Math.max(1, Math.ceil(displayCount / BULK_EDIT_PAGE_SIZE));

  const pageIds = useMemo(() => {
    const start = (page - 1) * BULK_EDIT_PAGE_SIZE;
    return displayIds.slice(start, start + BULK_EDIT_PAGE_SIZE);
  }, [displayIds, page]);

  const mergeRows = useCallback(
    (incoming: BulkEditRow[], opts?: { selectNew?: boolean }) => {
      setRowsById((prev) => {
        const next = { ...prev };
        for (const row of incoming) {
          next[row.booking_id] = attachLiveRecap(row, recapSchedule);
        }
        return next;
      });
      setLoadedIdSet((prev) => {
        const next = new Set(prev);
        for (const row of incoming) next.add(row.booking_id);
        return next;
      });
      if (opts?.selectNew) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const row of incoming) {
            if (row.selectable) next.add(row.booking_id);
          }
          return next;
        });
      }
    },
    [recapSchedule],
  );

  const loadedIdSetRef = useRef(loadedIdSet);
  loadedIdSetRef.current = loadedIdSet;
  const rowsByIdRef = useRef(rowsById);
  rowsByIdRef.current = rowsById;

  // Reset + load page 1 (and page 2 in parallel) when modal opens / selection changes.
  useEffect(() => {
    if (!open || stableIds.length === 0) {
      setPage(1);
      setRowsById({});
      setLoadedIdSet(new Set());
      setSelectedIds(new Set());
      setSelectAllValidIntent(true);
      setError(null);
      setLoadingPage(false);
      return;
    }
    loadGenRef.current += 1;
    const gen = loadGenRef.current;
    setPage(1);
    setRowsById({});
    setLoadedIdSet(new Set());
    setSelectedIds(new Set());
    setSelectAllValidIntent(true);
    setError(null);
    setLoadingPage(true);
    hydratingRef.current = true;
    const first = stableIds.slice(0, BULK_EDIT_PAGE_SIZE);
    const second = stableIds.slice(
      BULK_EDIT_PAGE_SIZE,
      BULK_EDIT_PAGE_SIZE * 2,
    );
    void Promise.all([
      previewBulkEdit(first),
      second.length > 0
        ? previewBulkEdit(second).catch(() => ({ rows: [] as BulkEditRow[] }))
        : Promise.resolve({ rows: [] as BulkEditRow[] }),
    ])
      .then(([firstRes, secondRes]) => {
        if (gen !== loadGenRef.current) return;
        const mapped = [...firstRes.rows, ...secondRes.rows].map((row) =>
          attachLiveRecap(row, recapSchedule),
        );
        setRowsById(
          Object.fromEntries(mapped.map((row) => [row.booking_id, row])),
        );
        setLoadedIdSet(new Set(mapped.map((row) => row.booking_id)));
        setSelectedIds(
          new Set(
            mapped.filter((r) => r.selectable).map((r) => r.booking_id),
          ),
        );
      })
      .catch((err) => {
        if (gen !== loadGenRef.current) return;
        setError(
          getApiErrorMessage(err, "No se pudieron cargar las reservas."),
        );
      })
      .finally(() => {
        if (gen === loadGenRef.current) {
          hydratingRef.current = false;
          setLoadingPage(false);
        }
      });
    return () => {
      loadGenRef.current += 1;
      hydratingRef.current = false;
    };
  }, [open, stableIds, recapSchedule]);

  const pageIdsKey = pageIds.join(",");
  const selectAllValidIntentRef = useRef(selectAllValidIntent);
  selectAllValidIntentRef.current = selectAllValidIntent;

  // Load current page on navigation (lazy). Initial pages 1–2 handled above.
  useEffect(() => {
    if (!open || pageIds.length === 0) return;
    if (hydratingRef.current) return;
    const missing = pageIds.filter((id) => !loadedIdSetRef.current.has(id));
    if (missing.length === 0) return;
    let cancelled = false;
    setLoadingPage(true);
    setError(null);
    void previewBulkEdit(missing)
      .then((res) => {
        if (cancelled) return;
        mergeRows(res.rows, { selectNew: selectAllValidIntentRef.current });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          getApiErrorMessage(err, "No se pudieron cargar las reservas."),
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingPage(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, page, pageIdsKey, pageIds, mergeRows]);

  // Prefetch next page in the background (do not wait for loadingPage).
  useEffect(() => {
    if (!open || hydratingRef.current) return;
    const nextPage = page + 1;
    if (nextPage > totalPages) return;
    const start = (nextPage - 1) * BULK_EDIT_PAGE_SIZE;
    const nextIds = displayIds.slice(start, start + BULK_EDIT_PAGE_SIZE);
    const missing = nextIds.filter((id) => !loadedIdSetRef.current.has(id));
    if (missing.length === 0) return;
    let cancelled = false;
    void previewBulkEdit(missing)
      .then((res) => {
        if (cancelled) return;
        mergeRows(res.rows, { selectNew: selectAllValidIntentRef.current });
      })
      .catch(() => {
        /* prefetch is best-effort */
      });
    return () => {
      cancelled = true;
    };
  }, [open, page, totalPages, displayIds, mergeRows]);

  useEffect(() => {
    setPage(1);
  }, [mismatchOnly]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageReady =
    pageIds.length === 0 || pageIds.every((id) => loadedIdSet.has(id));

  const pageRowsCacheRef = useRef<BulkEditRow[]>([]);
  const pageRows = (() => {
    if (!pageReady) {
      pageRowsCacheRef.current = [];
      return pageRowsCacheRef.current;
    }
    const next = pageIds
      .map((id) => rowsById[id])
      .filter((row): row is BulkEditRow => Boolean(row));
    const prev = pageRowsCacheRef.current;
    if (
      prev.length === next.length &&
      prev.every((row, index) => row === next[index])
    ) {
      return prev;
    }
    pageRowsCacheRef.current = next;
    return next;
  })();

  const allRows = useMemo(
    () =>
      stableIds
        .map((id) => rowsById[id])
        .filter((row): row is BulkEditRow => Boolean(row)),
    [stableIds, rowsById],
  );

  const selectableRows = useMemo(
    () => allRows.filter((r) => r.selectable),
    [allRows],
  );

  const ensureSelectedLoaded = useCallback(async () => {
    const wanted = [...selectedIds];
    const missing = wanted.filter((id) => !rowsByIdRef.current[id]);
    let merged = rowsByIdRef.current;
    if (missing.length > 0) {
      setLoadingPage(true);
      try {
        const next = { ...merged };
        const nextLoaded = new Set(loadedIdSetRef.current);
        for (const chunk of chunkIds(missing, BULK_EDIT_PAGE_SIZE)) {
          const res = await previewBulkEdit(chunk);
          for (const row of res.rows) {
            next[row.booking_id] = attachLiveRecap(row, recapSchedule);
            nextLoaded.add(row.booking_id);
          }
        }
        merged = next;
        setRowsById(next);
        setLoadedIdSet(nextLoaded);
      } finally {
        setLoadingPage(false);
      }
    }
    return wanted
      .map((id) => merged[id])
      .filter((row): row is BulkEditRow => Boolean(row?.selectable));
  }, [selectedIds, recapSchedule]);

  /** Load every id; returns selectable rows in bookingIds order. */
  const ensureAllLoaded = useCallback(async (): Promise<BulkEditRow[]> => {
    setLoadingPage(true);
    setError(null);
    try {
      const missing = stableIds.filter((id) => !rowsByIdRef.current[id]);
      let merged = rowsByIdRef.current;
      if (missing.length > 0) {
        const next = { ...merged };
        const nextLoaded = new Set(loadedIdSetRef.current);
        for (const chunk of chunkIds(missing, BULK_EDIT_PAGE_SIZE)) {
          const res = await previewBulkEdit(chunk);
          for (const row of res.rows) {
            next[row.booking_id] = attachLiveRecap(row, recapSchedule);
            nextLoaded.add(row.booking_id);
          }
        }
        merged = next;
        setRowsById(next);
        setLoadedIdSet(nextLoaded);
      }
      return stableIds
        .map((id) => merged[id])
        .filter((row): row is BulkEditRow => Boolean(row?.selectable));
    } catch (err) {
      setError(
        getApiErrorMessage(err, "No se pudieron cargar las reservas."),
      );
      throw err;
    } finally {
      setLoadingPage(false);
    }
  }, [stableIds, recapSchedule]);

  function updateRow(
    bookingId: number,
    updater: (current: BulkEditRow) => BulkEditRow,
  ) {
    setRowsById((prev) => {
      const current = prev[bookingId];
      if (!current) return prev;
      const next = attachLiveRecap(updater(current), recapSchedule);
      setSelectedIds((selected) => {
        const copy = new Set(selected);
        if (!next.selectable) copy.delete(next.booking_id);
        else if (!current.selectable && next.selectable) {
          copy.add(next.booking_id);
        }
        return copy;
      });
      return { ...prev, [bookingId]: next };
    });
  }

  function setRows(updater: (prev: BulkEditRow[]) => BulkEditRow[]) {
    setRowsById((prev) => {
      const list = stableIds
        .map((id) => prev[id])
        .filter((row): row is BulkEditRow => Boolean(row));
      const nextList = updater(list);
      const next: Record<number, BulkEditRow> = { ...prev };
      for (const row of nextList) {
        next[row.booking_id] = attachLiveRecap(row, recapSchedule);
      }
      return next;
    });
  }

  return {
    page,
    setPage,
    pageSize: BULK_EDIT_PAGE_SIZE,
    totalCount,
    displayCount,
    recapMatch,
    totalPages,
    pageRows,
    pageReady,
    allRows,
    selectableRows,
    selectedIds,
    setSelectedIds,
    selectAllValidIntent,
    setSelectAllValidIntent,
    loadingPage,
    error,
    setError,
    updateRow,
    setRows,
    ensureSelectedLoaded,
    ensureAllLoaded,
    loadedCount: loadedIdSet.size,
  };
}
