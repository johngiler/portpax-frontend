"use client";

import { useMemo, useState } from "react";
import ActivityHistoryModal from "@/components/ui/ActivityHistoryModal";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import type { LtaActivityKind } from "@/services/bookings/ltaActivityService";
import LtaHistoryPanel from "./LtaHistoryPanel";

const KIND_OPTIONS: { value: LtaActivityKind; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "crud", label: "CRUD" },
  { value: "link", label: "Vinculación" },
];

type LtaHistoryModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function LtaHistoryModal({
  open,
  onClose,
}: LtaHistoryModalProps) {
  const [kind, setKind] = useState<LtaActivityKind>("all");
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
      title="Historial de movimientos de acuerdos"
      toolbar={
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FormFieldSelect<LtaActivityKind>
            label="Tipo"
            name="lta_history_kind"
            value={kind}
            onChange={setKind}
            options={KIND_OPTIONS}
            compact
          />
          <FormField
            label="Desde"
            name="lta_history_date_from"
            type="date"
            value={dateFrom}
            onChange={(v) => setDateFrom(String(v))}
            compact
          />
          <FormField
            label="Hasta"
            name="lta_history_date_to"
            type="date"
            value={dateTo}
            onChange={(v) => setDateTo(String(v))}
            compact
          />
        </div>
      }
    >
      {open ? (
        <LtaHistoryPanel
          kind={kind}
          dateFrom={dateFrom}
          dateTo={dateTo}
          enabled={open}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      ) : null}
    </ActivityHistoryModal>
  );
}
