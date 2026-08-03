"use client";

import { useMemo, useState } from "react";
import ActivityHistoryModal from "@/components/ui/ActivityHistoryModal";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import type {
  BookingActivityKind,
  ImportBatchRetryRow,
} from "@/services/bookings/bookingActivityService";
import BookingsHistoryPanel from "../BookingsHistoryPanel";

const HISTORY_KIND_OPTIONS: { value: BookingActivityKind; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "single", label: "Única" },
  { value: "bulk", label: "Masiva" },
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

  const hasActiveFilters = useMemo(
    () => kind !== "all" || Boolean(dateFrom) || Boolean(dateTo),
    [kind, dateFrom, dateTo],
  );

  function clearFilters() {
    setKind("all");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <ActivityHistoryModal
      open={open}
      onClose={onClose}
      title="Historial de movimientos de reservas"
      toolbar={
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FormFieldSelect<BookingActivityKind>
            label="Tipo"
            name="history_kind"
            value={kind}
            onChange={setKind}
            options={HISTORY_KIND_OPTIONS}
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
