"use client";

import Modal from "@/components/ui/Modal";

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  /** Si true, el botón de confirmar usa estilo peligro (rojo). */
  danger?: boolean;
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  danger = false,
}: ConfirmModalProps) {
  function handleConfirm() {
    onConfirm();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-[var(--admin-border)] bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={
              danger
                ? "cursor-pointer rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-colors bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                : "btn-primary-gradient cursor-pointer rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105"
            }
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
    </Modal>
  );
}
