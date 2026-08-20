"use client";

import { useCallback, useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { LayoutGrid } from "lucide-react";
import type { AvailabilityListFilters } from "@/hooks/swr/useAvailabilityInfinite";
import type { AvailabilityHeatModeQuery } from "@/lib/viewFilterQuery";
import AvailabilityPortCard from "./AvailabilityPortCard";
import {
  BOOKINGS_FILTERED_EMPTY_DESCRIPTION,
  BOOKINGS_FILTERED_EMPTY_TITLE,
} from "./bookingsEmptyCopy";

type PortDisplayState = "loading" | "visible" | "empty" | "error";

type BookingsAvailabilityPanelProps = {
  /** 0 = all ports (one section per port). */
  portId: number;
  portIds: number[];
  dateFrom: string;
  dateTo: string;
  dateAllowlist?: string[] | null;
  heatMode?: AvailabilityHeatModeQuery;
  /** Occupancy only: exact ships-per-day (0 = any). */
  density?: number;
  filters?: AvailabilityListFilters;
  canBook?: boolean;
  returnTo?: string | null;
  onClearFilters?: () => void;
  onStartDateChange?: (isoDate: string) => void;
};

export default function BookingsAvailabilityPanel({
  portId,
  portIds,
  dateFrom,
  dateTo,
  dateAllowlist = null,
  heatMode = "availability",
  density = 0,
  filters = {},
  canBook = false,
  returnTo = null,
  onClearFilters,
  onStartDateChange,
}: BookingsAvailabilityPanelProps) {
  const targetIds = useMemo(() => {
    if (portId > 0) return [portId];
    return portIds.filter((id) => id > 0);
  }, [portId, portIds]);

  const [portStates, setPortStates] = useState<Record<number, PortDisplayState>>(
    {},
  );

  const allowKey = dateAllowlist?.join(",") ?? "";
  const filtersKey = [
    filters.shipping_line ?? 0,
    filters.vessel ?? 0,
    filters.position ?? 0,
    (filters.statuses ?? []).join(","),
    filters.has_conflict === true
      ? "1"
      : filters.has_conflict === false
        ? "0"
        : "",
    filters.conflict_severity ?? "",
    filters.conflict_type ?? "",
    heatMode,
    density,
  ].join("|");

  const queryKey = `${filtersKey}|${dateFrom}|${dateTo}|${allowKey}|${targetIds.join(",")}`;

  const onDisplayStateChange = useCallback(
    (id: number, state: PortDisplayState) => {
      setPortStates((prev) =>
        prev[id] === state ? prev : { ...prev, [id]: state },
      );
    },
    [],
  );

  const hasFilters =
    Boolean(filters.shipping_line) ||
    Boolean(filters.vessel) ||
    Boolean(filters.position) ||
    Boolean(filters.statuses?.length) ||
    filters.has_conflict !== undefined ||
    Boolean(filters.conflict_severity) ||
    Boolean(filters.conflict_type) ||
    density > 0 ||
    Boolean(dateAllowlist?.length) ||
    portId > 0 ||
    heatMode === "occupancy";

  if (targetIds.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="Sin puertos"
        description="No hay puertos activos para mostrar disponibilidad."
        onClearFilters={onClearFilters}
      />
    );
  }

  const allResolved = targetIds.every(
    (id) => portStates[id] && portStates[id] !== "loading",
  );
  const anyVisible = targetIds.some((id) => portStates[id] === "visible");
  const showFilteredEmpty = allResolved && !anyVisible;

  return (
    <div className="space-y-6">
      {showFilteredEmpty ? (
        <EmptyState
          icon={LayoutGrid}
          filtered={hasFilters}
          title={
            hasFilters
              ? BOOKINGS_FILTERED_EMPTY_TITLE
              : "Sin disponibilidad en el rango"
          }
          description={
            hasFilters
              ? BOOKINGS_FILTERED_EMPTY_DESCRIPTION
              : "No hay días para mostrar en el rango aplicado. Ajusta fechas o filtros."
          }
          onClearFilters={hasFilters ? onClearFilters : undefined}
        />
      ) : null}

      {/* Keep cards mounted so empty/loading reports survive tab remounts and filter changes. */}
      <div
        className={showFilteredEmpty ? "hidden" : "space-y-6"}
        aria-hidden={showFilteredEmpty || undefined}
      >
        {targetIds.map((id) => (
          <AvailabilityPortCard
            key={`${id}-${queryKey}`}
            portId={id}
            dateFrom={dateFrom}
            dateTo={dateTo}
            dateAllowlist={dateAllowlist}
            heatMode={heatMode}
            density={density}
            filters={filters}
            canBook={canBook}
            returnTo={returnTo}
            onStartDateChange={onStartDateChange}
            onDisplayStateChange={onDisplayStateChange}
          />
        ))}
      </div>
    </div>
  );
}
