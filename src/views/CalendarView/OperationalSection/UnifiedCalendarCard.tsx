"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import EmptyState from "@/components/ui/EmptyState";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { fetchAllBookings } from "@/services/bookings/bookingService";
import { fetchPositions } from "@/services/catalogs/positionService";
import type { Booking, BookingListStatusFilter } from "@/types/booking";
import type { Position } from "@/types/catalog";
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [previousYearBookings, setPreviousYearBookings] = useState<Booking[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    if (mode === "weekly") {
      const days = weekDatesFrom(weekAnchor);
      return { from: days[0], to: days[6] };
    }
    if (mode === "annual") return yearBounds(year);
    return monthBounds(year, monthIndex);
  }, [mode, weekAnchor, year, monthIndex]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const common = {
        port: portId > 0 ? portId : undefined,
        shipping_line: shippingLineId > 0 ? shippingLineId : undefined,
        vessel: vesselId > 0 ? vesselId : undefined,
        status: status || undefined,
        search: search.trim() || undefined,
        ordering: "call_date" as const,
        pageSize: 500,
      };

      if (mode === "annual") {
        const prev = yearBounds(year - 1);
        const [currentRows, prevRows] = await Promise.all([
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
        ]);
        setBookings(currentRows);
        setPreviousYearBookings(prevRows);
      } else {
        const rows = await fetchAllBookings({
          ...common,
          call_date_from: range.from,
          call_date_to: range.to,
        });
        setBookings(rows);
        setPreviousYearBookings([]);
      }

      if (portId > 0) {
        const positionsResponse = await fetchPositions({
          port: portId,
          pageSize: 100,
        });
        setPositions(positionsResponse.results.filter((p) => p.is_active));
      } else {
        setPositions([]);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo cargar el calendario operativo."));
      setBookings([]);
      setPreviousYearBookings([]);
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [
    portId,
    shippingLineId,
    vesselId,
    status,
    search,
    range.from,
    range.to,
    mode,
    year,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

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
        {error ? <FormErrorAlert message={error} className="mb-4" /> : null}
        {loading ? (
          <BookingsViewSkeleton variant="calendar" />
        ) : !error && bookings.length === 0 && hasFilters ? (
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
