"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import ImportFormatGuideTable, {
  ImportFormatGuideToggle,
} from "@/components/import/ImportFormatGuideTable";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import {
  getImportFormatGuide,
  type ImportFormatGuide,
} from "@/lib/importFormatGuides";
import type { BookingRecapScope } from "@/services/bookings/bulkImportService";
import ImportPasteGrid, {
  canonicalizeBulkBookingPaste,
  matrixToTsv,
} from "./ImportPasteGrid";
import RecapPasteScopeFields, {
  emptyRecapScope,
  validateRecapScope,
} from "./RecapPasteScopeFields";

type ImportPasteModalProps = {
  open: boolean;
  title: string;
  /** Optional intro above the grid; omit when headers already explain columns. */
  hint?: string;
  /** Expected column headers shown before paste (Excel-like). */
  columns: string[];
  /** Prefill grid (e.g. reprocess pending import rows). */
  initialHeaders?: string[];
  initialRows?: string[][];
  /** Guide id from `importFormatGuides` or a full guide object. */
  formatGuideId?: string | null;
  formatGuide?: ImportFormatGuide | null;
  /** Recap: show group / line / date delimiters above the grid. */
  showRecapScope?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onApply: (text: string, scope?: BookingRecapScope) => void;
};

export default function ImportPasteModal({
  open,
  title,
  hint,
  columns,
  initialHeaders,
  initialRows,
  formatGuideId = null,
  formatGuide = null,
  showRecapScope = false,
  disabled = false,
  onClose,
  onApply,
}: ImportPasteModalProps) {
  const [headers, setHeaders] = useState<string[]>(columns);
  const [rows, setRows] = useState<string[][]>([]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [recapScope, setRecapScope] = useState<BookingRecapScope>(emptyRecapScope);
  const [scopeErrors, setScopeErrors] = useState<
    ReturnType<typeof validateRecapScope>["errors"]
  >({});
  const [formError, setFormError] = useState<string | null>(null);

  const guide =
    formatGuide ?? getImportFormatGuide(formatGuideId);

  useEffect(() => {
    if (!open) {
      setHeaders(columns);
      setRows([]);
      setGuideOpen(false);
      setRecapScope(emptyRecapScope());
      setScopeErrors({});
      setFormError(null);
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

  const hasContent = rows.some((row) => row.some((cell) => cell.trim() !== ""));

  function submit() {
    if (!hasContent || disabled) return;
    setFormError(null);
    let scope: BookingRecapScope | undefined;
    if (showRecapScope) {
      const check = validateRecapScope(recapScope);
      setScopeErrors(check.errors);
      if (!check.ok) {
        setFormError("Revisa el rango de fechas del recap.");
        return;
      }
      const groups = recapScope.shipping_line_group_ids ?? [];
      const lines = recapScope.shipping_line_ids ?? [];
      const from = (recapScope.date_from ?? "").trim();
      const to = (recapScope.date_to ?? "").trim();
      if (groups.length || lines.length || from || to) {
        scope = {
          shipping_line_group_ids: groups.length ? groups : undefined,
          shipping_line_ids: lines.length ? lines : undefined,
          date_from: from || undefined,
          date_to: to || undefined,
        };
      }
    }
    const dataRows = rows.filter((row) => row.some((cell) => cell.trim() !== ""));
    let text = matrixToTsv(headers.length ? headers : columns, dataRows);
    // Bulk bookings: strip any columns outside the allowed paste set.
    if (formatGuideId === "bulk_bookings") {
      text = canonicalizeBulkBookingPaste(text);
      if (!text.trim()) return;
    }
    onApply(text, scope);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-6xl w-[min(96vw,72rem)]"
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
            disabled={disabled || !hasContent}
            onClick={submit}
          >
            Aplicar datos
          </DefaultButton>
        </div>
      }
    >
      {hint ? (
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">{hint}</p>
      ) : null}

      <ModalFormError message={formError} />

      {showRecapScope ? (
        <RecapPasteScopeFields
          value={recapScope}
          onChange={(next) => {
            setRecapScope(next);
            setScopeErrors({});
            setFormError(null);
          }}
          disabled={disabled}
          errors={scopeErrors}
        />
      ) : null}

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

      {guide ? (
        <div className="mt-3">
          <ImportFormatGuideToggle
            open={guideOpen}
            onToggle={() => setGuideOpen((v) => !v)}
          />
          {guideOpen ? (
            <div className="mt-2">
              <ImportFormatGuideTable guide={guide} />
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
