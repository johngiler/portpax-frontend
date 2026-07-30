"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import Modal from "@/components/ui/Modal";
import ImportPasteGrid, { matrixToTsv } from "./ImportPasteGrid";

type ImportPasteModalProps = {
  open: boolean;
  title: string;
  hint: string;
  /** Expected column headers shown before paste (Excel-like). */
  columns: string[];
  /** Prefill grid (e.g. reprocess pending import rows). */
  initialHeaders?: string[];
  initialRows?: string[][];
  disabled?: boolean;
  onClose: () => void;
  onApply: (text: string) => void;
};

export default function ImportPasteModal({
  open,
  title,
  hint,
  columns,
  initialHeaders,
  initialRows,
  disabled = false,
  onClose,
  onApply,
}: ImportPasteModalProps) {
  const [headers, setHeaders] = useState<string[]>(columns);
  const [rows, setRows] = useState<string[][]>([]);

  useEffect(() => {
    if (!open) {
      setHeaders(columns);
      setRows([]);
      return;
    }
    if (initialRows && initialRows.length > 0) {
      setHeaders(
        initialHeaders && initialHeaders.length > 0
          ? initialHeaders
          : columns,
      );
      setRows(initialRows.map((row) => [...row]));
      return;
    }
    setHeaders(columns);
    setRows([]);
  }, [open, columns, initialHeaders, initialRows]);

  function submit() {
    if (!rows.length || disabled) return;
    onApply(matrixToTsv(headers.length ? headers : columns, rows));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-3xl"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="cursor-pointer rounded-md border border-zinc-200/80 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <DefaultButton
            type="button"
            disabled={disabled || rows.length === 0}
            onClick={submit}
          >
            Aplicar pegado
          </DefaultButton>
        </div>
      }
    >
      <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">{hint}</p>
      <ImportPasteGrid
        columns={columns}
        headers={headers}
        rows={rows}
        disabled={disabled}
        onMatrixChange={(nextHeaders, nextRows) => {
          setHeaders(nextHeaders);
          setRows(nextRows);
        }}
      />
      <p className="mt-2 text-[11px] text-zinc-400">
        Tip: pega con ⌘/Ctrl + V; luego «Aplicar pegado».
      </p>
    </Modal>
  );
}
