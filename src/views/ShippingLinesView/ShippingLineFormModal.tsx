"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import CatalogLogoField from "@/components/ui/CatalogLogoField";
import { FormField } from "@/components/ui/FormField";
import FormSection from "@/components/ui/FormSection";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { submitModalForm } from "@/lib/apiFormErrors";
import { fetchShippingLineGroups } from "@/services/catalogs/shippingLineGroupService";
import type { ShippingLine, ShippingLinePayload } from "@/types/cruise";
import { shippingLineStatusLabel } from "@/types/cruise";
import ShippingLineGroupSelect, {
  type ShippingLineGroupOption,
} from "./ShippingLineGroupSelect";

export type ShippingLineFormMode = "create" | "edit";

export type ShippingLineFormSubmitPayload = {
  payload: ShippingLinePayload;
  logoFile?: File | null;
  removeLogo?: boolean;
};

type ShippingLineFormModalProps = {
  open: boolean;
  mode: ShippingLineFormMode;
  initial?: ShippingLine | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: ShippingLineFormSubmitPayload) => Promise<void>;
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [groupOptions, setGroupOptions] = useState<ShippingLineGroupOption[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? lineToForm(initial) : emptyForm());
    setErrors({});
    setSubmitError(null);
    setLogoFile(null);
    setRemoveLogo(false);
    setLogoPreview(initial?.logo ?? null);
    fetchShippingLineGroups()
      .then((groups) =>
        setGroupOptions(groups.map((group) => ({ value: group.id, label: group.name }))),
      )
      .catch(() => setGroupOptions([]));
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    if (removeLogo) {
      setLogoPreview(null);
      return;
    }
    setLogoPreview(initial?.logo ?? null);
  }, [open, logoFile, removeLogo, initial?.logo]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    await submitModalForm(
      () =>
        onSubmit({
          payload: {
            ...form,
            code: form.code.trim().toLowerCase().replace(/\s+/g, "_"),
            name: form.name.trim(),
          },
          logoFile,
          removeLogo,
        }),
      {
        fallback: mode === "create" ? "No se pudo crear la naviera." : "No se pudo guardar la naviera.",
        setSubmitError,
        setFieldErrors: setErrors,
      },
    );
  }

  const title = mode === "create" ? "Nueva naviera" : "Editar naviera";
  const displayName = form.name.trim() || "Naviera sin nombre";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-3xl"
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
            <DefaultButton type="submit" form="shipping-line-form" disabled={saving}>
              {saving ? "Guardando…" : mode === "create" ? "Crear naviera" : "Guardar cambios"}
            </DefaultButton>
          </div>
        </div>
      }
    >
      <form id="shipping-line-form" onSubmit={handleSubmit}>
        <ModalFormError message={submitError} />
        <div className="grid gap-5 lg:grid-cols-[minmax(220px,260px)_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
            <div className="rounded-xl border border-zinc-200/80 bg-gradient-to-b from-[var(--admin-accent)]/5 to-white p-4 dark:border-zinc-800 dark:from-[var(--admin-accent)]/10 dark:to-zinc-900">
              <CatalogLogoField
                compact
                label="Logo de la naviera"
                deleteLabel="el logo de la naviera"
                previewUrl={logoPreview}
                disabled={saving}
                onFileChange={(file) => {
                  setLogoFile(file);
                  setRemoveLogo(false);
                }}
                onRemove={() => {
                  setLogoFile(null);
                  setRemoveLogo(true);
                }}
                canRemove={Boolean(logoPreview)}
              />
              <div className="mt-4 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {displayName}
                </p>
                <span className="mt-2 inline-flex rounded-full bg-[var(--admin-accent)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--admin-accent)]">
                  {shippingLineStatusLabel(form.is_active)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
              <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <span className="font-medium">Naviera activa</span>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setField("is_active", event.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
                />
              </label>
            </div>
          </aside>

          <div className="space-y-4">
            <FormSection
              title="Identificación"
              description="Marca operativa y código único en el catálogo."
              columns={1}
            >
              <ShippingLineGroupSelect
                value={form.group}
                onChange={(value) => setField("group", value)}
                options={groupOptions}
                onOptionsChange={setGroupOptions}
                error={errors.group}
                disabled={saving}
              />
              <FormField
                label="Código"
                name="code"
                value={form.code}
                onChange={(value) => setField("code", String(value))}
                required
                error={errors.code}
                disabled={mode === "edit"}
                placeholder="aida_cruises"
              />
              <FormField
                label="Nombre (marca)"
                name="name"
                value={form.name}
                onChange={(value) => setField("name", String(value))}
                required
                error={errors.name}
                placeholder="AIDA Cruises"
              />
            </FormSection>
          </div>
        </div>
      </form>
    </Modal>
  );
}
