"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import DefaultButton from "@/components/buttons/DefaultButton";
import BookingTagField from "@/components/ui/BookingTagField";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { formatAuditActorDisplay } from "@/lib/auditActor";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { currentReturnTo } from "@/lib/safeReturnTo";
import {
  BOOKING_DETAIL_LINK_PROPS,
  bookingDetailHref,
} from "@/types/booking";
import type {
  RunBatchDetail,
  RunBatchFieldChange,
} from "@/services/bookings/bookingActivityService";
import { patchRunBatchTag } from "@/services/bookings/bookingTagService";

type RunBatchDetailModalProps = {
  open: boolean;
  detail: RunBatchDetail | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onDetailChange?: (detail: RunBatchDetail) => void;
};

export default function RunBatchDetailModal({
  open,
  detail,
  loading = false,
  error = null,
  onClose,
  onDetailChange,
}: RunBatchDetailModalProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = currentReturnTo(pathname, searchParams);
  const [localError, setLocalError] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [savingTag, setSavingTag] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTagDraft(detail?.tag_name ?? "");
    setLocalError(null);
  }, [open, detail?.id, detail?.tag_name]);

  const title = detail?.label?.trim() || "Detalle del lote";
  const displayError = localError || error;
  const supportsTag = Boolean(detail?.supports_tag);

  async function saveTag() {
    if (!detail || !supportsTag) return;
    setSavingTag(true);
    setLocalError(null);
    try {
      const next = (await patchRunBatchTag(detail.id, {
        tag_name: tagDraft,
        clear: !tagDraft.trim(),
      })) as RunBatchDetail;
      onDetailChange?.(next);
      setTagDraft(next.tag_name ?? "");
    } catch (err) {
      setLocalError(getApiErrorMessage(err, "No se pudo guardar el tag."));
    } finally {
      setSavingTag(false);
    }
  }

  async function clearTag() {
    if (!detail || !supportsTag) return;
    setSavingTag(true);
    setLocalError(null);
    try {
      const next = (await patchRunBatchTag(detail.id, {
        clear: true,
      })) as RunBatchDetail;
      onDetailChange?.(next);
      setTagDraft("");
    } catch (err) {
      setLocalError(getApiErrorMessage(err, "No se pudo quitar el tag."));
    } finally {
      setSavingTag(false);
    }
  }

  function rowChanges(row: RunBatchDetail["bookings"][number]): RunBatchFieldChange[] {
    if (row.field_changes?.length) return row.field_changes;
    return (detail?.field_changes ?? []).map(({ count: _count, ...rest }) => rest);
  }

  /** Rich ops columns only for LTA generate (creation); updates keep Reserva|Cambios. */
  const isCreationBatch = detail?.kind === "lta_generate";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-6xl"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-[var(--admin-surface-muted)] dark:text-zinc-200"
          >
            Cerrar
          </button>
        </div>
      }
    >
      {displayError ? <ModalFormError message={displayError} /> : null}
      {loading && !detail ? (
        <p className="text-sm text-zinc-500">Cargando detalle…</p>
      ) : null}
      {detail ? (
        <div className="space-y-5">
          <div
            className={`grid gap-2 text-sm ${
              detail.kind === "lta_agreement"
                ? "grid-cols-3"
                : "grid-cols-2"
            }`}
          >
            {detail.kind === "lta_agreement" ? (
              <>
                <div className="rounded-xl border border-sky-200/80 bg-sky-50/50 px-3 py-2 dark:border-sky-900 dark:bg-sky-950/30">
                  <p className="text-xs text-sky-700 dark:text-sky-300">
                    Vinculadas
                  </p>
                  <p className="font-semibold tabular-nums text-sky-800 dark:text-sky-200">
                    {detail.linked_count ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30">
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Desvinculadas
                  </p>
                  <p className="font-semibold tabular-nums text-amber-900 dark:text-amber-200">
                    {detail.unlinked_count ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-red-200/80 bg-red-50/50 px-3 py-2 dark:border-red-900 dark:bg-red-950/30">
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Fallidas
                  </p>
                  <p className="font-semibold tabular-nums text-red-800 dark:text-red-200">
                    {detail.failed_count}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {detail.kind === "lta_generate" ? "Creadas" : "Actualizadas"}
                  </p>
                  <p className="font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">
                    {detail.success_count}
                  </p>
                </div>
                <div className="rounded-xl border border-red-200/80 bg-red-50/50 px-3 py-2 dark:border-red-900 dark:bg-red-950/30">
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Fallidas
                  </p>
                  <p className="font-semibold tabular-nums text-red-800 dark:text-red-200">
                    {detail.failed_count}
                  </p>
                </div>
              </>
            )}
          </div>

          <p className="text-xs text-zinc-500">
            {formatAuditActorDisplay(detail.user_display)} ·{" "}
            {new Date(detail.created_at).toLocaleString("es-MX")}
          </p>

          {supportsTag ? (
            <section className="rounded-xl border border-[var(--admin-border)] p-3">
              <BookingTagField
                name="run_batch_tag"
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
          ) : null}

          <section>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Reservas
            </h3>
            {detail.bookings.length === 0 ? (
              <p className="mt-2 text-xs text-zinc-500">Ninguna.</p>
            ) : isCreationBatch ? (
              <div className="mt-2 max-h-[min(28rem,50vh)] overflow-auto rounded-lg border border-zinc-200/80 dark:border-zinc-700">
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
                    {detail.bookings.map((row) => (
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
            ) : (
              <div className="mt-2 max-h-[min(28rem,50vh)] overflow-auto rounded-lg border border-zinc-200/80 dark:border-zinc-700">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                    <tr>
                      <th className="border-b border-zinc-200 px-3 py-2 font-semibold dark:border-zinc-700">
                        Reserva
                      </th>
                      <th className="border-b border-zinc-200 px-3 py-2 font-semibold dark:border-zinc-700">
                        Cambios
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {detail.bookings.map((row) => {
                      const changes = rowChanges(row);
                      return (
                        <tr
                          key={row.id}
                          className="bg-white hover:bg-zinc-50/80 dark:bg-zinc-950/40 dark:hover:bg-zinc-900/60"
                        >
                          <td className="max-w-[20rem] px-3 py-1 align-middle lg:max-w-xl">
                            <Link
                              href={bookingDetailHref(row, { returnTo })}
                              {...BOOKING_DETAIL_LINK_PROPS}
                              className="break-all text-[11px] leading-snug text-[var(--admin-accent)] hover:underline"
                              onClick={onClose}
                            >
                              {row.booking_code}
                            </Link>
                          </td>
                          <td className="px-3 py-1 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                            {changes.length === 0 ? (
                              <span className="text-zinc-400">—</span>
                            ) : (
                              <span className="flex flex-wrap gap-x-3 gap-y-0.5">
                                {changes.map((change) => (
                                  <span
                                    key={`${change.field}-${change.from}-${change.to}`}
                                    className="whitespace-nowrap"
                                  >
                                    <span className="text-zinc-500">
                                      {change.label}:
                                    </span>{" "}
                                    <span className="text-zinc-400 line-through">
                                      {change.from}
                                    </span>{" "}
                                    <span className="text-zinc-400" aria-hidden>
                                      →
                                    </span>{" "}
                                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                                      {change.to}
                                    </span>
                                  </span>
                                ))}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}
