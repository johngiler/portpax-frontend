"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import ActivityHistoryModal from "@/components/ui/ActivityHistoryModal";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import {
  HISTORY_ACTOR_ALL,
  historyActorSelectOptions,
} from "@/lib/auditActor";
import {
  BOOKING_ACTIVITY_TYPE_OPTIONS,
  type BookingActivityFilterValue,
} from "@/lib/bookingActivityTaxonomy";
import { swrKeys } from "@/lib/swr/keys";
import { fetchBookingActivityActors } from "@/services/bookings/bookingActivityService";
import type { ImportBatchRetryRow } from "@/services/bookings/bookingActivityService";
import { fetchBookingTags } from "@/services/bookings/bookingTagService";
import BookingsHistoryPanel from "../BookingsHistoryPanel";

type BookingsHistoryModalProps = {
  open: boolean;
  onClose: () => void;
  initialBatchId?: number | null;
  initialTypeFilter?: BookingActivityFilterValue;
  onInitialBatchConsumed?: () => void;
  onInitialTypeFilterConsumed?: () => void;
  onReprocessRows?: (payload: {
    rows: ImportBatchRetryRow[];
    label: string;
    source: "file" | "paste";
  }) => void;
};

export default function BookingsHistoryModal({
  open,
  onClose,
  initialBatchId = null,
  initialTypeFilter = "",
  onInitialBatchConsumed,
  onInitialTypeFilterConsumed,
  onReprocessRows,
}: BookingsHistoryModalProps) {
  const [typeFilter, setTypeFilter] = useState<BookingActivityFilterValue>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actor, setActor] = useState(HISTORY_ACTOR_ALL);
  const [tagId, setTagId] = useState(0);

  useEffect(() => {
    if (!open || !initialTypeFilter) return;
    setTypeFilter(initialTypeFilter);
    onInitialTypeFilterConsumed?.();
  }, [open, initialTypeFilter, onInitialTypeFilterConsumed]);

  const { data: actorsData } = useSWR(
    open ? swrKeys.bookingActivityActors : null,
    fetchBookingActivityActors,
  );

  const { data: tagsData } = useSWR(
    open ? swrKeys.bookingTags : null,
    () => fetchBookingTags(),
  );

  const actorOptions = useMemo(
    () =>
      historyActorSelectOptions(
        actorsData?.results ?? [],
        Boolean(actorsData?.has_system),
      ),
    [actorsData],
  );

  const tagOptions = useMemo(
    () =>
      (tagsData ?? []).map((t) => ({
        value: t.id,
        label: t.name,
      })),
    [tagsData],
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(typeFilter) ||
      Boolean(dateFrom) ||
      Boolean(dateTo) ||
      Boolean(actor) ||
      tagId > 0,
    [typeFilter, dateFrom, dateTo, actor, tagId],
  );

  function clearFilters() {
    setTypeFilter("");
    setDateFrom("");
    setDateTo("");
    setActor(HISTORY_ACTOR_ALL);
    setTagId(0);
  }

  return (
    <ActivityHistoryModal
      open={open}
      onClose={onClose}
      title="Historial de movimientos de reservas"
      toolbar={
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <FormFieldSelect<BookingActivityFilterValue>
            label="Tipo"
            name="history_type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={BOOKING_ACTIVITY_TYPE_OPTIONS}
            optionLabel="Todas"
            emptyValue=""
            compact
          />
          <FormFieldSelect<string>
            label="Autor"
            name="history_actor"
            value={actor}
            onChange={setActor}
            options={actorOptions}
            emptyValue={HISTORY_ACTOR_ALL}
            optionLabel="Todos"
            compact
          />
          <FormFieldSelect<number>
            label="Tag"
            name="history_tag"
            value={tagId}
            onChange={setTagId}
            options={tagOptions}
            optionLabel="Todos"
            emptyValue={0}
            compact
          />
          <FormField
            label="Desde"
            name="history_date_from"
            type="date"
            value={dateFrom}
            onChange={(v) => setDateFrom(String(v))}
            compact
          />
          <FormField
            label="Hasta"
            name="history_date_to"
            type="date"
            value={dateTo}
            onChange={(v) => setDateTo(String(v))}
            compact
          />
        </div>
      }
    >
      {open ? (
        <BookingsHistoryPanel
          typeFilter={typeFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          actor={actor}
          tagId={tagId}
          enabled={open}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          initialBatchId={initialBatchId}
          onInitialBatchConsumed={onInitialBatchConsumed}
          onReprocessRows={
            onReprocessRows
              ? (payload) => {
                  onClose();
                  onReprocessRows(payload);
                }
              : undefined
          }
        />
      ) : null}
    </ActivityHistoryModal>
  );
}
