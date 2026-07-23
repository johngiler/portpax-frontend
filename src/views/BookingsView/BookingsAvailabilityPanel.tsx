"use client";

import { useMemo } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { LayoutGrid } from "lucide-react";
import AvailabilityPortCard from "./AvailabilityPortCard";

type BookingsAvailabilityPanelProps = {
  /** 0 = all ports (one section per port). */
  portId: number;
  portIds: number[];
  dateFrom: string;
  dateTo: string;
  canBook?: boolean;
  returnTo?: string | null;
  onClearFilters?: () => void;
};

export default function BookingsAvailabilityPanel({
  portId,
  portIds,
  dateFrom,
  dateTo,
  canBook = false,
  returnTo = null,
  onClearFilters,
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

  return (
    <div className="space-y-6">
      {targetIds.map((id) => (
        <AvailabilityPortCard
          key={`${id}-${dateFrom}-${dateTo}`}
          portId={id}
          dateFrom={dateFrom}
          dateTo={dateTo}
          canBook={canBook}
          returnTo={returnTo}
        />
      ))}
    </div>
  );
}
