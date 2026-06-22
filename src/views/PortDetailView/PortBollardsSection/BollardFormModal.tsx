"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import type { BollardType, PortBollard, PortBollardPayload } from "@/types/catalog";
import { BOLLARD_TYPE_OPTIONS } from "@/types/catalog";

export type BollardFormMode = "create" | "edit";

type BollardFormModalProps = {
  open: boolean;
  mode: BollardFormMode;
  portId: number;
  initial?: PortBollard | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: PortBollardPayload) => Promise<void>;
};

type FormState = PortBollardPayload;

type FieldErrors = Partial<Record<keyof FormState, string>>;

function emptyForm(portId: number): FormState {
  return {
    port: portId,
    capacity_t: 200,
    bollard_type: "standard",
    quantity: 1,
    label: "",
    sort_order: 0,
    notes: "",
    is_active: true,
  };
}

function bollardToForm(bollard: PortBollard): FormState {
  return {
    port: bollard.port,
    capacity_t: bollard.capacity_t,
    bollard_type: bollard.bollard_type,
    quantity: bollard.quantity,
    label: bollard.label,
    sort_order: bollard.sort_order,
    notes: bollard.notes,
    is_active: bollard.is_active,
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.capacity_t || form.capacity_t < 1) errors.capacity_t = "Requerido";
  if (!form.quantity || form.quantity < 1) errors.quantity = "Mínimo 1";
  return errors;
}

export default function BollardFormModal({
  open,
  mode,
  portId,
  initial,
  saving,
  onClose,
  onSubmit,
}: BollardFormModalProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm(portId));
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!open) return;
    setForm(initial ? bollardToForm(initial) : emptyForm(portId));
    setErrors({});
  }, [open, initial, portId]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    await onSubmit({
      ...form,
      label: form.label.trim(),
      notes: form.notes.trim(),
    });
  }

  const title = mode === "create" ? "Nueva bita" : "Editar bita";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-md"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer rounded-md border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-[var(--admin-surface-muted)] disabled:opacity-50 dark:text-zinc-200"
          >
            Cancelar
          </button>
          <DefaultButton type="submit" form="bollard-form" disabled={saving}>
            {saving ? "Guardando…" : mode === "create" ? "Agregar" : "Guardar"}
          </DefaultButton>
        </div>
      }
    >
      <form id="bollard-form" onSubmit={handleSubmit} className="space-y-1">
        <FormField
          label="Capacidad (toneladas)"
          name="capacity_t"
          type="number"
          min={1}
          value={form.capacity_t}
          onChange={(v) => setField("capacity_t", Number(v) || 0)}
          required
          error={errors.capacity_t}
          placeholder="200"
        />
        <FormFieldSelect<BollardType>
          label="Tipo"
          name="bollard_type"
          value={form.bollard_type}
          onChange={(v) => setField("bollard_type", v)}
          options={BOLLARD_TYPE_OPTIONS}
        />
        <FormField
          label="Cantidad"
          name="quantity"
          type="number"
          min={1}
          value={form.quantity}
          onChange={(v) => setField("quantity", Number(v) || 1)}
          required
          error={errors.quantity}
        />
        <FormField
          label="Etiqueta (opcional)"
          name="label"
          value={form.label}
          onChange={(v) => setField("label", String(v))}
          placeholder="Ej. QRH, T-head…"
        />
        <FormField
          label="Notas"
          name="notes"
          value={form.notes}
          onChange={(v) => setField("notes", String(v))}
        />
        <FormField
          label="Orden"
          name="sort_order"
          type="number"
          min={0}
          value={form.sort_order}
          onChange={(v) => setField("sort_order", Number(v) || 0)}
        />
        <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setField("is_active", e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
          />
          Activa
        </label>
      </form>
    </Modal>
  );
}
