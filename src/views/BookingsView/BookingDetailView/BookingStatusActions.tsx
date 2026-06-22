"use client";

import { useState } from "react";
import { CheckCircle2, Trash2, XCircle } from "lucide-react";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { ApiError } from "@/services/apiClient";
import { deleteBooking, updateBookingStatus } from "@/services/bookings/bookingService";
import {
  bookingNextStatuses,
  type Booking,
  type BookingStatus,
} from "@/types/booking";

type BookingStatusActionsProps = {
  booking: Booking;
  onUpdated: (booking: Booking) => void;
  onDeleted: () => void;
  onError: (message: string | null) => void;
};

type PendingAction = BookingStatus | null;

export default function BookingStatusActions({
  booking,
  onUpdated,
  onDeleted,
  onError,
}: BookingStatusActionsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const nextStatuses = bookingNextStatuses(booking.status);

  async function handleDelete() {
    setDeleting(true);
    onError(null);
    try {
      await deleteBooking(booking.id);
      onDeleted();
    } catch (err) {
      onError(
        err instanceof ApiError ? err.message : "No se pudo eliminar la reserva.",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function applyStatus(status: BookingStatus) {
    setSaving(true);
    onError(null);
    try {
      const updated = await updateBookingStatus(booking.id, status);
      onUpdated(updated);
    } catch (err) {
      onError(
        err instanceof ApiError ? err.message : "No se pudo actualizar el estado de la reserva.",
      );
    } finally {
      setSaving(false);
      setPendingAction(null);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Estado</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Gestiona la confirmación o cancelación de esta escala.
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      {nextStatuses.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {nextStatuses.includes("confirmed") ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => setPendingAction("confirmed")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
              Confirmar reserva
            </button>
          ) : null}
          {nextStatuses.includes("cancelled") ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => setPendingAction("cancelled")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
            >
              <XCircle className="h-4 w-4" strokeWidth={2} />
              Cancelar reserva
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-300">
            Esta reserva está cancelada. Puedes eliminarla del sistema si ya no necesitas el
            registro.
          </p>
          <ConfirmDeleteButton
            deleteLabel={booking.booking_code}
            onDelete={handleDelete}
            disabled={deleting}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
            ariaLabel="Eliminar reserva cancelada"
            title="Eliminar reserva"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
            Eliminar reserva
          </ConfirmDeleteButton>
        </div>
      )}

      <ConfirmModal
        open={pendingAction === "confirmed"}
        onClose={() => setPendingAction(null)}
        onConfirm={() => applyStatus("confirmed")}
        title="Confirmar reserva"
        message={`¿Confirmar la escala de ${booking.vessel_name} en ${booking.port_name}?`}
        confirmLabel="Confirmar"
      />

      <ConfirmModal
        open={pendingAction === "cancelled"}
        onClose={() => setPendingAction(null)}
        onConfirm={() => applyStatus("cancelled")}
        title="Cancelar reserva"
        message={`¿Cancelar la reserva ${booking.booking_code}? Esta acción no se puede revertir.`}
        confirmLabel="Cancelar reserva"
        danger
      />
    </section>
  );
}
