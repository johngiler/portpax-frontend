"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import MainTable, {
  MainTableBody,
  MainTableEmpty,
  MainTableHeader,
  MainTableRow,
  MainTableTd,
  MainTableTh,
} from "@/components/tables/MainTable";
import TablePagination from "@/components/tables/TablePagination";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { ApiError } from "@/services/apiClient";
import { fetchBookings } from "@/services/bookings/bookingService";
import { bookingStatusLabel, type Booking } from "@/types/booking";
import BookingsViewSkeleton from "./BookingsViewSkeleton";

const PAGE_SIZE = 20;

export default function BookingsView() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setViewError(null);
    try {
      const data = await fetchBookings({ page });
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
  }, [page]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

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

      {loading ? (
        <BookingsViewSkeleton />
      ) : (
        <>
          <MainTable>
            <table className="w-full min-w-[48rem]">
              <MainTableHeader>
                <MainTableTh>Código</MainTableTh>
                <MainTableTh>Puerto</MainTableTh>
                <MainTableTh>Naviera</MainTableTh>
                <MainTableTh>Barco</MainTableTh>
                <MainTableTh>Fecha</MainTableTh>
                <MainTableTh>Estado</MainTableTh>
              </MainTableHeader>
              <MainTableBody>
                {bookings.length === 0 ? (
                  <MainTableEmpty colSpan={6}>
                    Sin reservas. Crea el primero con Reservar.
                  </MainTableEmpty>
                ) : (
                  bookings.map((booking) => (
                    <MainTableRow key={booking.id}>
                      <MainTableTd>
                        <code className="text-xs font-semibold text-[var(--admin-accent)]">
                          {booking.booking_code}
                        </code>
                      </MainTableTd>
                      <MainTableTd>{booking.port_name}</MainTableTd>
                      <MainTableTd>{booking.shipping_line_name}</MainTableTd>
                      <MainTableTd>{booking.vessel_name}</MainTableTd>
                      <MainTableTd>{formatIsoDateLabel(booking.call_date, "short")}</MainTableTd>
                      <MainTableTd>
                        <span
                          className={[
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            booking.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : booking.status === "cancelled"
                                ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                                : "bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]",
                          ].join(" ")}
                        >
                          {bookingStatusLabel(booking.status)}
                        </span>
                      </MainTableTd>
                    </MainTableRow>
                  ))
                )}
              </MainTableBody>
            </table>
          </MainTable>

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
