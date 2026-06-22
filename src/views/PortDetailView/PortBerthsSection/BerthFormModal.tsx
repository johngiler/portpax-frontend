"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import FormSection from "@/components/ui/FormSection";
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
    latitude: null,
    longitude: null,
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
    latitude: berth.latitude != null ? Number(berth.latitude) : null,
    longitude: berth.longitude != null ? Number(berth.longitude) : null,
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
  const displayName = form.name.trim() || form.code.trim() || "Muelle sin nombre";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-2xl"
      footer={
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="hidden text-xs text-zinc-500 sm:block">
            Los campos con <span className="text-red-500">*</span> son obligatorios.
          </p>
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
              {saving ? "Guardando…" : mode === "create" ? "Crear muelle" : "Guardar cambios"}
            </DefaultButton>
          </div>
        </div>
      }
    >
      <form id="berth-form" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200/80 bg-gradient-to-b from-[var(--admin-accent)]/5 to-white p-4 dark:border-zinc-800 dark:from-[var(--admin-accent)]/10 dark:to-zinc-900">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{displayName}</p>
            {form.code.trim() && (
              <p className="mt-0.5 text-xs text-zinc-500">Código: {form.code.trim().toUpperCase()}</p>
            )}
          </div>

          <FormSection title="Identificación" description="Código y nombre del muelle.">
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
          </FormSection>

          <FormSection title="Dimensiones" description="Medidas físicas y calado.">
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
          </FormSection>

          <FormSection title="Ubicación" description="Coordenadas GPS del muelle.">
            <FormField
              label="Latitud"
              name="latitude"
              type="number"
              step="any"
              value={form.latitude ?? ""}
              onChange={(v) => setField("latitude", v === "" ? null : Number(v))}
            />
            <FormField
              label="Longitud"
              name="longitude"
              type="number"
              step="any"
              value={form.longitude ?? ""}
              onChange={(v) => setField("longitude", v === "" ? null : Number(v))}
            />
          </FormSection>

          <FormSection title="Notas" description="Observaciones internas." columns={1}>
            <FormField
              label="Notas"
              name="notes"
              value={form.notes}
              onChange={(v) => setField("notes", String(v))}
            />
          </FormSection>

          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-zinc-700 dark:text-zinc-200">
              <span className="font-medium">Activo</span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setField("is_active", e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
              />
            </label>
            <p className="mt-2 text-xs text-zinc-500">
              {form.is_active
                ? "El muelle aparece en listados y asignaciones."
                : "Oculto para usuarios; conserva su historial."}
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
