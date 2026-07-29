"use client";

import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useNavigationLock } from "@/lib/useNavigationLock";

type BulkImportLoadingModalProps = {
  open: boolean;
  fileName?: string;
};

const LOCK_MESSAGE =
  "La importación sigue en proceso. No cambies de sección, no modifiques la URL ni cierres la ventana del navegador.";

/** Blocking feedback while the server parses and validates the Excel. */
export default function BulkImportLoadingModal({
  open,
  fileName,
}: BulkImportLoadingModalProps) {
  useNavigationLock(open, LOCK_MESSAGE);

  return (
    <Modal
      open={open}
      onClose={() => undefined}
      closeable={false}
      title="Procesando importación"
      panelClassName="max-w-sm"
    >
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Loader2
          className="h-8 w-8 animate-spin text-[var(--admin-accent)]"
          strokeWidth={2}
          aria-hidden
        />
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Leyendo y validando las reservas…
        </p>
        {fileName ? (
          <p className="max-w-full truncate text-xs text-zinc-500 dark:text-zinc-400">
            {fileName}
          </p>
        ) : null}
        <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
          No cambies de sección, no modifiques la URL ni cierres la ventana del
          navegador hasta que termine.
        </p>
      </div>
    </Modal>
  );
}
