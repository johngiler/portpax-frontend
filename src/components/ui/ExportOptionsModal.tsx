"use client";

import { FileSpreadsheet, FileText, type LucideIcon } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { DataExportFormat } from "@/lib/dataExportStore";

type ExportOptionDef = {
  id: DataExportFormat;
  title: string;
  description: string;
  icon: LucideIcon;
};

const EXPORT_OPTIONS: ExportOptionDef[] = [
  {
    id: "xlsx",
    title: "Exportar a Excel",
    description: "Descarga un archivo .xlsx con los datos de la vista actual.",
    icon: FileSpreadsheet,
  },
  {
    id: "csv",
    title: "Exportar a CSV",
    description: "Descarga un archivo .csv compatible con hojas de cálculo.",
    icon: FileText,
  },
];

type ExportOptionsModalProps = {
  open: boolean;
  onClose: () => void;
  onExport: (format: DataExportFormat) => void | Promise<void>;
  disabled?: boolean;
  exporting?: boolean;
};

export default function ExportOptionsModal({
  open,
  onClose,
  onExport,
  disabled = false,
  exporting = false,
}: ExportOptionsModalProps) {
  const busy = disabled || exporting;

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      closeable={!busy}
      title="Opciones de exportación"
      panelClassName="max-w-md"
      footer={
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="cursor-pointer rounded-md border border-zinc-200/80 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
      }
    >
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
        Elige el formato de descarga. Se aplican los filtros de la vista actual.
      </p>
      <div className="flex flex-col gap-3">
        {EXPORT_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              disabled={busy}
              onClick={() => void onExport(option.id)}
              className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 text-left transition-colors hover:border-[var(--admin-accent)]/40 hover:bg-[var(--admin-accent)]/[0.04] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {exporting ? "Exportando…" : option.title}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
