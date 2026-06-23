"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { fetchBookingByCode } from "@/services/bookings/bookingService";
import type { Booking } from "@/types/booking";
import BookingDetailHero from "./BookingDetailHero";
import BookingDetailSkeleton from "./BookingDetailSkeleton";
import BookingDetailSummary from "./BookingDetailSummary";
import BookingOperationalSection from "./BookingOperationalSection";
import BookingAuditSection from "./BookingAuditSection";
import BookingStatusActions from "./BookingStatusActions";

export default function BookingDetailView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code")?.trim() ?? "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  const loadBooking = useCallback(async () => {
    if (!code) {
      setViewError("Código de reserva no especificado.");
      setBooking(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setViewError(null);
    try {
      const detail = await fetchBookingByCode(code);
      setBooking(detail);
    } catch (err) {
      setViewError(getApiErrorMessage(err, "No se pudo cargar la reserva."));
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  if (loading) {
    return <BookingDetailSkeleton />;
  }

  if (!booking) {
    return (
      <>
        {viewError && <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />}
        {!viewError && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Reserva no encontrada.</p>
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      {viewError && (
        <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />
      )}

      <BookingDetailHero booking={booking} />
      <BookingDetailSummary booking={booking} />
      <BookingOperationalSection
        booking={booking}
        onUpdated={setBooking}
        onError={setViewError}
      />
      <BookingStatusActions
        booking={booking}
        onUpdated={setBooking}
        onDeleted={() => router.push("/bookings")}
        onError={setViewError}
      />
      <BookingAuditSection entries={booking.audit_entries} />
    </div>
  );
}
