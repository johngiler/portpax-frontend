"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import TablePagination from "@/components/tables/TablePagination";
import { ApiError } from "@/services/apiClient";
import { fetchBookings } from "@/services/bookings/bookingService";
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
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setViewError(null);
    try {
      const data = await fetchBookings({
        page,
        search: appliedSearch,
        status: statusFilter,
      });
      setBookings(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setViewError(
        err instanceof ApiError ? err.message : "No se pudieron cargar las reservas.",
      );
      setBookings([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, statusFilter]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  function handleStatusChange(next: BookingStatus | "") {
    setStatusFilter(next);
    setPage(1);
  }

  function handleSearchApply() {
    setAppliedSearch(search.trim());
    setPage(1);
  }

  function handleClearFilters() {
    setStatusFilter("");
    setSearch("");
    setAppliedSearch("");
    setPage(1);
  }

  const hasActiveFilters = statusFilter !== "" || appliedSearch !== "";

  return (
    <>
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

      <BookingFilters
        status={statusFilter}
        search={search}
        onStatusChange={handleStatusChange}
        onSearchChange={setSearch}
        onSearchApply={handleSearchApply}
      />

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
