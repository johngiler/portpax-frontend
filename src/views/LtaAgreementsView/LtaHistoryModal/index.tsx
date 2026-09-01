"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import ActivityHistoryModal from "@/components/ui/ActivityHistoryModal";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import {
  HISTORY_ACTOR_ALL,
  historyActorSelectOptions,
} from "@/lib/auditActor";
import {
  LTA_ACTIVITY_TYPE_OPTIONS,
  type LtaActivityFilterValue,
} from "@/lib/ltaActivityTaxonomy";
import { swrKeys } from "@/lib/swr/keys";
import { fetchLtaActivityActors } from "@/services/bookings/ltaActivityService";
import LtaHistoryPanel from "./LtaHistoryPanel";

type LtaHistoryModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function LtaHistoryModal({
  open,
  onClose,
}: LtaHistoryModalProps) {
  const [typeFilter, setTypeFilter] = useState<LtaActivityFilterValue>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actor, setActor] = useState(HISTORY_ACTOR_ALL);

  const { data: actorsData } = useSWR(
    open ? swrKeys.ltaActivityActors : null,
    fetchLtaActivityActors,
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
      Boolean(typeFilter) ||
      Boolean(dateFrom) ||
      Boolean(dateTo) ||
      Boolean(actor),
    [typeFilter, dateFrom, dateTo, actor],
  );

  function clearFilters() {
    setTypeFilter("");
    setDateFrom("");
    setDateTo("");
    setActor(HISTORY_ACTOR_ALL);
  }

  return (
    <ActivityHistoryModal
      open={open}
      onClose={onClose}
      title="Historial de movimientos de acuerdos"
      toolbar={
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormFieldSelect<LtaActivityFilterValue>
            label="Tipo"
            name="lta_history_type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={LTA_ACTIVITY_TYPE_OPTIONS}
            optionLabel="Todas"
            emptyValue=""
            compact
          />
          <FormFieldSelect<string>
            label="Autor"
            name="lta_history_actor"
            value={actor}
            onChange={setActor}
            options={actorOptions}
            emptyValue={HISTORY_ACTOR_ALL}
            optionLabel="Todos"
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
          typeFilter={typeFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          actor={actor}
          enabled={open}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      ) : null}
    </ActivityHistoryModal>
  );
}
