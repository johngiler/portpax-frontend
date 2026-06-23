"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import OccupancyPortMatrix from "./OccupancyPortMatrix";
import { buildOccupancySnapshot } from "./occupancyUtils";

type DashboardOccupancySectionProps = {
  dateFrom: string;
  dateTo: string;
};

export default function DashboardOccupancySection({
  dateFrom,
  dateTo,
}: DashboardOccupancySectionProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPortId, setSelectedPortId] = useState<number | null>(null);

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
    function refresh() {
      loadOccupancy();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") refresh();
    }

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadOccupancy]);

  useEffect(() => {
    setSelectedDate(null);
    setSelectedPortId(null);
  }, [dateFrom, dateTo]);

  const occupancy = useMemo(
    () => buildOccupancySnapshot(bookings, ports, dateFrom, dateTo),
    [bookings, ports, dateFrom, dateTo],
  );

  function handleMatrixCell(portId: number, date: string) {
    setSelectedPortId(portId);
    setSelectedDate(date);
  }

  return (
    <ViewSection
      icon={LayoutGrid}
      title="Mapa de ocupación"
      description="Vista anual de escalas por puerto. Los totales del mapa respetan el período del sidebar."
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
            selectedPortId={selectedPortId}
            onSelectDate={setSelectedDate}
            onSelectPort={setSelectedPortId}
          />

          <OccupancyPortMatrix
            dates={occupancy.dates}
            ports={occupancy.ports}
            byPortDate={occupancy.byPortDate}
            selectedDate={selectedDate}
            selectedPortId={selectedPortId}
            onSelectCell={handleMatrixCell}
          />
        </>
      )}
    </ViewSection>
  );
}
