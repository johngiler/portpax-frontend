"use client";

import { FileSpreadsheet, Upload } from "lucide-react";
import Modal from "@/components/ui/Modal";

type ImportOptionsModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectBulkBookings: () => void;
};

export default function ImportOptionsModal({
  open,
  onClose,
  onSelectBulkBookings,
}: ImportOptionsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Opciones de importación"
      panelClassName="max-w-md"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-md border border-zinc-200/80 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
      }
    >
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
        Elige el tipo de importación. El archivo se solicita en el siguiente
        paso.
      </p>
      <button
        type="button"
        onClick={onSelectBulkBookings}
        className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-[var(--admin-border)] bg-gradient-to-b from-white to-[var(--admin-surface-muted)] px-4 py-3 text-left transition-colors hover:border-[var(--admin-accent)]/40 hover:bg-[var(--admin-accent)]/5 dark:from-zinc-900 dark:to-zinc-800"
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
          <FileSpreadsheet className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Reservas masivas
          </span>
          <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
            Excel ITM (Ship, Port, Arrival, Departure…) — revisa y crea en
            lote.
          </span>
        </span>
        <Upload
          className="mt-1 h-4 w-4 shrink-0 text-zinc-400"
          strokeWidth={2}
          aria-hidden
        />
      </button>
    </Modal>
  );
}
