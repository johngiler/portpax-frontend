"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ClipboardCopy, FileSpreadsheet } from "lucide-react";
import DefaultButton from "@/components/buttons/DefaultButton";
import BookingTagField from "@/components/ui/BookingTagField";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import TablePagination from "@/components/tables/TablePagination";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { formatAuditActorDisplay } from "@/lib/auditActor";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { currentReturnTo } from "@/lib/safeReturnTo";
import {
  BOOKING_DETAIL_LINK_PROPS,
  bookingDetailHref,
} from "@/types/booking";
import { exportImportBatchPendingXlsx } from "@/services/bookings/bulkImportService";
import {
  BATCH_BOOKINGS_PAGE_SIZE,
  fetchImportBatchDetail,
  type ImportBatchDetail,
  type ImportBatchRetryRow,
} from "@/services/bookings/bookingActivityService";
import { patchImportBatchTag } from "@/services/bookings/bookingTagService";
import { copyImportRowsTsv } from "../Import/retryRows";

type ImportBatchDetailModalProps = {
  open: boolean;
  detail: ImportBatchDetail | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onReprocess?: (rows: ImportBatchRetryRow[]) => void;
  onDetailChange?: (detail: ImportBatchDetail) => void;
};

export default function ImportBatchDetailModal({
  open,
  detail,
  loading = false,
  error = null,
  onClose,
  onReprocess,
  onDetailChange,
}: ImportBatchDetailModalProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = currentReturnTo(pathname, searchParams);
  const [localError, setLocalError] = useState<string | null>(null);
  const [actionHint, setActionHint] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [savingTag, setSavingTag] = useState(false);
  const [paging, setPaging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTagDraft(detail?.tag_name ?? "");
    setLocalError(null);
    setActionHint(null);
  }, [open, detail?.id, detail?.tag_name]);

  const title = detail
    ? `Importación · ${detail.label}`
    : "Detalle de importación";

  const retryRows = detail?.retry_rows ?? [];
  const canReprocess = retryRows.length > 0 && Boolean(onReprocess);
  const displayError = localError || error;
  const createdPage = detail?.created_page ?? 1;
  const createdPageSize = detail?.created_page_size ?? BATCH_BOOKINGS_PAGE_SIZE;
  const createdTotal = detail?.created_total ?? detail?.created.length ?? 0;

  async function handleCreatedPageChange(page: number) {
    if (!detail || paging) return;
    setPaging(true);
    setLocalError(null);
    try {
      const next = await fetchImportBatchDetail(detail.id, {
        page,
        pageSize: createdPageSize,
      });
      onDetailChange?.(next);
    } catch (err) {
      setLocalError(getApiErrorMessage(err, "No se pudo cargar la página."));
    } finally {
      setPaging(false);
    }
  }

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

  async function saveTag() {
    if (!detail) return;
    setSavingTag(true);
    setLocalError(null);
    try {
      const next = (await patchImportBatchTag(
        detail.id,
        {
          tag_name: tagDraft,
          clear: !tagDraft.trim(),
        },
        { page: createdPage, pageSize: createdPageSize },
      )) as ImportBatchDetail;
      onDetailChange?.(next);
      setTagDraft(next.tag_name ?? "");
      setActionHint(next.tag_name ? "Tag actualizado." : "Tag quitado.");
    } catch (err) {
      setLocalError(getApiErrorMessage(err, "No se pudo guardar el tag."));
    } finally {
      setSavingTag(false);
    }
  }

  async function clearTag() {
    if (!detail) return;
    setSavingTag(true);
    setLocalError(null);
    try {
      const next = (await patchImportBatchTag(
        detail.id,
        { clear: true },
        { page: createdPage, pageSize: createdPageSize },
      )) as ImportBatchDetail;
      onDetailChange?.(next);
      setTagDraft("");
      setActionHint("Tag quitado.");
    } catch (err) {
      setLocalError(getApiErrorMessage(err, "No se pudo quitar el tag."));
    } finally {
      setSavingTag(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-6xl w-[min(96vw,72rem)]"
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
          <div className="grid grid-cols-3 gap-2 text-sm">
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

          <section className="rounded-xl border border-[var(--admin-border)] p-3">
            <BookingTagField
              name="import_batch_tag"
              value={tagDraft}
              onChange={setTagDraft}
              disabled={savingTag}
              compact
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <DefaultButton
                type="button"
                disabled={savingTag}
                onClick={() => void saveTag()}
              >
                {savingTag ? "Guardando…" : "Guardar tag"}
              </DefaultButton>
              {detail.tag_name ? (
                <button
                  type="button"
                  disabled={savingTag}
                  onClick={() => void clearTag()}
                  className="cursor-pointer rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-[var(--admin-surface-muted)] disabled:opacity-40 dark:text-zinc-200"
                >
                  Quitar tag
                </button>
              ) : null}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Reservas creadas
            </h3>
            {detail.created.length === 0 ? (
              <p className="mt-2 text-xs text-zinc-500">Ninguna.</p>
            ) : (
              <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200/80 dark:border-zinc-700">
                <div className="max-h-[min(28rem,50vh)] overflow-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="sticky top-0 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                      <tr>
                        <th className="border-b border-zinc-200 px-3 py-2 font-semibold dark:border-zinc-700">
                          Reserva
                        </th>
                        <th className="border-b border-zinc-200 px-3 py-2 font-semibold dark:border-zinc-700">
                          Fecha
                        </th>
                        <th className="border-b border-zinc-200 px-3 py-2 font-semibold dark:border-zinc-700">
                          Puerto
                        </th>
                        <th className="border-b border-zinc-200 px-3 py-2 font-semibold dark:border-zinc-700">
                          Barco
                        </th>
                        <th className="border-b border-zinc-200 px-3 py-2 font-semibold dark:border-zinc-700">
                          Pos.
                        </th>
                        <th className="border-b border-zinc-200 px-3 py-2 font-semibold dark:border-zinc-700">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {detail.created.map((row) => (
                        <tr
                          key={row.id}
                          className="bg-white hover:bg-zinc-50/80 dark:bg-zinc-950/40 dark:hover:bg-zinc-900/60"
                        >
                          <td className="max-w-[14rem] px-3 py-1 align-middle lg:max-w-xs">
                            <Link
                              href={bookingDetailHref(row, { returnTo })}
                              {...BOOKING_DETAIL_LINK_PROPS}
                              className="break-all text-[11px] leading-snug text-[var(--admin-accent)] hover:underline"
                              onClick={onClose}
                            >
                              {row.booking_code}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-1 text-xs text-zinc-800 dark:text-zinc-100">
                            {row.call_date
                              ? formatIsoDateLabel(row.call_date, "short")
                              : "—"}
                          </td>
                          <td className="px-3 py-1 text-xs text-zinc-700 dark:text-zinc-200">
                            {row.port_name || "—"}
                          </td>
                          <td className="px-3 py-1 text-xs text-zinc-700 dark:text-zinc-200">
                            {row.vessel_name || "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-1 text-xs font-medium tabular-nums text-zinc-800 dark:text-zinc-100">
                            {row.position_code || "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-1 text-xs text-zinc-700 dark:text-zinc-200">
                            {row.status_label || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {createdTotal > createdPageSize ? (
                  <TablePagination
                    page={createdPage}
                    pageSize={createdPageSize}
                    totalCount={createdTotal}
                    onPageChange={(page) => void handleCreatedPageChange(page)}
                    label="reservas"
                  />
                ) : null}
              </div>
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
