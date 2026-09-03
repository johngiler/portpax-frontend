"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import DefaultButton from "@/components/buttons/DefaultButton";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import IsoDateInput from "@/components/ui/IsoDateInput";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  fetchLtaDatePreview,
  updateLongTermAgreement,
} from "@/services/bookings/ltaService";
import { type LongTermAgreement } from "@/types/lta";
import LtaRuleSetChips from "../LtaRuleSetChips";
import {
  buildDraftRows,
  draftRowsToExceptions,
  type ExceptionDraftRow,
} from "./draftRows";

type LtaDateExceptionsModalProps = {
  open: boolean;
  agreement: LongTermAgreement | null;
  onClose: () => void;
  onSaved: (updated: LongTermAgreement) => void;
};

function kindChip(kind: ExceptionDraftRow["kind"]): {
  label: string;
  className: string;
} {
  if (kind === "include") {
    return {
      label: "Extra",
      className:
        "bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    };
  }
  if (kind === "skip") {
    return {
      label: "Omitida",
      className:
        "bg-zinc-500/10 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-300",
    };
  }
  if (kind === "reschedule") {
    return {
      label: "Reprogramada",
      className:
        "bg-amber-500/10 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    };
  }
  return {
    label: "Según acuerdo",
    className:
      "bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]",
  };
}

export default function LtaDateExceptionsModal({
  open,
  agreement,
  onClose,
  onSaved,
}: LtaDateExceptionsModalProps) {
  const [ruleDates, setRuleDates] = useState<string[]>([]);
  const [rows, setRows] = useState<ExceptionDraftRow[]>([]);
  const [extraDate, setExtraDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editSnapshot, setEditSnapshot] = useState<ExceptionDraftRow | null>(
    null,
  );

  useEffect(() => {
    if (!open || !agreement) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setExtraDate("");
    setEditingKey(null);
    setEditSnapshot(null);
    void fetchLtaDatePreview(agreement.id)
      .then((preview) => {
        if (cancelled) return;
        setRuleDates(preview.rule_dates);
        setRows(
          buildDraftRows(preview.rule_dates, preview.date_exceptions ?? []),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          getApiErrorMessage(err, "No se pudo cargar el preview de fechas."),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, agreement]);

  const activeCount = useMemo(
    () => rows.filter((row) => row.kind !== "skip").length,
    [rows],
  );

  function setRowIso(key: string, iso: string) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.key !== key || !row.ruleIso) return row;
        if (!iso || iso === row.ruleIso) {
          return { ...row, iso: row.ruleIso, kind: "rule" };
        }
        return { ...row, iso, kind: "reschedule" };
      }),
    );
  }

  function setIncludeIso(key: string, iso: string) {
    if (!iso) return;
    setRows((prev) =>
      prev.map((row) => {
        if (row.key !== key || row.kind !== "include") return row;
        return { ...row, iso, key: `include:${iso}` };
      }),
    );
    setEditingKey(`include:${iso}`);
  }

  function startEdit(row: ExceptionDraftRow) {
    setEditSnapshot({ ...row });
    setEditingKey(row.key);
  }

  function confirmEdit() {
    setEditingKey(null);
    setEditSnapshot(null);
  }

  function cancelEdit() {
    if (editSnapshot) {
      const snap = editSnapshot;
      const activeKey = editingKey;
      setRows((prev) => {
        const idx = prev.findIndex(
          (row) => row.key === activeKey || row.key === snap.key,
        );
        if (idx < 0) return prev;
        const next = [...prev];
        next[idx] = { ...snap };
        return next;
      });
    }
    setEditingKey(null);
    setEditSnapshot(null);
  }

  function toggleSkip(key: string) {
    setEditingKey(null);
    setEditSnapshot(null);
    setRows((prev) =>
      prev.map((row) => {
        if (row.key !== key || !row.ruleIso) return row;
        if (row.kind === "skip") {
          return { ...row, iso: row.ruleIso, kind: "rule" };
        }
        return { ...row, iso: row.ruleIso, kind: "skip" };
      }),
    );
  }

  function addExtra() {
    const iso = extraDate.trim();
    if (!iso) return;
    setRows((prev) => {
      if (prev.some((row) => row.iso === iso && row.kind !== "skip")) {
        return prev;
      }
      return buildDraftRows(ruleDates, [
        ...draftRowsToExceptions(prev),
        { kind: "include", date: iso },
      ]);
    });
    setExtraDate("");
  }

  function removeInclude(key: string) {
    setRows((prev) => prev.filter((row) => row.key !== key));
  }

  async function handleSave() {
    if (!agreement) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateLongTermAgreement(agreement.id, {
        date_exceptions: draftRowsToExceptions(rows),
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(
        getApiErrorMessage(err, "No se pudieron guardar las excepciones."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      title={
        agreement
          ? `Excepciones de fechas · ${agreement.code}`
          : "Excepciones de fechas"
      }
      panelClassName="max-w-[calc(56rem+20px)]"
      footer={
        <div className="flex w-full justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="cursor-pointer rounded-md border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-[var(--admin-surface-muted)] disabled:opacity-50 dark:text-zinc-200"
          >
            Cancelar
          </button>
          <DefaultButton
            type="button"
            disabled={saving || loading || !agreement}
            onClick={() => void handleSave()}
          >
            {saving ? "Guardando…" : "Guardar excepciones"}
          </DefaultButton>
        </div>
      }
    >
      <ModalFormError message={error} />
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando fechas de la regla…</p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Regla: {ruleDates.length} · Activas: {activeCount}
          </p>

          <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-[var(--admin-border)]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[var(--admin-surface-muted)] text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Set de reglas</th>
                  <th className="px-3 py-2">Tipo de regla</th>
                  <th className="px-3 py-2">Omitir</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const chip = kindChip(row.kind);
                  return (
                    <tr
                      key={row.key}
                      className="border-t border-[var(--admin-border)]/70"
                    >
                      <td className="px-3 py-2.5 align-middle">
                        {editingKey === row.key && row.kind !== "skip" ? (
                          <div className="w-[9.5rem] space-y-1">
                            <IsoDateInput
                              value={row.iso}
                              onChange={(iso) => {
                                if (row.ruleIso) setRowIso(row.key, iso);
                                else setIncludeIso(row.key, iso);
                              }}
                              size="compact"
                              disabled={saving}
                            />
                            {row.kind === "reschedule" && row.ruleIso ? (
                              <p className="text-[11px] text-zinc-500">
                                Era {formatIsoDateLabel(row.ruleIso)}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span
                              className={`font-medium ${
                                row.kind === "skip"
                                  ? "text-zinc-400 line-through"
                                  : "text-zinc-800 dark:text-zinc-100"
                              }`}
                            >
                              {formatIsoDateLabel(row.iso)}
                            </span>
                            {row.kind === "reschedule" && row.ruleIso ? (
                              <p className="text-[11px] text-zinc-500">
                                Era {formatIsoDateLabel(row.ruleIso)}
                              </p>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        {agreement ? (
                          <LtaRuleSetChips agreement={agreement} />
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${chip.className}`}
                        >
                          {chip.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        {row.ruleIso ? (
                          <input
                            type="checkbox"
                            checked={row.kind === "skip"}
                            disabled={saving}
                            onChange={() => toggleSkip(row.key)}
                            className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
                            aria-label={`Omitir ${row.ruleIso}`}
                          />
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <div className="flex items-center gap-1">
                          {editingKey === row.key ? (
                            <>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={confirmEdit}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
                                aria-label="Confirmar fecha"
                                title="Confirmar"
                              >
                                <Check className="h-3.5 w-3.5" strokeWidth={2} />
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={cancelEdit}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-500/10 disabled:opacity-50"
                                aria-label="Cancelar edición"
                                title="Cancelar"
                              >
                                <X className="h-3.5 w-3.5" strokeWidth={2} />
                              </button>
                            </>
                          ) : row.kind !== "skip" ? (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => startEdit(row)}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-[var(--admin-accent)]/10 hover:text-[var(--admin-accent)] disabled:opacity-50"
                              aria-label="Editar fecha"
                              title="Editar fecha"
                            >
                              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          ) : null}
                          {row.kind === "include" ? (
                            <ConfirmDeleteButton
                              deleteLabel="esta fecha extra"
                              onDelete={() => {
                                setEditingKey(null);
                                setEditSnapshot(null);
                                removeInclude(row.key);
                              }}
                              disabled={saving}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
                              ariaLabel="Quitar fecha extra"
                              title="Quitar fecha extra"
                            />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-sm text-zinc-500"
                    >
                      Sin fechas en la zona LTA de este acuerdo.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-dashed border-[var(--admin-border)] p-3">
            <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Agregar fecha extra
            </label>
            <div className="flex min-w-0 flex-nowrap items-center gap-2">
              <div className="w-[9.5rem] shrink-0">
                <IsoDateInput
                  value={extraDate}
                  onChange={setExtraDate}
                  size="compact"
                  disabled={saving}
                />
              </div>
              {agreement ? (
                <LtaRuleSetChips
                  agreement={agreement}
                  className="min-w-0 flex-1"
                />
              ) : (
                <div className="min-w-0 flex-1" />
              )}
              <button
                type="button"
                disabled={saving || !extraDate.trim()}
                onClick={addExtra}
                className="ml-auto inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-[var(--admin-border)] px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-[var(--admin-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-200"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
