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
  USER_ACTIVITY_TYPE_OPTIONS,
  type UserActivityFilterValue,
} from "@/lib/userActivityTaxonomy";
import { fetchUserActivityActors } from "@/services/accounts/userActivityService";
import UsersHistoryPanel from "./UsersHistoryPanel";

type UsersHistoryModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function UsersHistoryModal({
  open,
  onClose,
}: UsersHistoryModalProps) {
  const [typeFilter, setTypeFilter] = useState<UserActivityFilterValue>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actor, setActor] = useState(HISTORY_ACTOR_ALL);

  const { data: actorsData } = useSWR(
    open ? swrKeys.userActivityActors : null,
    fetchUserActivityActors,
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
      title="Historial de movimientos de usuarios"
      toolbar={
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormFieldSelect<UserActivityFilterValue>
            label="Tipo"
            name="user_history_type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={USER_ACTIVITY_TYPE_OPTIONS}
            optionLabel="Todas"
            emptyValue=""
            compact
          />
          <FormFieldSelect<string>
            label="Autor"
            name="user_history_actor"
            value={actor}
            onChange={setActor}
            options={actorOptions}
            emptyValue={HISTORY_ACTOR_ALL}
            optionLabel="Todos"
            compact
          />
          <FormField
            label="Desde"
            name="user_history_date_from"
            type="date"
            value={dateFrom}
            onChange={(v) => setDateFrom(String(v))}
            compact
          />
          <FormField
            label="Hasta"
            name="user_history_date_to"
            type="date"
            value={dateTo}
            onChange={(v) => setDateTo(String(v))}
            compact
          />
        </div>
      }
    >
      {open ? (
        <UsersHistoryPanel
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
