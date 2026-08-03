"use client";

import { useMemo, useState } from "react";
import ActivityHistoryModal from "@/components/ui/ActivityHistoryModal";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import type { ShippingLineActivityKind } from "@/services/catalogs/shippingLineActivityService";
import ShippingLinesHistoryPanel from "./ShippingLinesHistoryPanel";

const KIND_OPTIONS: { value: ShippingLineActivityKind; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "crud", label: "CRUD" },
];

type ShippingLinesHistoryModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ShippingLinesHistoryModal({
  open,
  onClose,
}: ShippingLinesHistoryModalProps) {
  const [kind, setKind] = useState<ShippingLineActivityKind>("all");
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
      title="Historial de movimientos de navieras"
      toolbar={
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FormFieldSelect<ShippingLineActivityKind>
            label="Tipo"
            name="line_history_kind"
            value={kind}
            onChange={setKind}
            options={KIND_OPTIONS}
            compact
          />
          <FormField
            label="Desde"
            name="line_history_date_from"
            type="date"
            value={dateFrom}
            onChange={(v) => setDateFrom(String(v))}
            compact
          />
          <FormField
            label="Hasta"
            name="line_history_date_to"
            type="date"
            value={dateTo}
            onChange={(v) => setDateTo(String(v))}
            compact
          />
        </div>
      }
    >
      {open ? (
        <ShippingLinesHistoryPanel
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
