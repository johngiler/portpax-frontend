"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import ActivityHistoryModal from "@/components/ui/ActivityHistoryModal";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import {
  HISTORY_ACTOR_ALL,
  historyActorSelectOptions,
} from "@/lib/auditActor";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchBookingActivityActors,
  type BookingActivityKind,
  type ImportBatchRetryRow,
} from "@/services/bookings/bookingActivityService";
import BookingsHistoryPanel from "../BookingsHistoryPanel";

const HISTORY_KIND_OPTIONS: { value: BookingActivityKind; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "single", label: "Única" },
  { value: "mass_import", label: "Importación masiva" },
  { value: "wizard", label: "Wizard" },
  { value: "berthing_import", label: "BERTHING PAPERS" },
  { value: "lta_generate", label: "Generación LTA" },
];

type BookingsHistoryModalProps = {
  open: boolean;
  onClose: () => void;
  initialBatchId?: number | null;
  onInitialBatchConsumed?: () => void;
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
  onInitialBatchConsumed,
  onReprocessRows,
}: BookingsHistoryModalProps) {
  const [kind, setKind] = useState<BookingActivityKind>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actor, setActor] = useState(HISTORY_ACTOR_ALL);

  const { data: actorsData } = useSWR(
    open ? swrKeys.bookingActivityActors : null,
    fetchBookingActivityActors,
  );

  const actorOptions = useMemo(
    () =>
      historyActorSelectOptions(
        actorsData?.results ?? [],
        Boolean(actorsData?.has_system),
      ),
    [actorsData],
  );

  const hasActiveFilters = useMemo(
    () =>
      kind !== "all" ||
      Boolean(dateFrom) ||
      Boolean(dateTo) ||
      Boolean(actor),
    [kind, dateFrom, dateTo, actor],
  );

  function clearFilters() {
    setKind("all");
    setDateFrom("");
    setDateTo("");
    setActor(HISTORY_ACTOR_ALL);
  }

  return (
    <ActivityHistoryModal
      open={open}
      onClose={onClose}
      title="Historial de movimientos de reservas"
      toolbar={
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormFieldSelect<BookingActivityKind>
            label="Tipo"
            name="history_kind"
            value={kind}
            onChange={setKind}
            options={HISTORY_KIND_OPTIONS}
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
          kind={kind}
          dateFrom={dateFrom}
          dateTo={dateTo}
          actor={actor}
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
