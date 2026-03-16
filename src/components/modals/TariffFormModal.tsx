"use client";

import { useState, useEffect } from "react";
import type { Port, PortFeeRule } from "@/lib/docking";
import { createPortFeeRule, updatePortFeeRule, getPorts } from "@/lib/docking";
import Modal from "@/components/ui/Modal";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";

const FEE_TIER_OPTIONS = [
  { value: "RCL", label: "Royal Caribbean / Celebrity" },
  { value: "NCL", label: "Norwegian / Oceania / Regent" },
  { value: "MSC", label: "MSC" },
  { value: "CCL", label: "Carnival / Costa" },
  { value: "VV", label: "Virgin Voyages" },
  { value: "Others", label: "Otros" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  edit: PortFeeRule | null;
  viewOnly?: boolean;
  onSuccess: () => void;
};

function formatDateInput(s: string | null) {
  if (!s) return "";
  try {
    const d = new Date(s);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export default function TariffFormModal({ open, onClose, edit, viewOnly = false, onSuccess }: Props) {
  const [ports, setPorts] = useState<Port[]>([]);
  const [portId, setPortId] = useState<number>(edit?.port ?? 0);
  const [feeTier, setFeeTier] = useState(edit?.fee_tier ?? "");
  const [amountPerPax, setAmountPerPax] = useState(edit?.amount_per_pax_usd ?? "");
  const [minimumCharge, setMinimumCharge] = useState(edit?.minimum_charge_usd ?? "");
  const [validFrom, setValidFrom] = useState(formatDateInput(edit?.valid_from ?? null));
  const [validTo, setValidTo] = useState(formatDateInput(edit?.valid_to ?? null));
  const [notes, setNotes] = useState(edit?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = edit != null;

  useEffect(() => {
    if (open) {
      getPorts({ page_size: 500 })
        .then((r) => setPorts(r.results))
        .catch(() => setPorts([]));
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setPortId(edit?.port ?? 0);
      setFeeTier(edit?.fee_tier ?? "");
      setAmountPerPax(edit?.amount_per_pax_usd ?? "");
      setMinimumCharge(edit?.minimum_charge_usd ?? "");
      setValidFrom(formatDateInput(edit?.valid_from ?? null));
      setValidTo(formatDateInput(edit?.valid_to ?? null));
      setNotes(edit?.notes ?? "");
      setError(null);
    }
  }, [open, edit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewOnly) return;
    setError(null);
    setSaving(true);
    try {
      if (isEdit) {
        await updatePortFeeRule(edit.id, {
          port: portId,
          fee_tier: feeTier,
          amount_per_pax_usd: Number(amountPerPax),
          minimum_charge_usd: minimumCharge === "" ? null : Number(minimumCharge),
          valid_from: validFrom || null,
          valid_to: validTo || null,
          notes: notes.trim(),
        });
      } else {
        await createPortFeeRule({
          port: portId,
          fee_tier: feeTier,
          amount_per_pax_usd: Number(amountPerPax),
          minimum_charge_usd: minimumCharge === "" ? null : Number(minimumCharge),
          valid_from: validFrom || null,
          valid_to: validTo || null,
          notes: notes.trim(),
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const portOptions = ports.map((p) => ({
    value: p.id,
    label: p.code ? `${p.name} (${p.code})` : p.name,
  }));
  const title = viewOnly ? "Ver tarifa" : isEdit ? "Editar tarifa" : "Nueva tarifa";
  const disabled = viewOnly;
  const inputClass =
    "w-full rounded-md border border-[var(--admin-border)] bg-gradient-to-b from-white to-[var(--admin-surface-muted)] px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] transition-all focus:border-[var(--admin-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 dark:border-zinc-700/70 dark:from-zinc-900 dark:to-zinc-800 dark:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-70";
  const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-2xl"
      footer={
        viewOnly ? undefined : (
          <button
            type="submit"
            form="tariff-form"
            disabled={saving || !portId || !feeTier || amountPerPax === "" || Number(amountPerPax) < 0}
            className="btn-primary-gradient cursor-pointer rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105 hover:shadow-[0_8px_22px_-14px_rgba(52,120,181,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando…" : isEdit ? "Guardar" : "Crear"}
          </button>
        )
      }
    >
      <form id="tariff-form" onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormFieldSelect<number>
            label="Puerto"
            name="port"
            value={portId}
            onChange={setPortId}
            options={portOptions}
            optionLabel="Seleccionar puerto"
            emptyValue={0}
            required
            disabled={disabled}
          />
          <FormFieldSelect<string>
            label="Tier naviera"
            name="fee_tier"
            value={feeTier}
            onChange={setFeeTier}
            options={FEE_TIER_OPTIONS}
            optionLabel="Seleccionar tier"
            emptyValue=""
            required
            disabled={disabled}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="USD por pasajero"
            name="amount_per_pax_usd"
            type="number"
            value={amountPerPax}
            onChange={setAmountPerPax}
            required
            min={0}
            step="0.01"
            disabled={disabled}
          />
          <FormField
            label="Cargo mínimo USD (opcional)"
            name="minimum_charge_usd"
            type="number"
            value={minimumCharge}
            onChange={setMinimumCharge}
            min={0}
            step="0.01"
            disabled={disabled}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="mb-4">
            <label htmlFor="valid_from" className={labelClass}>
              Vigencia desde
            </label>
            <input
              id="valid_from"
              name="valid_from"
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className={inputClass}
              disabled={disabled}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="valid_to" className={labelClass}>
              Vigencia hasta
            </label>
            <input
              id="valid_to"
              name="valid_to"
              type="date"
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
              className={inputClass}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="notes" className={labelClass}>
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={inputClass}
            disabled={disabled}
            placeholder="Opcional"
          />
        </div>
      </form>
    </Modal>
  );
}
