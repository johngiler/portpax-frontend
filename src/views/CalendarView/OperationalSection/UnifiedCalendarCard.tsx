"use client";

import { useMemo } from "react";
import { CalendarRange } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import EmptyState from "@/components/ui/EmptyState";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import { useCalendarBookings } from "@/hooks/swr/useCalendarBookings";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import type { ConflictTypeFilterValue } from "@/lib/bookingConflictLabels";
import type { BookingStatusFilterValue } from "@/types/booking";
import type { CalendarViewModeQuery } from "@/lib/viewFilterQuery";
import {
  BOOKINGS_FILTERED_EMPTY_DESCRIPTION,
  BOOKINGS_FILTERED_EMPTY_TITLE,
} from "@/views/BookingsView/bookingsEmptyCopy";
import AnnualGrid from "./AnnualGrid";
import CalendarColorLegend from "./CalendarColorLegend";
import MonthGrid from "./MonthGrid";
import WeekGrid from "./WeekGrid";
import {
  monthBounds,
  seasonBounds,
  weekDatesFrom,
  type CalendarSeason,
} from "./calendarOpsUtils";

type CalendarConflictFilters = {
  has_conflict?: boolean;
  conflict_severity?: "yellow" | "red" | "green";
  conflict_type?: ConflictTypeFilterValue;
};

type UnifiedCalendarCardProps = {
  mode: CalendarViewModeQuery;
  onModeChange: (mode: CalendarViewModeQuery) => void;
  /** 0 = all ports in one card. */
  portId: number;
  portLabel: string;
  shippingLineId: number;
  vesselId: number;
  statuses: BookingStatusFilterValue[];
  positionId: number;
  search: string;
  conflictFilters?: CalendarConflictFilters;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  weekAnchor: string;
  onWeekAnchorChange: (iso: string) => void;
  year: number;
  onYearChange: (year: number) => void;
  monthIndex: number;
  onMonthChange: (monthIndex: number) => void;
  season: CalendarSeason;
  onSeasonChange: (season: CalendarSeason) => void;
};

export default function UnifiedCalendarCard({
  mode,
  onModeChange,
  portId,
  portLabel,
  shippingLineId,
  vesselId,
  statuses,
  positionId,
  search,
  conflictFilters = {},
  hasFilters = false,
  onClearFilters,
  weekAnchor,
  onWeekAnchorChange,
  year,
  onYearChange,
  monthIndex,
  onMonthChange,
  season,
  onSeasonChange,
}: UnifiedCalendarCardProps) {
  const multiPort = portId <= 0;

  const range = useMemo(() => {
    if (mode === "weekly") {
      const days = weekDatesFrom(weekAnchor);
      return { from: days[0], to: days[6] };
    }
    if (mode === "annual") return seasonBounds(year, season);
    return monthBounds(year, monthIndex);
  }, [mode, weekAnchor, year, monthIndex, season]);

  const { bookings, previousYearBookings, positions, isLoading, error } =
    useCalendarBookings({
      mode,
      portId,
      search,
      from: range.from,
      to: range.to,
      year,
      season,
    });

  const calendarFocus = useMemo(
    () => ({
      statuses,
      vesselId,
      shippingLineId,
      positionId: multiPort ? 0 : positionId,
      has_conflict: conflictFilters.has_conflict,
      conflict_severity: conflictFilters.conflict_severity,
      conflict_type: conflictFilters.conflict_type,
    }),
    [
      statuses,
      vesselId,
      shippingLineId,
      multiPort,
      positionId,
      conflictFilters.has_conflict,
      conflictFilters.conflict_severity,
      conflictFilters.conflict_type,
    ],
  );

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
        : "7 días × posiciones. Colores por corporación; semáforo por día."
      : mode === "monthly"
        ? multiPort
          ? "Mes completo: todos los puertos en un mismo calendario, organizados por día y puerto."
          : "Mes completo con calls por día y totales."
        : multiPort
          ? "Año / temporada por puerto (filas). Selecciona un puerto para ver posiciones."
          : "Barcos por posición · totales ships y PAX · Summer / Winter.";

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
            showCorp
            showTraffic={mode !== "annual"}
          />
        </div>
        {errorMessage ? (
          <FormErrorAlert message={errorMessage} className="mb-4" />
        ) : null}
        {!isLoading && !errorMessage && bookings.length === 0 && hasFilters ? (
          <EmptyState
            icon={CalendarRange}
            filtered
            title={BOOKINGS_FILTERED_EMPTY_TITLE}
            description={BOOKINGS_FILTERED_EMPTY_DESCRIPTION}
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
            loading={isLoading}
            focus={calendarFocus}
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
            loading={isLoading}
            focus={calendarFocus}
          />
        ) : (
          <AnnualGrid
            year={year}
            onYearChange={onYearChange}
            season={season}
            onSeasonChange={onSeasonChange}
            bookings={bookings}
            previousYearBookings={previousYearBookings}
            positions={positions}
            positionFilterId={effectivePositionId}
            multiPort={multiPort}
            loading={isLoading}
            focus={calendarFocus}
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
