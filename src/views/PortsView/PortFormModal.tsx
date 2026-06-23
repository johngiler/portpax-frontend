"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { submitModalForm } from "@/lib/apiFormErrors";
import type { Port, PortPayload, PortOperationalStatus } from "@/types/catalog";
import { PORT_STATUS_OPTIONS, portStatusLabel } from "@/types/catalog";
import FormSection from "@/components/ui/FormSection";
import PortLogoField from "./PortLogoField";

export type PortFormMode = "create" | "edit";

export type PortFormSubmitPayload = {
  payload: PortPayload;
  logoFile?: File | null;
  removeLogo?: boolean;
};

type PortFormModalProps = {
  open: boolean;
  mode: PortFormMode;
  initial?: Port | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: PortFormSubmitPayload) => Promise<void>;
};

type FormState = PortPayload;

type FieldErrors = Partial<Record<keyof FormState, string>>;

function emptyForm(): FormState {
  return {
    code: "",
    name: "",
    commercial_name: "",
    country: "",
    region: "",
    latitude: null,
    longitude: null,
    status: "operational",
    min_berth_draft_m: null,
    anchorage_slot_count: 0,
    fender_count: null,
    notes: "",
    is_active: true,
  };
}

function portToForm(port: Port): FormState {
  return {
    code: port.code,
    name: port.name,
    commercial_name: port.commercial_name,
    country: port.country,
    region: port.region,
    latitude: port.latitude != null ? Number(port.latitude) : null,
    longitude: port.longitude != null ? Number(port.longitude) : null,
    status: port.status,
    min_berth_draft_m:
      port.min_berth_draft_m != null ? Number(port.min_berth_draft_m) : null,
    anchorage_slot_count: port.anchorage_slot_count,
    fender_count: port.fender_count != null ? Number(port.fender_count) : null,
    notes: port.notes,
    is_active: port.is_active,
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.code.trim()) errors.code = "Requerido";
  if (!form.name.trim()) errors.name = "Requerido";
  if (!form.country.trim()) errors.country = "Requerido";
  return errors;
}

export default function PortFormModal({
  open,
  mode,
  initial,
  saving,
  onClose,
  onSubmit,
}: PortFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? portToForm(initial) : emptyForm());
    setErrors({});
    setSubmitError(null);
    setLogoFile(null);
    setRemoveLogo(false);
    setLogoPreview(initial?.logo ?? null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const payload: PortPayload = {
      ...form,
      code: form.code.trim().toLowerCase().replace(/\s+/g, "_"),
      name: form.name.trim(),
      commercial_name: form.commercial_name.trim(),
      country: form.country.trim(),
      region: form.region.trim(),
    };
    await submitModalForm(
      () =>
        onSubmit({
          payload,
          logoFile,
          removeLogo,
        }),
      {
        fallback: mode === "create" ? "No se pudo crear el puerto." : "No se pudo guardar el puerto.",
        setSubmitError,
        setFieldErrors: setErrors,
      },
    );
  }

  const title = mode === "create" ? "Nuevo puerto" : "Editar detalles del puerto";
  const displayName = form.name.trim() || "Puerto sin nombre";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-4xl"
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
            <DefaultButton type="submit" form="port-form" disabled={saving}>
              {saving ? "Guardando…" : mode === "create" ? "Crear puerto" : "Guardar cambios"}
            </DefaultButton>
          </div>
        </div>
      }
    >
      <form id="port-form" onSubmit={handleSubmit}>
        <ModalFormError message={submitError} />
        <div className="grid gap-5 lg:grid-cols-[minmax(220px,260px)_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
            <div className="rounded-xl border border-zinc-200/80 bg-gradient-to-b from-[var(--admin-accent)]/5 to-white p-4 dark:border-zinc-800 dark:from-[var(--admin-accent)]/10 dark:to-zinc-900">
              <PortLogoField
                compact
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
                {form.commercial_name.trim() && (
                  <p className="truncate text-xs text-zinc-500">{form.commercial_name}</p>
                )}
                <span className="mt-2 inline-flex rounded-full bg-[var(--admin-accent)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--admin-accent)]">
                  {portStatusLabel(form.status)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
              <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <span className="font-medium">Visible en catálogo</span>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setField("is_active", e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
                />
              </label>
              <p className="mt-2 text-xs text-zinc-500">
                {form.is_active
                  ? "El puerto aparece en listados y búsquedas."
                  : "Oculto para usuarios; conserva su historial."}
              </p>
            </div>
          </aside>

          <div className="space-y-4">
            <FormSection
              title="Identificación"
              description="Nombre y código único del puerto."
            >
              <FormField
                label="Código"
                name="code"
                value={form.code}
                onChange={(v) => setField("code", String(v))}
                required
                error={errors.code}
                disabled={mode === "edit"}
                placeholder="puerto_plata"
              />
              <FormField
                label="Nombre"
                name="name"
                value={form.name}
                onChange={(v) => setField("name", String(v))}
                required
                error={errors.name}
                placeholder="Puerto Plata"
              />
              <FormField
                label="Nombre comercial"
                name="commercial_name"
                value={form.commercial_name}
                onChange={(v) => setField("commercial_name", String(v))}
                placeholder="Taino Bay"
              />
              <FormFieldSelect<PortOperationalStatus>
                label="Estado operativo"
                name="status"
                value={form.status}
                onChange={(v) => setField("status", v)}
                options={PORT_STATUS_OPTIONS}
              />
            </FormSection>

            <FormSection title="Ubicación" description="País, región y coordenadas.">
              <FormField
                label="País"
                name="country"
                value={form.country}
                onChange={(v) => setField("country", String(v))}
                required
                error={errors.country}
              />
              <FormField
                label="Región"
                name="region"
                value={form.region}
                onChange={(v) => setField("region", String(v))}
              />
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

            <FormSection
              title="Capacidad"
              description="Parámetros técnicos del puerto."
            >
              <FormField
                label="Calado mínimo (m)"
                name="min_berth_draft_m"
                type="number"
                step="0.01"
                value={form.min_berth_draft_m ?? ""}
                onChange={(v) =>
                  setField("min_berth_draft_m", v === "" ? null : Number(v))
                }
              />
              <FormField
                label="Posiciones de fondeo"
                name="anchorage_slot_count"
                type="number"
                min={0}
                value={form.anchorage_slot_count}
                onChange={(v) => setField("anchorage_slot_count", Number(v) || 0)}
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
          </div>
        </div>
      </form>
    </Modal>
  );
}
