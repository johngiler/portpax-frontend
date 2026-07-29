"use client";

import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";

type BulkImportLoadingModalProps = {
  open: boolean;
  fileName?: string;
};

/** Blocking feedback while the server parses and validates the Excel. */
export default function BulkImportLoadingModal({
  open,
  fileName,
}: BulkImportLoadingModalProps) {
  return (
    <Modal
      open={open}
      onClose={() => undefined}
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
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Esto puede tardar unos segundos según el tamaño del archivo.
        </p>
      </div>
    </Modal>
  );
}
