"use client";

import DefaultButton from "@/components/buttons/DefaultButton";
import ModalFormError from "@/components/ui/ModalFormError";
import NoticeAlert from "@/components/ui/NoticeAlert";
import type { BookingRecapUnmatched } from "@/services/bookings/bulkImportService";

type RecapUnmatchedSectionProps = {
  rows: BookingRecapUnmatched[];
  creating?: boolean;
  error?: string | null;
  onCreate: () => void;
};

/** Recap rows with no booking. Create hands them to the mass-import modal. */
export default function RecapUnmatchedSection({
  rows,
  creating = false,
  error = null,
  onCreate,
}: RecapUnmatchedSectionProps) {
  if (rows.length === 0) return null;

  return (
    <div className="mb-4 space-y-2 rounded-lg border border-amber-200/90 bg-amber-50/40 p-3 dark:border-amber-900/40 dark:bg-amber-950/15">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          {rows.length}{" "}
          {rows.length === 1
            ? "fila del recap no se encontró"
            : "filas del recap no se encontraron"}{" "}
          en el sistema.
        </p>
        <DefaultButton type="button" disabled={creating} onClick={onCreate}>
          {creating ? "Preparando…" : "Crear estas reservas"}
        </DefaultButton>
      </div>
      <ModalFormError message={error} />
      {rows.map((row) => (
        <NoticeAlert
          key={`${row.row_number ?? "x"}-${row.ship}-${row.call_date ?? ""}`}
          variant="warning"
          messages={[row.reason]}
        />
      ))}
    </div>
  );
}
