"use client";

import { useState, useEffect } from "react";
import type { Ship, ShippingLine } from "@/lib/docking";
import { getShippingLines } from "@/lib/docking";
import { createShip, updateShip } from "@/lib/docking";
import Modal from "@/components/ui/Modal";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";

type Props = {
  open: boolean;
  onClose: () => void;
  edit: Ship | null;
  onSuccess: () => void;
};

function toNum(v: string | number | null | undefined): "" | number {
  if (v === "" || v === null || v === undefined) return "";
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isNaN(n) ? "" : n;
}

export default function ShipFormModal({ open, onClose, edit, onSuccess }: Props) {
  const [lines, setLines] = useState<ShippingLine[]>([]);
  const [shippingLineId, setShippingLineId] = useState<number>(edit?.shipping_line ?? 0);
  const [name, setName] = useState(edit?.name ?? "");
  const [code, setCode] = useState(edit?.code ?? "");
  const [imo, setImo] = useState(edit?.imo ?? "");
  const [capacityPax, setCapacityPax] = useState<number | "">(edit?.capacity_pax ?? "");
  const [lengthM, setLengthM] = useState<number | "">(toNum(edit?.length_m));
  const [draftM, setDraftM] = useState<number | "">(toNum(edit?.draft_m));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) getShippingLines({ page_size: 100 }).then((r) => setLines(r.results)).catch(() => setLines([]));
  }, [open]);

  const isEdit = edit != null;

  useEffect(() => {
    if (open) {
      setShippingLineId(edit?.shipping_line ?? lines[0]?.id ?? 0);
      setName(edit?.name ?? "");
      setCode(edit?.code ?? "");
      setImo(edit?.imo ?? "");
      setCapacityPax(edit?.capacity_pax ?? "");
      setLengthM(toNum(edit?.length_m));
      setDraftM(toNum(edit?.draft_m));
      setError(null);
    }
  }, [open, edit, lines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        shipping_line: shippingLineId,
        name: name.trim(),
        code: code.trim() || undefined,
        imo: imo.trim() || undefined,
        capacity_pax: capacityPax === "" ? null : Number(capacityPax),
        length_m: lengthM === "" ? null : Number(lengthM),
        draft_m: draftM === "" ? null : Number(draftM),
      };
      if (isEdit) {
        await updateShip(edit.id, payload);
      } else {
        await createShip(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const lineOptions = lines.map((l) => ({ value: l.id, label: l.name }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar barco" : "Nuevo barco"}
      panelClassName="max-w-2xl"
      footer={
        <button
            type="submit"
            form="ship-form"
            disabled={saving || !name.trim() || !shippingLineId}
            className="btn-primary-gradient cursor-pointer rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105 hover:shadow-[0_8px_22px_-14px_rgba(52,120,181,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando…" : isEdit ? "Guardar" : "Crear"}
          </button>
      }
    >
      <form id="ship-form" onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}
        <FormFieldSelect
          label="Naviera"
          name="shipping_line"
          value={shippingLineId}
          onChange={setShippingLineId}
          options={lineOptions}
          optionLabel="Seleccionar naviera"
          emptyValue={0 as unknown as number}
          required
        />
        <FormField label="Nombre del barco" name="name" value={name} onChange={setName} required />
        <FormField label="Código" name="code" value={code} onChange={setCode} placeholder="Ej. HAL ZUIDERDAM" />
        <FormField label="IMO" name="imo" value={imo} onChange={setImo} placeholder="Ej. 9744001" />
        <FormField
          label="Capacidad PAX"
          name="capacity_pax"
          type="number"
          value={capacityPax}
          onChange={setCapacityPax}
          min={0}
        />
        <FormField
          label="Eslora (m)"
          name="length_m"
          type="number"
          value={lengthM}
          onChange={setLengthM}
          min={0}
          step="0.01"
        />
        <FormField
          label="Calado (m)"
          name="draft_m"
          type="number"
          value={draftM}
          onChange={setDraftM}
          min={0}
          step="0.01"
        />
      </form>
    </Modal>
  );
}
