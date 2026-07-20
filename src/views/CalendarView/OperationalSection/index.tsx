"use client";

import { CalendarRange } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
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
}: OperationalSectionProps) {
  if (portIds.length === 0) {
    return (
      <ViewSection
        icon={CalendarRange}
        title="Calendario operativo"
        description="Selecciona uno o más puertos en el panel de filtros."
      >
        <p className="px-5 py-8 text-sm text-zinc-500 dark:text-zinc-400 sm:px-6">
          Cada puerto seleccionado se muestra en su propia card (semana, mes o año).
        </p>
      </ViewSection>
    );
  }

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
