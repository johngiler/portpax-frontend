"use client";

import { useState } from "react";
import { CheckCircle2, Trash2, XCircle } from "lucide-react";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import DefaultButton from "@/components/buttons/DefaultButton";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { ApiError } from "@/services/apiClient";
import { getApiErrorMessage, translateApiMessage } from "@/lib/apiFormErrors";
import { deleteBooking, updateBooking } from "@/services/bookings/bookingService";
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

function formatValidationError(err: unknown): string {
  if (err instanceof ApiError && err.fieldErrors?.status) {
    return err.fieldErrors.status.map((item) => translateApiMessage(String(item))).join(" · ");
  }
  return getApiErrorMessage(err, "No se pudo actualizar el estado de la reserva.");
}

export default function BookingStatusActions({
  booking,
  onUpdated,
  onDeleted,
  onError,
}: BookingStatusActionsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [cancelEvidence, setCancelEvidence] = useState<File | null>(null);
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
        getApiErrorMessage(err, "No se pudo eliminar la reserva."),
      );
    } finally {
      setDeleting(false);
    }
  }

  async function applyConfirm() {
    setSaving(true);
    onError(null);
    try {
      const updated = await updateBooking(booking.id, { status: "confirmed" });
      onUpdated(updated);
    } catch (err) {
      onError(formatValidationError(err));
    } finally {
      setSaving(false);
      setPendingAction(null);
    }
  }

  async function applyCancel() {
    if (!cancelEvidence) {
      onError("Selecciona un archivo de evidencia para cancelar.");
      return;
    }
    setSaving(true);
    onError(null);
    try {
      const updated = await updateBooking(booking.id, {
        status: "cancelled",
        cancellation_evidence: cancelEvidence,
      });
      onUpdated(updated);
      setCancelEvidence(null);
    } catch (err) {
      onError(formatValidationError(err));
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
          {booking.cancellation_evidence_url ? (
            <a
              href={booking.cancellation_evidence_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[var(--admin-accent)] hover:underline"
            >
              Ver evidencia de cancelación
            </a>
          ) : null}
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
        onConfirm={applyConfirm}
        title="Confirmar reserva"
        message={`¿Confirmar la escala de ${booking.vessel_name} en ${booking.port_name}? Se asignará folio y se generará el PDF de confirmación.`}
        confirmLabel="Confirmar"
      />

      <Modal
        open={pendingAction === "cancelled"}
        onClose={() => {
          setPendingAction(null);
          setCancelEvidence(null);
        }}
        title="Cancelar reserva"
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Adjunta evidencia de la cancelación (clima, fuerza mayor, etc.).
        </p>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="mt-4 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-[var(--admin-accent)]/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--admin-accent)]"
          onChange={(event) => setCancelEvidence(event.target.files?.[0] ?? null)}
        />
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setPendingAction(null);
              setCancelEvidence(null);
            }}
            className="cursor-pointer rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            Volver
          </button>
          <DefaultButton type="button" onClick={applyCancel} disabled={saving || !cancelEvidence}>
            {saving ? "Cancelando…" : "Confirmar cancelación"}
          </DefaultButton>
        </div>
      </Modal>
    </section>
  );
}
