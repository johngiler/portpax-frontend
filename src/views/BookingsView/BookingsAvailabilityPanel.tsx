"use client";

import { useMemo } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { LayoutGrid } from "lucide-react";
import type { AvailabilityListFilters } from "@/hooks/swr/useAvailabilityInfinite";
import type { AvailabilityHeatModeQuery } from "@/lib/viewFilterQuery";
import AvailabilityPortCard from "./AvailabilityPortCard";

type BookingsAvailabilityPanelProps = {
  /** 0 = all ports (one section per port). */
  portId: number;
  portIds: number[];
  dateFrom: string;
  dateTo: string;
  dateAllowlist?: string[] | null;
  heatMode?: AvailabilityHeatModeQuery;
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

  const allowKey = dateAllowlist?.join(",") ?? "";
  const filtersKey = [
    filters.shipping_line ?? 0,
    filters.vessel ?? 0,
    filters.position ?? 0,
    heatMode,
  ].join("|");

  return (
    <div className="space-y-6">
      {targetIds.map((id) => (
        <AvailabilityPortCard
          key={`${id}-${dateFrom}-${dateTo}-${allowKey}-${filtersKey}`}
          portId={id}
          dateFrom={dateFrom}
          dateTo={dateTo}
          dateAllowlist={dateAllowlist}
          heatMode={heatMode}
          filters={filters}
          canBook={canBook}
          returnTo={returnTo}
          onStartDateChange={onStartDateChange}
        />
      ))}
    </div>
  );
}
