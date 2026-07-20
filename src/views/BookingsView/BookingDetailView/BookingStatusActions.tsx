"use client";

import { useState } from "react";
import { CheckCircle2, CirclePause, Flag, Trash2, XCircle } from "lucide-react";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FormField } from "@/components/ui/FormField";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { ApiError } from "@/services/apiClient";
import { getApiErrorMessage, translateApiMessage } from "@/lib/apiFormErrors";
import { deleteBooking, updateBooking } from "@/services/bookings/bookingService";
import {
  bookingNextStatuses,
  CANCELLATION_REASON_OPTIONS,
  type Booking,
  type BookingStatus,
  type CancellationReason,
} from "@/types/booking";

type BookingStatusActionsProps = {
  booking: Booking;
  onUpdated: (booking: Booking) => void;
  onDeleted: () => void;
  onError: (message: string | null) => void;
  /** When false, hide write actions (viewer). */
  canWrite?: boolean;
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
  canWrite = true,
}: BookingStatusActionsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [cancelReason, setCancelReason] = useState<CancellationReason | "">("");
  const [cancelEvidence, setCancelEvidence] = useState<File | null>(null);
  const [actualPax, setActualPax] = useState(
    booking.actual_pax != null ? String(booking.actual_pax) : "",
  );
  const [etaReal, setEtaReal] = useState(booking.eta_real?.slice(0, 5) ?? "");
  const [etdReal, setEtdReal] = useState(booking.etd_real?.slice(0, 5) ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const nextStatuses = canWrite ? bookingNextStatuses(booking.status) : [];

  async function handleDelete() {
    setDeleting(true);
    onError(null);
    try {
      await deleteBooking(booking.id);
      onDeleted();
    } catch (err) {
      onError(getApiErrorMessage(err, "No se pudo eliminar la reserva."));
    } finally {
      setDeleting(false);
    }
  }

  async function applySimpleStatus(status: BookingStatus) {
    setSaving(true);
    onError(null);
    try {
      const updated = await updateBooking(booking.id, { status });
      onUpdated(updated);
    } catch (err) {
      onError(formatValidationError(err));
    } finally {
      setSaving(false);
      setPendingAction(null);
    }
  }

  async function applyCloseReal() {
    const pax = Number(actualPax);
    if (!Number.isFinite(pax) || pax < 0 || actualPax.trim() === "") {
      onError("Ingresa el PAX real para cerrar la escala.");
      return;
    }
    setSaving(true);
    onError(null);
    try {
      const updated = await updateBooking(booking.id, {
        status: "r",
        actual_pax: pax,
        eta_real: etaReal || null,
        etd_real: etdReal || null,
      });
      onUpdated(updated);
    } catch (err) {
      onError(formatValidationError(err));
    } finally {
      setSaving(false);
      setPendingAction(null);
    }
  }

  async function applyCancel() {
    if (!cancelReason) {
      onError("Selecciona el motivo de cancelación.");
      return;
    }
    setSaving(true);
    onError(null);
    try {
      const updated = await updateBooking(booking.id, {
        status: "c",
        cancellation_reason: cancelReason,
        cancellation_evidence: cancelEvidence,
      });
      onUpdated(updated);
      setCancelReason("");
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
            Flujo NR → H → CO → R (o cancelación). Estados LTA/CL/LTD del histórico también
            pueden cerrarse a Real o cancelarse.
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      {nextStatuses.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {nextStatuses.includes("h") ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => setPendingAction("h")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
            >
              <CirclePause className="h-4 w-4" strokeWidth={2} />
              Poner en evaluación
            </button>
          ) : null}
          {nextStatuses.includes("cl") ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void applySimpleStatus("cl")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-300"
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
              Confirmar LTA
            </button>
          ) : null}
          {nextStatuses.includes("co") ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => setPendingAction("co")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
              Confirmar
            </button>
          ) : null}
          {nextStatuses.includes("r") ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => setPendingAction("r")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--admin-accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Flag className="h-4 w-4" strokeWidth={2} />
              Cerrar (Real)
            </button>
          ) : null}
          {nextStatuses.includes("c") ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => setPendingAction("c")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
            >
              <XCircle className="h-4 w-4" strokeWidth={2} />
              Cancelar
            </button>
          ) : null}
        </div>
      ) : booking.status === "c" ? (
        <div className="mt-4 space-y-3">
          {booking.cancellation_reason_display ? (
            <p className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-300">
              Motivo:{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-100">
                {booking.cancellation_reason_display}
              </span>
            </p>
          ) : null}
          {booking.cancellation_evidence_url ? (
            <a
              href={booking.cancellation_evidence_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-medium text-[var(--admin-accent)] hover:underline"
            >
              Ver evidencia de cancelación
            </a>
          ) : null}
          {canWrite ? (
            <>
              <p className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-300">
                Esta reserva está cancelada. Puedes eliminarla si ya no necesitas el registro.
              </p>
              <ConfirmDeleteButton
                deleteLabel={booking.booking_code}
                onDelete={handleDelete}
                disabled={deleting}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
                ariaLabel="Eliminar reserva cancelada"
                title="Eliminar reserva"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
                Eliminar reserva
              </ConfirmDeleteButton>
            </>
          ) : null}
        </div>
      ) : booking.status === "r" ? (
        <p className="mt-4 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-300">
          Escala cerrada (Real). PAX real: {booking.actual_pax ?? "—"}.
        </p>
      ) : null}

      <ConfirmModal
        open={pendingAction === "h"}
        onClose={() => setPendingAction(null)}
        onConfirm={() => applySimpleStatus("h")}
        title="Poner en evaluación"
        message={`¿Marcar la escala de ${booking.vessel_name} como en evaluación (Hold)?`}
        confirmLabel="Confirmar"
      />

      <ConfirmModal
        open={pendingAction === "co"}
        onClose={() => setPendingAction(null)}
        onConfirm={() => applySimpleStatus("co")}
        title="Confirmar reserva"
        message={`¿Confirmar la escala de ${booking.vessel_name} en ${booking.port_name}? Se generará el PDF. La posición puede quedar por asignar.`}
        confirmLabel="Confirmar"
      />

      <Modal
        open={pendingAction === "r"}
        onClose={() => setPendingAction(null)}
        title="Cerrar escala (Real)"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setPendingAction(null)}
              className="cursor-pointer rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Volver
            </button>
            <DefaultButton type="button" onClick={applyCloseReal} disabled={saving}>
              {saving ? "Cerrando…" : "Cerrar escala"}
            </DefaultButton>
          </div>
        }
      >
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
          Registra los datos reales de la operación. El PAX real es obligatorio.
        </p>
        <div className="space-y-3">
          <FormField
            label="PAX real"
            name="actual_pax_close"
            type="number"
            required
            value={actualPax}
            onChange={(v: string | number) => setActualPax(String(v))}
          />
          <FormField
            label="ETA real"
            name="eta_real_close"
            type="text"
            value={etaReal}
            onChange={(v: string | number) => setEtaReal(String(v))}
            placeholder="08:00"
          />
          <FormField
            label="ETD real"
            name="etd_real_close"
            type="text"
            value={etdReal}
            onChange={(v: string | number) => setEtdReal(String(v))}
            placeholder="18:00"
          />
        </div>
      </Modal>

      <Modal
        open={pendingAction === "c"}
        onClose={() => {
          setPendingAction(null);
          setCancelReason("");
          setCancelEvidence(null);
        }}
        title="Cancelar reserva"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setPendingAction(null);
                setCancelReason("");
                setCancelEvidence(null);
              }}
              className="cursor-pointer rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Volver
            </button>
            <DefaultButton
              type="button"
              onClick={applyCancel}
              disabled={saving || !cancelReason}
            >
              {saving ? "Cancelando…" : "Confirmar cancelación"}
            </DefaultButton>
          </div>
        }
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Selecciona el motivo y, si aplica, adjunta evidencia.
        </p>
        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">Motivo de cancelación</legend>
          {CANCELLATION_REASON_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={[
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                cancelReason === option.value
                  ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]"
                  : "border-zinc-200/80 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              <input
                type="radio"
                name="cancellation_reason"
                value={option.value}
                checked={cancelReason === option.value}
                onChange={() => setCancelReason(option.value)}
                className="h-4 w-4 cursor-pointer border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
              />
              <span className="font-medium">{option.label}</span>
            </label>
          ))}
        </fieldset>
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Evidencia (opcional)
          </label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={(e) => setCancelEvidence(e.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer text-sm text-zinc-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[var(--admin-accent)]/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--admin-accent)]"
          />
        </div>
      </Modal>
    </section>
  );
}
