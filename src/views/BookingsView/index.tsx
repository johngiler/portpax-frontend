"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import TablePagination from "@/components/tables/TablePagination";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { fetchBookings } from "@/services/bookings/bookingService";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchAllShippingLines } from "@/services/catalogs/shippingLineService";
import { fetchAllVessels } from "@/services/catalogs/vesselService";
import { portDisplayName } from "@/types/catalog";
import type { BookingStatus } from "@/types/booking";
import BookingFilters from "./BookingFilters";
import BookingsList from "./BookingsList";
import BookingsViewSkeleton from "./BookingsViewSkeleton";

const PAGE_SIZE = 20;

export default function BookingsView() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Awaited<ReturnType<typeof fetchBookings>>["results"]>(
    [],
  );
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<BookingStatus | "">("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [portFilter, setPortFilter] = useState(0);
  const [appliedPortFilter, setAppliedPortFilter] = useState(0);
  const [shippingLineFilter, setShippingLineFilter] = useState(0);
  const [appliedShippingLineFilter, setAppliedShippingLineFilter] = useState(0);
  const [vesselFilter, setVesselFilter] = useState(0);
  const [appliedVesselFilter, setAppliedVesselFilter] = useState(0);
  const [portOptions, setPortOptions] = useState<{ value: number; label: string }[]>([]);
  const [shippingLineOptions, setShippingLineOptions] = useState<{ value: number; label: string }[]>(
    [],
  );
  const [allVessels, setAllVessels] = useState<{ value: number; label: string; lineId: number }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  useEffect(() => {
    fetchPorts({ pageSize: 100 })
      .then((data) =>
        setPortOptions(
          data.results
            .filter((port) => port.is_active)
            .map((port) => ({ value: port.id, label: portDisplayName(port) })),
        ),
      )
      .catch(() => setPortOptions([]));

    fetchAllShippingLines()
      .then((lines) =>
        setShippingLineOptions(
          lines
            .filter((line) => line.is_active)
            .map((line) => ({ value: line.id, label: line.name })),
        ),
      )
      .catch(() => setShippingLineOptions([]));

    fetchAllVessels()
      .then((vessels) =>
        setAllVessels(
          vessels
            .filter((vessel) => vessel.is_active)
            .map((vessel) => ({
              value: vessel.id,
              label: vessel.name,
              lineId: vessel.shipping_line,
            })),
        ),
      )
      .catch(() => setAllVessels([]));
  }, []);

  const vesselOptions = useMemo(() => {
    if (shippingLineFilter > 0) {
      return allVessels.filter((vessel) => vessel.lineId === shippingLineFilter);
    }
    return allVessels;
  }, [allVessels, shippingLineFilter]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setViewError(null);
    try {
      const data = await fetchBookings({
        page,
        search: appliedSearch,
        status: appliedStatusFilter,
        port: appliedPortFilter > 0 ? appliedPortFilter : undefined,
        shipping_line: appliedShippingLineFilter > 0 ? appliedShippingLineFilter : undefined,
        vessel: appliedVesselFilter > 0 ? appliedVesselFilter : undefined,
      });
      setBookings(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudieron cargar las reservas."),
      );
      setBookings([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    appliedSearch,
    appliedStatusFilter,
    appliedPortFilter,
    appliedShippingLineFilter,
    appliedVesselFilter,
  ]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  function applyFilters() {
    setAppliedSearch(search.trim());
    setAppliedStatusFilter(statusFilter);
    setAppliedPortFilter(portFilter);
    setAppliedShippingLineFilter(shippingLineFilter);
    setAppliedVesselFilter(vesselFilter);
    setPage(1);
  }

  function handleClearFilters() {
    setStatusFilter("");
    setAppliedStatusFilter("");
    setSearch("");
    setAppliedSearch("");
    setPortFilter(0);
    setAppliedPortFilter(0);
    setShippingLineFilter(0);
    setAppliedShippingLineFilter(0);
    setVesselFilter(0);
    setAppliedVesselFilter(0);
    setPage(1);
  }

  const hasActiveFilters =
    appliedStatusFilter !== "" ||
    appliedSearch !== "" ||
    appliedPortFilter > 0 ||
    appliedShippingLineFilter > 0 ||
    appliedVesselFilter > 0;

  return (
    <>
      <FilterSidebarContent>
        <BookingFilters
          status={statusFilter}
          search={search}
          portFilter={portFilter}
          shippingLineFilter={shippingLineFilter}
          vesselFilter={vesselFilter}
          portOptions={portOptions}
          shippingLineOptions={shippingLineOptions}
          vesselOptions={vesselOptions}
          onStatusChange={setStatusFilter}
          onSearchChange={setSearch}
          onPortFilterChange={setPortFilter}
          onShippingLineFilterChange={setShippingLineFilter}
          onVesselFilterChange={setVesselFilter}
          onApply={applyFilters}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={CalendarDays}
        title="Reservas"
        description="Solicitudes de escala por puerto, naviera y barco."
        actions={
          <DefaultButton type="button" onClick={() => router.push("/bookings/new")}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Reservar
            </span>
          </DefaultButton>
        }
      />

      {viewError && <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />}

      {loading ? (
        <BookingsViewSkeleton />
      ) : (
        <>
          <BookingsList
            bookings={bookings}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />

          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </>
      )}
    </>
  );
}
