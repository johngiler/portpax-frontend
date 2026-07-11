"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { fetchBookings } from "@/services/bookings/bookingService";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchAllShippingLines } from "@/services/catalogs/shippingLineService";
import { fetchAllVessels } from "@/services/catalogs/vesselService";
import { toIsoDate } from "@/lib/bookingDates";
import { portDisplayName } from "@/types/catalog";
import type { BookingListStatusFilter } from "@/types/booking";
import BookingFilters from "./BookingFilters";
import BookingsList from "./BookingsList";
import BookingsViewSkeleton from "./BookingsViewSkeleton";
import { resolveBookingsDateRange, type BookingsDatePreset } from "./BookingsDateFilters";

const BATCH_SIZE = 20;

function defaultCustomFrom(): string {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function defaultCustomTo(): string {
  const d = new Date();
  d.setDate(d.getDate() + 29);
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function BookingsView() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Awaited<ReturnType<typeof fetchBookings>>["results"]>(
    [],
  );
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BookingListStatusFilter>("");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<BookingListStatusFilter>("");
  const [datePreset, setDatePreset] = useState<BookingsDatePreset>("all");
  const [appliedDatePreset, setAppliedDatePreset] = useState<BookingsDatePreset>("all");
  const [customDateFrom, setCustomDateFrom] = useState(defaultCustomFrom);
  const [customDateTo, setCustomDateTo] = useState(defaultCustomTo);
  const [appliedCustomDateFrom, setAppliedCustomDateFrom] = useState(defaultCustomFrom);
  const [appliedCustomDateTo, setAppliedCustomDateTo] = useState(defaultCustomTo);
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
  const [loadingMore, setLoadingMore] = useState(false);
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

  const listParams = useMemo(() => {
    const dateRange = resolveBookingsDateRange(
      appliedDatePreset,
      appliedCustomDateFrom,
      appliedCustomDateTo,
    );
    return {
      search: appliedSearch,
      status: appliedStatusFilter,
      port: appliedPortFilter > 0 ? appliedPortFilter : undefined,
      shipping_line: appliedShippingLineFilter > 0 ? appliedShippingLineFilter : undefined,
      vessel: appliedVesselFilter > 0 ? appliedVesselFilter : undefined,
      call_date_from: dateRange.call_date_from,
      call_date_to: dateRange.call_date_to,
      ordering: "call_date_proximity" as const,
      pageSize: BATCH_SIZE,
    };
  }, [
    appliedSearch,
    appliedStatusFilter,
    appliedPortFilter,
    appliedShippingLineFilter,
    appliedVesselFilter,
    appliedDatePreset,
    appliedCustomDateFrom,
    appliedCustomDateTo,
  ]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setViewError(null);
    try {
      const data = await fetchBookings({ ...listParams, page: 1 });
      setBookings(data.results);
      setTotalCount(data.count);
      setPage(1);
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudieron cargar las reservas."),
      );
      setBookings([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [listParams]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || bookings.length >= totalCount) return;
    setLoadingMore(true);
    setViewError(null);
    try {
      const nextPage = page + 1;
      const data = await fetchBookings({ ...listParams, page: nextPage });
      setBookings((prev) => [...prev, ...data.results]);
      setPage(nextPage);
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudieron cargar más reservas."),
      );
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, bookings.length, totalCount, page, listParams]);

  function applyFilters() {
    setAppliedSearch(search.trim());
    setAppliedStatusFilter(statusFilter);
    setAppliedPortFilter(portFilter);
    setAppliedShippingLineFilter(shippingLineFilter);
    setAppliedVesselFilter(vesselFilter);
    setAppliedDatePreset(datePreset);
    setAppliedCustomDateFrom(customDateFrom);
    setAppliedCustomDateTo(customDateTo);
  }

  function handleClearFilters() {
    setStatusFilter("");
    setAppliedStatusFilter("");
    setDatePreset("all");
    setAppliedDatePreset("all");
    setCustomDateFrom(defaultCustomFrom());
    setCustomDateTo(defaultCustomTo());
    setAppliedCustomDateFrom(defaultCustomFrom());
    setAppliedCustomDateTo(defaultCustomTo());
    setSearch("");
    setAppliedSearch("");
    setPortFilter(0);
    setAppliedPortFilter(0);
    setShippingLineFilter(0);
    setAppliedShippingLineFilter(0);
    setVesselFilter(0);
    setAppliedVesselFilter(0);
  }

  const hasActiveFilters =
    appliedStatusFilter !== "" ||
    appliedSearch !== "" ||
    appliedPortFilter > 0 ||
    appliedShippingLineFilter > 0 ||
    appliedVesselFilter > 0 ||
    appliedDatePreset !== "all";

  const canClearFilters =
    hasActiveFilters ||
    statusFilter !== "" ||
    search.trim() !== "" ||
    portFilter > 0 ||
    shippingLineFilter > 0 ||
    vesselFilter > 0 ||
    datePreset !== "all";

  const hasMore = bookings.length < totalCount;

  return (
    <>
      <FilterSidebarContent>
        <BookingFilters
          status={statusFilter}
          search={search}
          portFilter={portFilter}
          shippingLineFilter={shippingLineFilter}
          vesselFilter={vesselFilter}
          datePreset={datePreset}
          customDateFrom={customDateFrom}
          customDateTo={customDateTo}
          portOptions={portOptions}
          shippingLineOptions={shippingLineOptions}
          vesselOptions={vesselOptions}
          canClear={canClearFilters}
          onStatusChange={setStatusFilter}
          onSearchChange={setSearch}
          onPortFilterChange={setPortFilter}
          onShippingLineFilterChange={setShippingLineFilter}
          onVesselFilterChange={setVesselFilter}
          onDatePresetChange={setDatePreset}
          onCustomDateFromChange={setCustomDateFrom}
          onCustomDateToChange={setCustomDateTo}
          onApply={applyFilters}
          onClear={handleClearFilters}
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

      {loading && bookings.length === 0 ? (
        <BookingsViewSkeleton />
      ) : (
        <>
          <BookingsList
            bookings={bookings}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />

          {bookings.length > 0 ? (
            <InfiniteScrollFooter
              hasMore={hasMore}
              loading={loadingMore}
              onLoadMore={loadMore}
              loadedCount={bookings.length}
              totalCount={totalCount}
              itemLabel="reservas"
            />
          ) : null}
        </>
      )}
    </>
  );
}
