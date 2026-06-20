"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import { fetchShippingLineGroups } from "@/services/catalogs/shippingLineGroupService";
import type { ShippingLine, ShippingLinePayload } from "@/types/cruise";

export type ShippingLineFormMode = "create" | "edit";

type ShippingLineFormModalProps = {
  open: boolean;
  mode: ShippingLineFormMode;
  initial?: ShippingLine | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: ShippingLinePayload) => Promise<void>;
};

type FormState = ShippingLinePayload;

type FieldErrors = Partial<Record<keyof FormState, string>>;

function emptyForm(): FormState {
  return {
    group: 0,
    code: "",
    name: "",
    is_active: true,
  };
}

function lineToForm(line: ShippingLine): FormState {
  return {
    group: line.group,
    code: line.code,
    name: line.name,
    is_active: line.is_active,
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.group) errors.group = "Requerido";
  if (!form.code.trim()) errors.code = "Requerido";
  if (!form.name.trim()) errors.name = "Requerido";
  return errors;
}

export default function ShippingLineFormModal({
  open,
  mode,
  initial,
  saving,
  onClose,
  onSubmit,
}: ShippingLineFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [groupOptions, setGroupOptions] = useState<{ value: number; label: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? lineToForm(initial) : emptyForm());
    setErrors({});
    fetchShippingLineGroups()
      .then((groups) =>
        setGroupOptions(groups.map((g) => ({ value: g.id, label: g.name }))),
      )
      .catch(() => setGroupOptions([]));
  }, [open, initial]);

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
      code: form.code.trim().toLowerCase().replace(/\s+/g, "_"),
      name: form.name.trim(),
    });
  }

  const title = mode === "create" ? "Nueva naviera" : "Editar naviera";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-lg"
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
          <DefaultButton type="submit" form="shipping-line-form" disabled={saving}>
            {saving ? "Guardando…" : mode === "create" ? "Crear" : "Guardar"}
          </DefaultButton>
        </div>
      }
    >
      <form id="shipping-line-form" onSubmit={handleSubmit}>
        <FormFieldSelect<number>
          label="Grupo corporativo"
          name="group"
          value={form.group}
          onChange={(v) => setField("group", v)}
          options={groupOptions}
          optionLabel="Seleccionar grupo…"
          emptyValue={0}
          required
          error={errors.group}
        />
        <FormField
          label="Código"
          name="code"
          value={form.code}
          onChange={(v) => setField("code", String(v))}
          required
          error={errors.code}
          disabled={mode === "edit"}
          placeholder="aida_cruises"
        />
        <FormField
          label="Nombre (marca)"
          name="name"
          value={form.name}
          onChange={(v) => setField("name", String(v))}
          required
          error={errors.name}
          placeholder="AIDA Cruises"
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
