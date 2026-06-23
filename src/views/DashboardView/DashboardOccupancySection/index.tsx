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
import OccupancyDayPanel from "./OccupancyDayPanel";
import OccupancyPortMatrix from "./OccupancyPortMatrix";
import OccupancyStatsStrip from "./OccupancyStatsStrip";
import { buildOccupancySnapshot, filterBookingsByPort } from "./occupancyUtils";

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
    setSelectedDate(null);
    setSelectedPortId(null);
  }, [dateFrom, dateTo]);

  const occupancy = useMemo(
    () => buildOccupancySnapshot(bookings, ports, dateFrom, dateTo),
    [bookings, ports, dateFrom, dateTo],
  );

  const dayBookings = useMemo(() => {
    if (!selectedDate) return [];
    const day = occupancy.byDate[selectedDate] ?? [];
    return filterBookingsByPort(day, selectedPortId);
  }, [occupancy.byDate, selectedDate, selectedPortId]);

  function handleMatrixCell(portId: number, date: string) {
    setSelectedPortId(portId);
    setSelectedDate(date);
  }

  return (
    <ViewSection
      icon={LayoutGrid}
      title="Mapa de ocupación"
      description="Calendario visual de escalas por puerto en el período seleccionado."
      className="mb-8"
    >
      <FormErrorAlert message={error} className="mb-4" />

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-5">
            <Skeleton className="h-[32rem] rounded-2xl xl:col-span-3" />
            <Skeleton className="h-[32rem] rounded-2xl xl:col-span-2" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          <OccupancyStatsStrip stats={occupancy.stats} />

          <div className="grid gap-6 xl:grid-cols-5">
            <div className="xl:col-span-3">
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
            </div>
            <div className="xl:col-span-2">
              <OccupancyDayPanel
                dateIso={selectedDate}
                bookings={dayBookings}
                dateFrom={dateFrom}
                dateTo={dateTo}
              />
            </div>
          </div>

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
