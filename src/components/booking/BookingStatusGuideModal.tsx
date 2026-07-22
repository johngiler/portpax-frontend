"use client";

import Modal from "@/components/ui/Modal";
import BookingStatusGuideTable from "@/components/booking/BookingStatusGuideTable";

type BookingStatusGuideModalProps = {
  open: boolean;
  onClose: () => void;
  /** Include list-only filter buckets when opened from filters. */
  includeFilterExtras?: boolean;
};

export default function BookingStatusGuideModal({
  open,
  onClose,
  includeFilterExtras = false,
}: BookingStatusGuideModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Guía de estados"
      panelClassName="max-w-2xl"
      footer={
        <div className="flex w-full justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-[var(--admin-surface-muted)] dark:text-zinc-200"
          >
            Cerrar
          </button>
        </div>
      }
    >
      <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
        Referencia de códigos y transiciones del flujo de booking.
      </p>
      <BookingStatusGuideTable includeFilterExtras={includeFilterExtras} />
    </Modal>
  );
}
