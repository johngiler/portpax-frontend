"use client";

import { FileSpreadsheet } from "lucide-react";
import ImportOptionDropCard from "@/components/ui/ImportOptionDropCard";
import Modal from "@/components/ui/Modal";

type ShippingLinesImportModalProps = {
  open: boolean;
  onClose: () => void;
  onImportFile: (file: File) => void;
  disabled?: boolean;
};

/** Excel-only import options for the shipping-lines catalog. */
export default function ShippingLinesImportModal({
  open,
  onClose,
  onImportFile,
  disabled = false,
}: ShippingLinesImportModalProps) {
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
        Excel exportado con hojas Navieras y Barcos. Con{" "}
        <span className="font-medium text-zinc-800 dark:text-zinc-100">id</span>{" "}
        se actualiza; sin id se crea.
      </p>
      <ImportOptionDropCard
        title="Navieras y barcos"
        description="Usa el .xlsx descargado desde Exportar. Logos y fechas de sistema no se modifican."
        icon={FileSpreadsheet}
        disabled={disabled}
        onFile={(file) => {
          onClose();
          onImportFile(file);
        }}
      />
    </Modal>
  );
}
