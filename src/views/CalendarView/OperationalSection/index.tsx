"use client";

import { CalendarRange } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import type { BookingListStatusFilter } from "@/types/booking";
import type { CalendarViewMode } from "../CalendarFilters";
import OperationalPortCard from "./OperationalPortCard";

type OperationalSectionProps = {
  mode: CalendarViewMode;
  onModeChange: (mode: CalendarViewMode) => void;
  portIds: number[];
  portsById: Map<number, string>;
  shippingLineId: number;
  status: BookingListStatusFilter;
  positionId: number;
  search: string;
  weekAnchor: string;
  onWeekAnchorChange: (iso: string) => void;
  year: number;
  onYearChange: (year: number) => void;
  monthIndex: number;
  onMonthChange: (monthIndex: number) => void;
  onClearFilters?: () => void;
};

export default function OperationalSection({
  mode,
  onModeChange,
  portIds,
  portsById,
  shippingLineId,
  status,
  positionId,
  search,
  weekAnchor,
  onWeekAnchorChange,
  year,
  onYearChange,
  monthIndex,
  onMonthChange,
  onClearFilters,
}: OperationalSectionProps) {
  if (portIds.length === 0) {
    return (
      <EmptyState
        icon={CalendarRange}
        title="Selecciona uno o más puertos"
        description="Cada puerto seleccionado se muestra en su propia card (semana, mes o año). Elige puertos en el panel de filtros y pulsa Aplicar."
      />
    );
  }

  const hasFilters =
    shippingLineId > 0 || positionId > 0 || Boolean(status) || Boolean(search.trim());

  return (
    <div className="space-y-4">
      {portIds.map((portId) => (
        <OperationalPortCard
          key={portId}
          mode={mode}
          onModeChange={onModeChange}
          portId={portId}
          portName={portsById.get(portId) ?? `Puerto #${portId}`}
          shippingLineId={shippingLineId}
          status={status}
          positionId={portIds.length === 1 ? positionId : 0}
          search={search}
          hasFilters={hasFilters}
          onClearFilters={onClearFilters}
          weekAnchor={weekAnchor}
          onWeekAnchorChange={onWeekAnchorChange}
          year={year}
          onYearChange={onYearChange}
          monthIndex={monthIndex}
          onMonthChange={onMonthChange}
        />
      ))}
    </div>
  );
}
