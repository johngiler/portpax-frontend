"use client";

import { useState, useEffect } from "react";
import type { Berth, Port } from "@/lib/docking";
import { getPorts } from "@/lib/docking";
import { createBerth, updateBerth } from "@/lib/docking";
import Modal from "@/components/ui/Modal";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";

type Props = {
  open: boolean;
  onClose: () => void;
  edit: Berth | null;
  onSuccess: () => void;
};

function toNum(v: string | number | null | undefined): "" | number {
  if (v === "" || v === null || v === undefined) return "";
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isNaN(n) ? "" : n;
}

export default function BerthFormModal({ open, onClose, edit, onSuccess }: Props) {
  const [ports, setPorts] = useState<Port[]>([]);
  const [portId, setPortId] = useState<number>(edit?.port ?? 0);
  const [name, setName] = useState(edit?.name ?? "");
  const [capacityPax, setCapacityPax] = useState<number | "">(edit?.capacity_pax ?? "");
  const [maxDraftM, setMaxDraftM] = useState<number | "">(toNum(edit?.max_draft_m));
  const [maxLengthM, setMaxLengthM] = useState<number | "">(toNum(edit?.max_length_m));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) getPorts({ page_size: 100 }).then((r) => setPorts(r.results)).catch(() => setPorts([]));
  }, [open]);

  const isEdit = edit != null;

  useEffect(() => {
    if (open) {
      setPortId(edit?.port ?? ports[0]?.id ?? 0);
      setName(edit?.name ?? "");
      setCapacityPax(edit?.capacity_pax ?? "");
      setMaxDraftM(toNum(edit?.max_draft_m));
      setMaxLengthM(toNum(edit?.max_length_m));
      setError(null);
    }
  }, [open, edit, ports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        port: portId,
        name: name.trim(),
        capacity_pax: capacityPax === "" ? null : Number(capacityPax),
        max_draft_m: maxDraftM === "" ? null : Number(maxDraftM),
        max_length_m: maxLengthM === "" ? null : Number(maxLengthM),
      };
      if (isEdit) {
        await updateBerth(edit.id, payload);
      } else {
        await createBerth(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const portOptions = ports.map((p) => ({ value: p.id, label: p.name }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar muelle" : "Nuevo muelle"}
      panelClassName="max-w-2xl"
      footer={
        <button
            type="submit"
            form="berth-form"
            disabled={saving || !name.trim() || !portId}
            className="btn-primary-gradient cursor-pointer rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105 hover:shadow-[0_8px_22px_-14px_rgba(52,120,181,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando…" : isEdit ? "Guardar" : "Crear"}
          </button>
      }
    >
      <form id="berth-form" onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}
        <FormFieldSelect
          label="Puerto"
          name="port"
          value={portId}
          onChange={setPortId}
          options={portOptions}
          optionLabel="Seleccionar puerto"
          emptyValue={0 as unknown as number}
          required
        />
        <FormField label="Nombre del muelle" name="name" value={name} onChange={setName} required />
        <FormField
          label="Capacidad PAX"
          name="capacity_pax"
          type="number"
          value={capacityPax}
          onChange={setCapacityPax}
          min={0}
        />
        <FormField
          label="Calado máx. (m)"
          name="max_draft_m"
          type="number"
          value={maxDraftM}
          onChange={setMaxDraftM}
          min={0}
          step="0.01"
        />
        <FormField
          label="Eslora máx. (m)"
          name="max_length_m"
          type="number"
          value={maxLengthM}
          onChange={setMaxLengthM}
          min={0}
          step="0.01"
        />
      </form>
    </Modal>
  );
}
