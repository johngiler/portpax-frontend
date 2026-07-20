"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import Skeleton from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { fetchAllBookings } from "@/services/bookings/bookingService";
import { fetchPositions } from "@/services/catalogs/positionService";
import type { Booking, BookingListStatusFilter } from "@/types/booking";
import type { Position } from "@/types/catalog";
import type { CalendarViewMode } from "../CalendarFilters";
import AnnualGrid from "./AnnualGrid";
import MonthGrid from "./MonthGrid";
import WeekGrid from "./WeekGrid";
import { monthBounds, weekDatesFrom, yearBounds } from "./calendarOpsUtils";
import { useDayTooltip } from "./useDayTooltip";

type OperationalPortCardProps = {
  mode: CalendarViewMode;
  onModeChange: (mode: CalendarViewMode) => void;
  portId: number;
  portName: string;
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

export default function OperationalPortCard({
  mode,
  onModeChange,
  portId,
  portName,
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
}: OperationalPortCardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [previousYearBookings, setPreviousYearBookings] = useState<Booking[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dayTooltip = useDayTooltip(bookings);

  const range = useMemo(() => {
    if (mode === "weekly") {
      const days = weekDatesFrom(weekAnchor);
      return { from: days[0], to: days[6] };
    }
    if (mode === "annual") {
      return yearBounds(year);
    }
    return monthBounds(year, monthIndex);
  }, [mode, weekAnchor, year, monthIndex]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = status || undefined;
      const common = {
        port: portId,
        shipping_line: shippingLineId > 0 ? shippingLineId : undefined,
        status: statusParam,
        search: search.trim() || undefined,
        ordering: "call_date" as const,
        pageSize: 200,
      };
      const positionsPromise = fetchPositions({ port: portId, pageSize: 100 });

      if (mode === "annual") {
        const prev = yearBounds(year - 1);
        const [currentRows, prevRows, positionsResponse] = await Promise.all([
          fetchAllBookings({
            ...common,
            call_date_from: range.from,
            call_date_to: range.to,
          }),
          fetchAllBookings({
            ...common,
            call_date_from: prev.from,
            call_date_to: prev.to,
          }),
          positionsPromise,
        ]);
        setBookings(currentRows);
        setPreviousYearBookings(prevRows);
        setPositions(positionsResponse.results.filter((p) => p.is_active));
      } else {
        const [allBookings, positionsResponse] = await Promise.all([
          fetchAllBookings({
            ...common,
            call_date_from: range.from,
            call_date_to: range.to,
          }),
          positionsPromise,
        ]);
        setBookings(allBookings);
        setPreviousYearBookings([]);
        setPositions(positionsResponse.results.filter((p) => p.is_active));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo cargar el calendario operativo."));
      setBookings([]);
      setPreviousYearBookings([]);
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [portId, shippingLineId, status, search, range.from, range.to, mode, year]);

  useEffect(() => {
    load();
  }, [load]);

  const modeLabel =
    mode === "weekly" ? "Vista semanal" : mode === "monthly" ? "Vista mensual" : "Vista anual";
  const description =
    mode === "weekly"
      ? "7 días × muelles. Colores por corporación; semáforo por día."
      : mode === "monthly"
        ? "Mes completo con calls por día y totales."
        : "12 meses, totales anuales y comparativa YoY.";

  return (
    <ViewSection
      icon={CalendarRange}
      title={`${modeLabel} · ${portName}`}
      description={description}
    >
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        {error ? <FormErrorAlert message={error} className="mb-4" /> : null}
        {loading ? (
          <Skeleton className="h-[28rem] w-full rounded-xl" />
        ) : mode === "weekly" ? (
          <WeekGrid
            weekAnchor={weekAnchor}
            onWeekAnchorChange={onWeekAnchorChange}
            bookings={bookings}
            positions={positions}
            positionFilterId={positionId}
            onDayHover={dayTooltip.onDayHover}
            onDaySelect={dayTooltip.onDaySelect}
          />
        ) : mode === "monthly" ? (
          <MonthGrid
            year={year}
            monthIndex={monthIndex}
            onYearChange={onYearChange}
            onMonthChange={onMonthChange}
            bookings={bookings}
            positions={positions}
            onDayHover={dayTooltip.onDayHover}
            onDaySelect={dayTooltip.onDaySelect}
          />
        ) : (
          <AnnualGrid
            year={year}
            onYearChange={onYearChange}
            bookings={bookings}
            previousYearBookings={previousYearBookings}
            positions={positions}
            onDayHover={dayTooltip.onDayHover}
            onDaySelect={dayTooltip.onDaySelect}
            onSelectMonth={(m) => {
              onMonthChange(m);
              onModeChange("monthly");
            }}
          />
        )}
        {dayTooltip.tooltip}
      </div>
    </ViewSection>
  );
}
