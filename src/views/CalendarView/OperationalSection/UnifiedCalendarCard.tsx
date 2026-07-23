"use client";

import { useMemo } from "react";
import { CalendarRange } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import EmptyState from "@/components/ui/EmptyState";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import { useCalendarBookings } from "@/hooks/swr/useCalendarBookings";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import type { BookingListStatusFilter } from "@/types/booking";
import type { CalendarViewModeQuery } from "@/lib/viewFilterQuery";
import BookingsViewSkeleton from "@/views/BookingsView/BookingsViewSkeleton";
import AnnualGrid from "./AnnualGrid";
import CalendarColorLegend from "./CalendarColorLegend";
import MonthGrid from "./MonthGrid";
import WeekGrid from "./WeekGrid";
import { monthBounds, weekDatesFrom, yearBounds } from "./calendarOpsUtils";

type UnifiedCalendarCardProps = {
  mode: CalendarViewModeQuery;
  onModeChange: (mode: CalendarViewModeQuery) => void;
  /** 0 = all ports in one card. */
  portId: number;
  portLabel: string;
  shippingLineId: number;
  vesselId: number;
  status: BookingListStatusFilter;
  positionId: number;
  search: string;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  weekAnchor: string;
  onWeekAnchorChange: (iso: string) => void;
  year: number;
  onYearChange: (year: number) => void;
  monthIndex: number;
  onMonthChange: (monthIndex: number) => void;
};

export default function UnifiedCalendarCard({
  mode,
  onModeChange,
  portId,
  portLabel,
  shippingLineId,
  vesselId,
  status,
  positionId,
  search,
  hasFilters = false,
  onClearFilters,
  weekAnchor,
  onWeekAnchorChange,
  year,
  onYearChange,
  monthIndex,
  onMonthChange,
}: UnifiedCalendarCardProps) {
  const multiPort = portId <= 0;

  const range = useMemo(() => {
    if (mode === "weekly") {
      const days = weekDatesFrom(weekAnchor);
      return { from: days[0], to: days[6] };
    }
    if (mode === "annual") return yearBounds(year);
    return monthBounds(year, monthIndex);
  }, [mode, weekAnchor, year, monthIndex]);

  const { bookings, previousYearBookings, positions, isLoading, error } =
    useCalendarBookings({
      mode,
      portId,
      shippingLineId,
      vesselId,
      status,
      search,
      from: range.from,
      to: range.to,
      year,
    });

  const modeLabel =
    mode === "weekly"
      ? "Vista semanal"
      : mode === "monthly"
        ? "Vista mensual"
        : "Vista anual";

  const description =
    mode === "weekly"
      ? multiPort
        ? "Semana con todos los puertos en una sola vista, agrupados por día."
        : "7 días × muelles. Colores por corporación; semáforo por día."
      : mode === "monthly"
        ? multiPort
          ? "Mes completo: todos los puertos en un mismo calendario, organizados por día y puerto."
          : "Mes completo con calls por día y totales."
        : multiPort
          ? "Año completo con todos los puertos y comparativa YoY."
          : "12 meses, totales anuales y comparativa YoY.";

  const effectivePositionId = multiPort ? 0 : positionId;
  const errorMessage = error
    ? getApiErrorMessage(error, "No se pudo cargar el calendario operativo.")
    : null;

  return (
    <ViewSection
      icon={CalendarRange}
      title={`${modeLabel} · ${portLabel}`}
      description={description}
    >
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-4">
          <CalendarColorLegend
            showCorp={mode !== "annual"}
            showTraffic={mode === "weekly" || mode === "monthly"}
          />
        </div>
        {errorMessage ? (
          <FormErrorAlert message={errorMessage} className="mb-4" />
        ) : null}
        {isLoading ? (
          <BookingsViewSkeleton variant="calendar" />
        ) : !errorMessage && bookings.length === 0 && hasFilters ? (
          <EmptyState
            icon={CalendarRange}
            filtered
            title="Sin escalas con estos filtros"
            description="No hay escalas en el período con los filtros aplicados. Ajusta puerto, naviera, barco, estado o búsqueda."
            onClearFilters={onClearFilters}
          />
        ) : mode === "weekly" ? (
          <WeekGrid
            weekAnchor={weekAnchor}
            onWeekAnchorChange={onWeekAnchorChange}
            bookings={bookings}
            positions={positions}
            positionFilterId={effectivePositionId}
            multiPort={multiPort}
          />
        ) : mode === "monthly" ? (
          <MonthGrid
            year={year}
            monthIndex={monthIndex}
            onYearChange={onYearChange}
            onMonthChange={onMonthChange}
            bookings={bookings}
            positions={positions}
            multiPort={multiPort}
          />
        ) : (
          <AnnualGrid
            year={year}
            onYearChange={onYearChange}
            bookings={bookings}
            previousYearBookings={previousYearBookings}
            positions={positions}
            onSelectMonth={(m) => {
              onMonthChange(m);
              onModeChange("monthly");
            }}
          />
        )}
      </div>
    </ViewSection>
  );
}
