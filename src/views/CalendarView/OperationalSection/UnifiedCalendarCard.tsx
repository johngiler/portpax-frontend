"use client";

import { useMemo } from "react";
import { CalendarRange } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import EmptyState from "@/components/ui/EmptyState";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import { useCalendarBookings } from "@/hooks/swr/useCalendarBookings";
import { useFirstMatchingCallDate } from "@/hooks/swr/useFirstMatchingCallDate";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  bookingMatchesCalendarFocus,
  calendarFocusIsActive,
} from "@/lib/bookingCatalogFocus";
import { parseIsoDate } from "@/lib/bookingDates";
import type { ConflictTypeFilterValue } from "@/lib/bookingConflictLabels";
import type { BookingStatusFilterValue } from "@/types/booking";
import type { CalendarViewModeQuery } from "@/lib/viewFilterQuery";
import FilteredResultsFromHint from "@/views/BookingsView/FilteredResultsFromHint";
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
  /** Empty = all ports in one card. */
  portIds: number[];
  portLabel: string;
  shippingLineId: number;
  vesselId: number;
  statuses: BookingStatusFilterValue[];
  positionId: number;
  search: string;
  conflictFilters?: CalendarConflictFilters;
  /** Imported discrete dates (soft-focus + allowlist). */
  callDates?: string[] | null;
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
  portIds,
  portLabel,
  shippingLineId,
  vesselId,
  statuses,
  positionId,
  search,
  conflictFilters = {},
  callDates = null,
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
  const multiPort = portIds.length !== 1;

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
      portIds,
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
      callDates: callDates?.length ? callDates : undefined,
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
      callDates,
    ],
  );

  const focusActive = calendarFocusIsActive(calendarFocus);
  const hasFocusMatchInView = useMemo(() => {
    if (!focusActive) return true;
    return bookings.some((b) => bookingMatchesCalendarFocus(b, calendarFocus));
  }, [bookings, calendarFocus, focusActive]);

  const firstMatchProbe = useMemo(
    () => ({
      ports: portIds.length > 0 ? portIds : undefined,
      shipping_line: shippingLineId > 0 ? shippingLineId : undefined,
      vessel: vesselId > 0 ? vesselId : undefined,
      position: !multiPort && positionId > 0 ? positionId : undefined,
      statuses: statuses.length > 0 ? statuses : undefined,
      has_conflict: conflictFilters.has_conflict,
      conflict_severity: conflictFilters.conflict_severity,
      conflict_type: conflictFilters.conflict_type,
      call_dates: callDates?.length ? callDates : undefined,
    }),
    [
      portIds,
      shippingLineId,
      vesselId,
      multiPort,
      positionId,
      statuses,
      conflictFilters,
      callDates,
    ],
  );

  const { firstDate } = useFirstMatchingCallDate(
    firstMatchProbe,
    !isLoading && focusActive && !hasFocusMatchInView,
  );

  function goToFirstDate(iso: string) {
    const { year: y, monthIndex: m } = parseIsoDate(iso);
    if (mode === "weekly") {
      onWeekAnchorChange(iso);
      return;
    }
    if (mode === "annual") {
      onYearChange(y);
      return;
    }
    onYearChange(y);
    onMonthChange(m);
  }

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

  const showEmpty =
    !isLoading &&
    !errorMessage &&
    bookings.length === 0 &&
    hasFilters &&
    !firstDate;

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
        {!isLoading && !hasFocusMatchInView && firstDate ? (
          <FilteredResultsFromHint
            firstDate={firstDate}
            onGoToDate={goToFirstDate}
            className="mb-4"
          />
        ) : null}
        {showEmpty ? (
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
