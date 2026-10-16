"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import BookingTagField from "@/components/ui/BookingTagField";
import Modal from "@/components/ui/Modal";
import {
  CANCELLATION_REASON_OPTIONS,
  type CancellationReason,
} from "@/types/booking";

export type BulkCancelConfirmPayload = {
  reason: CancellationReason;
  tagName?: string;
};

type BookingsBulkCancelModalProps = {
  open: boolean;
  count: number;
  saving: boolean;
  onClose: () => void;
  onConfirm: (payload: BulkCancelConfirmPayload) => void;
};

export default function BookingsBulkCancelModal({
  open,
  count,
  saving,
  onClose,
  onConfirm,
}: BookingsBulkCancelModalProps) {
  const [reason, setReason] = useState<CancellationReason | "">("");
  const [tagName, setTagName] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
      setTagName("");
    }
  }, [open]);

  function handleClose() {
    if (saving) return;
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Cancelar reservas"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="cursor-pointer rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
          >
            Volver
          </button>
          <DefaultButton
            type="button"
            disabled={saving || !reason}
            onClick={() => {
              if (!reason) return;
              onConfirm({
                reason,
                tagName: tagName.trim() || undefined,
              });
            }}
          >
            {saving ? "Cancelando…" : "Confirmar cancelación"}
          </DefaultButton>
        </div>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Se cancelarán {count} reserva{count === 1 ? "" : "s"} con el mismo
        motivo. La evidencia, si aplica, se adjunta después en cada ficha.
      </p>
      <div className="mt-4">
        <BookingTagField
          name="bulk_cancel_tag"
          value={tagName}
          onChange={setTagName}
          disabled={saving}
        />
      </div>
      <fieldset className="mt-4 space-y-2">
        <legend className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Motivo de cancelación
        </legend>
        {CANCELLATION_REASON_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200/80 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
          >
            <input
              type="radio"
              name="bulk_cancellation_reason"
              value={option.value}
              checked={reason === option.value}
              onChange={() => setReason(option.value)}
              disabled={saving}
              className="h-4 w-4 border-zinc-300 text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    </Modal>
  );
}
