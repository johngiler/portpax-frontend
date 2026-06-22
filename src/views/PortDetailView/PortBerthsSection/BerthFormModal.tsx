"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FormField } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import type { Berth, BerthPayload } from "@/types/catalog";

export type BerthFormMode = "create" | "edit";

type BerthFormModalProps = {
  open: boolean;
  mode: BerthFormMode;
  portId: number;
  initial?: Berth | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: BerthPayload) => Promise<void>;
};

type FormState = BerthPayload;

type FieldErrors = Partial<Record<keyof FormState, string>>;

function emptyForm(portId: number): FormState {
  return {
    port: portId,
    code: "",
    name: "",
    length_m: null,
    width_m: null,
    walkway_length_m: null,
    walkway_width_m: null,
    min_draft_m: null,
    notes: "",
    sort_order: 0,
    is_active: true,
  };
}

function berthToForm(berth: Berth): FormState {
  return {
    port: berth.port,
    code: berth.code,
    name: berth.name,
    length_m: berth.length_m != null ? Number(berth.length_m) : null,
    width_m: berth.width_m != null ? Number(berth.width_m) : null,
    walkway_length_m:
      berth.walkway_length_m != null ? Number(berth.walkway_length_m) : null,
    walkway_width_m: berth.walkway_width_m != null ? Number(berth.walkway_width_m) : null,
    min_draft_m: berth.min_draft_m != null ? Number(berth.min_draft_m) : null,
    notes: berth.notes,
    sort_order: berth.sort_order,
    is_active: berth.is_active,
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.code.trim()) errors.code = "Requerido";
  return errors;
}

export default function BerthFormModal({
  open,
  mode,
  portId,
  initial,
  saving,
  onClose,
  onSubmit,
}: BerthFormModalProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm(portId));
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!open) return;
    setForm(initial ? berthToForm(initial) : emptyForm(portId));
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
      code: form.code.trim().toUpperCase().replace(/\s+/g, "_"),
      name: form.name.trim(),
      notes: form.notes.trim(),
    });
  }

  const title = mode === "create" ? "Nuevo muelle" : "Editar muelle";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-2xl"
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
          <DefaultButton type="submit" form="berth-form" disabled={saving}>
            {saving ? "Guardando…" : mode === "create" ? "Crear" : "Guardar"}
          </DefaultButton>
        </div>
      }
    >
      <form id="berth-form" onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid gap-x-4 sm:grid-cols-2">
          <FormField
            label="Código"
            name="code"
            value={form.code}
            onChange={(v) => setField("code", String(v))}
            required
            error={errors.code}
            disabled={mode === "edit"}
            placeholder="P1"
          />
          <FormField
            label="Nombre"
            name="name"
            value={form.name}
            onChange={(v) => setField("name", String(v))}
            placeholder="Muelle principal"
          />
          <FormField
            label="Longitud (m)"
            name="length_m"
            type="number"
            step="0.01"
            value={form.length_m ?? ""}
            onChange={(v) => setField("length_m", v === "" ? null : Number(v))}
          />
          <FormField
            label="Ancho (m)"
            name="width_m"
            type="number"
            step="0.01"
            value={form.width_m ?? ""}
            onChange={(v) => setField("width_m", v === "" ? null : Number(v))}
          />
          <FormField
            label="Pasarela — longitud (m)"
            name="walkway_length_m"
            type="number"
            step="0.01"
            value={form.walkway_length_m ?? ""}
            onChange={(v) => setField("walkway_length_m", v === "" ? null : Number(v))}
          />
          <FormField
            label="Pasarela — ancho (m)"
            name="walkway_width_m"
            type="number"
            step="0.01"
            value={form.walkway_width_m ?? ""}
            onChange={(v) => setField("walkway_width_m", v === "" ? null : Number(v))}
          />
          <FormField
            label="Calado (m)"
            name="min_draft_m"
            type="number"
            step="0.01"
            value={form.min_draft_m ?? ""}
            onChange={(v) => setField("min_draft_m", v === "" ? null : Number(v))}
          />
          <FormField
            label="Orden"
            name="sort_order"
            type="number"
            min={0}
            value={form.sort_order}
            onChange={(v) => setField("sort_order", Number(v) || 0)}
          />
        </div>
        <FormField
          label="Notas"
          name="notes"
          value={form.notes}
          onChange={(v) => setField("notes", String(v))}
        />
        <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setField("is_active", e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
          />
          Activo
        </label>
      </form>
    </Modal>
  );
}
