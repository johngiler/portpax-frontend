"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ClipboardCopy, FileSpreadsheet } from "lucide-react";
import DefaultButton from "@/components/buttons/DefaultButton";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { formatAuditActorDisplay } from "@/lib/auditActor";
import { currentReturnTo } from "@/lib/safeReturnTo";
import {
  BOOKING_DETAIL_LINK_PROPS,
  bookingDetailHref,
} from "@/types/booking";
import { exportImportBatchPendingXlsx } from "@/services/bookings/bulkImportService";
import type {
  ImportBatchDetail,
  ImportBatchRetryRow,
} from "@/services/bookings/bookingActivityService";
import { copyImportRowsTsv } from "../Import/retryRows";

type ImportBatchDetailModalProps = {
  open: boolean;
  detail: ImportBatchDetail | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onReprocess?: (rows: ImportBatchRetryRow[]) => void;
};

export default function ImportBatchDetailModal({
  open,
  detail,
  loading = false,
  error = null,
  onClose,
  onReprocess,
}: ImportBatchDetailModalProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = currentReturnTo(pathname, searchParams);
  const [localError, setLocalError] = useState<string | null>(null);
  const [actionHint, setActionHint] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const title = detail
    ? `Importación · ${detail.label}`
    : "Detalle de importación";

  const retryRows = detail?.retry_rows ?? [];
  const canReprocess = retryRows.length > 0 && Boolean(onReprocess);
  const displayError = localError || error;

  async function handleCopy() {
    if (!retryRows.length) return;
    setLocalError(null);
    try {
      await copyImportRowsTsv(retryRows);
      setActionHint(`Copiado al portapapeles (${retryRows.length} filas).`);
    } catch {
      setLocalError("No se pudo copiar al portapapeles.");
    }
  }

  async function handleExport() {
    if (!detail || !retryRows.length) return;
    setLocalError(null);
    setExporting(true);
    try {
      await exportImportBatchPendingXlsx(detail.id);
      setActionHint("Excel de pendientes descargado.");
    } catch (err) {
      setLocalError(getApiErrorMessage(err, "No se pudo exportar el Excel."));
    } finally {
      setExporting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-2xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {retryRows.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-[var(--admin-surface-muted)] dark:text-zinc-200"
                >
                  <ClipboardCopy className="h-4 w-4" aria-hidden />
                  Copiar ({retryRows.length})
                </button>
                <button
                  type="button"
                  disabled={exporting}
                  onClick={() => void handleExport()}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-[var(--admin-surface-muted)] disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-200"
                >
                  <FileSpreadsheet className="h-4 w-4" aria-hidden />
                  {exporting
                    ? "Exportando…"
                    : `Exportar Excel (${retryRows.length})`}
                </button>
              </>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-[var(--admin-surface-muted)] dark:text-zinc-200"
            >
              Cerrar
            </button>
            {canReprocess ? (
              <DefaultButton
                type="button"
                onClick={() => onReprocess?.(retryRows)}
              >
                Volver a procesar ({retryRows.length})
              </DefaultButton>
            ) : null}
          </div>
        </div>
      }
    >
      {displayError ? <ModalFormError message={displayError} /> : null}
      {actionHint ? (
        <p className="mb-3 text-xs text-emerald-700 dark:text-emerald-400">
          {actionHint}
        </p>
      ) : null}
      {loading && !detail ? (
        <p className="text-sm text-zinc-500">Cargando detalle…</p>
      ) : null}
      {detail ? (
        <div className="space-y-5">
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/30">
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Creadas
              </p>
              <p className="font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">
                {detail.created_count}
              </p>
            </div>
            <div className="rounded-xl border border-red-200/80 bg-red-50/50 px-3 py-2 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-xs text-red-700 dark:text-red-300">Fallidas</p>
              <p className="font-semibold tabular-nums text-red-800 dark:text-red-200">
                {detail.failed_count}
              </p>
            </div>
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                No creadas
              </p>
              <p className="font-semibold tabular-nums text-amber-900 dark:text-amber-200">
                {detail.not_created_count ??
                  Math.max(
                    0,
                    (detail.retry_count ?? retryRows.length) -
                      detail.failed_count,
                  )}
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-500">
            {formatAuditActorDisplay(detail.user_display)} ·{" "}
            {new Date(detail.created_at).toLocaleString("es-MX")}
          </p>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Reservas creadas
            </h3>
            {detail.created.length === 0 ? (
              <p className="mt-2 text-xs text-zinc-500">Ninguna.</p>
            ) : (
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                {detail.created.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={bookingDetailHref(row, { returnTo })}
                      {...BOOKING_DETAIL_LINK_PROPS}
                      className="text-sm text-[var(--admin-accent)] hover:underline"
                      onClick={onClose}
                    >
                      {row.booking_code}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Pendientes de procesar
            </h3>
            {retryRows.length === 0 ? (
              <p className="mt-2 text-xs text-zinc-500">Ninguna.</p>
            ) : (
              <>
                <p className="mt-1 text-xs text-zinc-500">
                  Puedes copiarlas, exportarlas a Excel o volver a procesarlas
                  en la ventana de pegado para editarlas.
                </p>
                <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                  {retryRows.map((row, idx) => (
                    <li
                      key={`${row.id}-${idx}`}
                      className="rounded-lg border border-amber-200/70 bg-amber-50/40 px-3 py-2 text-xs dark:border-amber-900/60 dark:bg-amber-950/20"
                    >
                      <p className="font-medium text-zinc-800 dark:text-zinc-100">
                        {[
                          row.vessel_name || row.ship || "Sin barco",
                          row.port_name || row.port_raw || "Sin puerto",
                          row.call_date || "Sin fecha",
                        ].join(" · ")}
                      </p>
                      {row.issues.length > 0 ? (
                        <ul className="mt-1 space-y-0.5 text-red-700 dark:text-red-300">
                          {row.issues.map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-zinc-500">
                          No se envió en esta corrida.
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}
