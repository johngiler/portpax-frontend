"use client";

import { useState } from "react";
import { CalendarSearch, FileSpreadsheet, type LucideIcon } from "lucide-react";
import ImportOptionDropCard from "@/components/ui/ImportOptionDropCard";
import Modal from "@/components/ui/Modal";
import ImportPasteModal from "./ImportPasteModal";
import { BULK_BOOKING_PASTE_COLUMNS } from "@/lib/importFormatGuides";

export type BookingImportOptionId = "bulk_bookings" | "availability_filter";

type ImportOptionDef = {
  id: BookingImportOptionId;
  title: string;
  description: string;
  icon: LucideIcon;
  allowPaste?: boolean;
  pasteTitle?: string;
  pasteColumns?: string[];
};

const IMPORT_OPTIONS: ImportOptionDef[] = [
  {
    id: "bulk_bookings",
    title: "Reservas masivas",
    description:
      "Excel ITM (Ship, Port, Arrival, Departure…) — revisa y crea en lote.",
    icon: FileSpreadsheet,
    allowPaste: true,
    pasteTitle: "Pegar reservas masivas",
    pasteColumns: [...BULK_BOOKING_PASTE_COLUMNS],
  },
  {
    id: "availability_filter",
    title: "Consultar disponibilidad",
    description:
      "Lista de fechas (Excel o pegado) — filtra Disponibilidad puerto.",
    icon: CalendarSearch,
    allowPaste: true,
    pasteTitle: "Pegar fechas de disponibilidad",
    pasteColumns: ["Fecha"],
  },
];

type ImportOptionsModalProps = {
  open: boolean;
  onClose: () => void;
  onImportFile: (optionId: BookingImportOptionId, file: File) => void;
  onImportPaste?: (optionId: BookingImportOptionId, text: string) => void;
  disabled?: boolean;
};

export default function ImportOptionsModal({
  open,
  onClose,
  onImportFile,
  onImportPaste,
  disabled = false,
}: ImportOptionsModalProps) {
  const [pasteOption, setPasteOption] = useState<ImportOptionDef | null>(null);

  return (
    <>
      <Modal
        open={open && !pasteOption}
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
          Elige el tipo de importación. Arrastra el Excel, haz clic para
          seleccionarlo o escribe / pega celdas en una modal con guía de
          formatos.
        </p>
        <div className="flex flex-col gap-3">
          {IMPORT_OPTIONS.map((option) => (
            <ImportOptionDropCard
              key={option.id}
              title={option.title}
              description={option.description}
              icon={option.icon}
              disabled={disabled}
              onFile={(file) => {
                onClose();
                onImportFile(option.id, file);
              }}
              onPasteClick={
                option.allowPaste && onImportPaste
                  ? () => setPasteOption(option)
                  : undefined
              }
            />
          ))}
        </div>
      </Modal>

      <ImportPasteModal
        open={Boolean(pasteOption)}
        title={pasteOption?.pasteTitle ?? "Pegar celdas"}
        columns={pasteOption?.pasteColumns ?? ["Columna"]}
        formatGuideId={pasteOption?.id ?? null}
        disabled={disabled}
        onClose={() => setPasteOption(null)}
        onApply={(text) => {
          if (!pasteOption || !onImportPaste) return;
          const id = pasteOption.id;
          setPasteOption(null);
          onClose();
          onImportPaste(id, text);
        }}
      />    </>
  );
}
