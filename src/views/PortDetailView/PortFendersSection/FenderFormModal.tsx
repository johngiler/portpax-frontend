"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import FormSection from "@/components/ui/FormSection";
import { FormField } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { submitModalForm } from "@/lib/apiFormErrors";
import type { PortFender, PortFenderPayload } from "@/types/catalog";
import FenderTypeSelect, { type FenderTypeOption } from "./FenderTypeSelect";

export type FenderFormMode = "create" | "edit";

type FenderFormModalProps = {
  open: boolean;
  mode: FenderFormMode;
  portId: number;
  typeOptions: FenderTypeOption[];
  initial?: PortFender | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: PortFenderPayload) => Promise<void>;
};

type FormState = PortFenderPayload;

type FieldErrors = Partial<Record<keyof FormState, string>>;

function emptyForm(portId: number): FormState {
  return {
    port: portId,
    fender_type: "",
    quantity: 1,
    sort_order: 0,
    notes: "",
    is_active: true,
  };
}

function fenderToForm(fender: PortFender): FormState {
  return {
    port: fender.port,
    fender_type: fender.fender_type,
    quantity: fender.quantity,
    sort_order: fender.sort_order,
    notes: fender.notes,
    is_active: fender.is_active,
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.fender_type.trim()) errors.fender_type = "Requerido";
  if (!form.quantity || form.quantity < 1) errors.quantity = "Mínimo 1";
  return errors;
}

export default function FenderFormModal({
  open,
  mode,
  portId,
  typeOptions,
  initial,
  saving,
  onClose,
  onSubmit,
}: FenderFormModalProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm(portId));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? fenderToForm(initial) : emptyForm(portId));
    setErrors({});
    setSubmitError(null);
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
    await submitModalForm(
      () =>
        onSubmit({
          ...form,
          fender_type: form.fender_type.trim(),
          notes: form.notes.trim(),
        }),
      {
        fallback: "No se pudo guardar la defensa.",
        setSubmitError,
        setFieldErrors: setErrors,
      },
    );
  }

  const title = mode === "create" ? "Nueva defensa" : "Editar defensa";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-lg"
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
            <DefaultButton type="submit" form="fender-form" disabled={saving}>
              {saving ? "Guardando…" : mode === "create" ? "Agregar defensa" : "Guardar cambios"}
            </DefaultButton>
          </div>
        </div>
      }
    >
      <form id="fender-form" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <ModalFormError message={submitError} />
          <FormSection title="Inventario" description="Cantidad y tipo de defensa.">
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
            <FenderTypeSelect
              value={form.fender_type}
              onChange={(value) => setField("fender_type", value)}
              options={typeOptions}
              error={errors.fender_type}
              disabled={saving}
            />
            <FormField
              label="Notas"
              name="notes"
              value={form.notes}
              onChange={(v) => setField("notes", String(v))}
            />
          </FormSection>

          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-zinc-700 dark:text-zinc-200">
              <span className="font-medium">Activa</span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setField("is_active", e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
              />
            </label>
            <p className="mt-2 text-xs text-zinc-500">
              {form.is_active
                ? "La defensa se incluye en el inventario del puerto."
                : "Oculta del inventario activo."}
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
