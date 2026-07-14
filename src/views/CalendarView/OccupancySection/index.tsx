"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutGrid } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import Skeleton from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { fetchAllBookings } from "@/services/bookings/bookingService";
import { fetchPorts } from "@/services/catalogs/portService";
import type { Booking } from "@/types/booking";
import type { Port } from "@/types/catalog";
import OccupancyCalendar from "./OccupancyCalendar";
import OccupancyDayTooltip, {
  type TooltipAnchor,
} from "./OccupancyDayTooltip";
import OccupancyPortMatrix from "./OccupancyPortMatrix";
import { buildOccupancySnapshot, filterBookingsByPort } from "./occupancyUtils";

type OccupancySectionProps = {
  dateFrom: string;
  dateTo: string;
};

export default function OccupancySection({
  dateFrom,
  dateTo,
}: OccupancySectionProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedAnchor, setSelectedAnchor] = useState<TooltipAnchor | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoverAnchor, setHoverAnchor] = useState<TooltipAnchor | null>(null);
  const [selectedPortId, setSelectedPortId] = useState<number | null>(null);
  const hoverClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadOccupancy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allBookings, portsResponse] = await Promise.all([
        fetchAllBookings({
          call_date_from: dateFrom,
          call_date_to: dateTo,
          ordering: "call_date",
        }),
        fetchPorts({ pageSize: 100 }),
      ]);
      setBookings(allBookings);
      setPorts(portsResponse.results.filter((port) => port.is_active));
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo cargar el mapa de ocupación."));
      setBookings([]);
      setPorts([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadOccupancy();
  }, [loadOccupancy]);

  useEffect(() => {
    setSelectedDate(null);
    setSelectedAnchor(null);
    setHoveredDate(null);
    setHoverAnchor(null);
    setSelectedPortId(null);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    return () => {
      if (hoverClearTimer.current) clearTimeout(hoverClearTimer.current);
    };
  }, []);

  const occupancy = useMemo(
    () => buildOccupancySnapshot(bookings, ports, dateFrom, dateTo),
    [bookings, ports, dateFrom, dateTo],
  );

  const detailDate = hoveredDate ?? selectedDate;
  const tooltipAnchor = hoverAnchor ?? selectedAnchor;
  const detailBookings = useMemo(() => {
    if (!detailDate) return [];
    return filterBookingsByPort(occupancy.byDate[detailDate] ?? [], selectedPortId);
  }, [detailDate, occupancy.byDate, selectedPortId]);

  const pinned = Boolean(selectedDate && !hoveredDate);

  function clearHoverTimer() {
    if (hoverClearTimer.current) {
      clearTimeout(hoverClearTimer.current);
      hoverClearTimer.current = null;
    }
  }

  function handleSelectDate(date: string | null, anchor?: TooltipAnchor) {
    clearHoverTimer();
    setHoveredDate(null);
    setHoverAnchor(null);
    setSelectedDate(date);
    setSelectedAnchor(date && anchor ? anchor : null);
  }

  function handleHoverDate(date: string | null, anchor?: TooltipAnchor) {
    clearHoverTimer();
    if (date && anchor) {
      setHoveredDate(date);
      setHoverAnchor(anchor);
      return;
    }
    hoverClearTimer.current = setTimeout(() => {
      setHoveredDate(null);
      setHoverAnchor(null);
    }, 140);
  }

  function handleCloseTooltip() {
    clearHoverTimer();
    setHoveredDate(null);
    setHoverAnchor(null);
    setSelectedDate(null);
    setSelectedAnchor(null);
  }

  function handleMatrixCell(portId: number, date: string, anchor: TooltipAnchor) {
    clearHoverTimer();
    setSelectedPortId(portId);
    setSelectedDate(date);
    setSelectedAnchor(anchor);
    setHoveredDate(null);
    setHoverAnchor(null);
  }

  return (
    <ViewSection
      icon={LayoutGrid}
      title="Mapa de ocupación"
      description="Vista anual de escalas por puerto. Los totales respetan el período del sidebar."
      className="mb-8"
    >
      <FormErrorAlert message={error} className="mb-4" />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[48rem] rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          <OccupancyCalendar
            dateFrom={dateFrom}
            dateTo={dateTo}
            ports={occupancy.ports}
            byDate={occupancy.byDate}
            selectedDate={selectedDate}
            hoveredDate={hoveredDate}
            selectedPortId={selectedPortId}
            onSelectDate={handleSelectDate}
            onHoverDate={handleHoverDate}
            onSelectPort={setSelectedPortId}
          />

          {detailDate && tooltipAnchor ? (
            <OccupancyDayTooltip
              date={detailDate}
              bookings={detailBookings}
              anchor={tooltipAnchor}
              pinned={pinned}
              onClose={handleCloseTooltip}
              onKeepOpen={clearHoverTimer}
              onHoverLeave={() => handleHoverDate(null)}
            />
          ) : null}

          <OccupancyPortMatrix
            dates={occupancy.dates}
            ports={occupancy.ports}
            byPortDate={occupancy.byPortDate}
            selectedDate={selectedDate}
            selectedPortId={selectedPortId}
            onSelectCell={handleMatrixCell}
            onHoverDate={handleHoverDate}
          />
        </>
      )}
    </ViewSection>
  );
}
