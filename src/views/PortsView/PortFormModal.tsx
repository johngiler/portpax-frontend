"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import type { Port, PortPayload, PortOperationalStatus } from "@/types/catalog";
import { PORT_STATUS_OPTIONS } from "@/types/catalog";

export type PortFormMode = "create" | "edit";

type PortFormModalProps = {
  open: boolean;
  mode: PortFormMode;
  initial?: Port | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: PortPayload) => Promise<void>;
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
    largest_vessel_recorded: "",
    largest_vessel_loa_m: null,
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
    largest_vessel_recorded: port.largest_vessel_recorded,
    largest_vessel_loa_m:
      port.largest_vessel_loa_m != null ? Number(port.largest_vessel_loa_m) : null,
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

  useEffect(() => {
    if (!open) return;
    setForm(initial ? portToForm(initial) : emptyForm());
    setErrors({});
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
    const payload: PortPayload = {
      ...form,
      code: form.code.trim().toLowerCase().replace(/\s+/g, "_"),
      name: form.name.trim(),
      commercial_name: form.commercial_name.trim(),
      country: form.country.trim(),
      region: form.region.trim(),
    };
    await onSubmit(payload);
  }

  const title = mode === "create" ? "Nuevo puerto" : "Editar puerto";

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
          <DefaultButton type="submit" form="port-form" disabled={saving}>
            {saving ? "Guardando…" : mode === "create" ? "Crear" : "Guardar"}
          </DefaultButton>
        </div>
      }
    >
      <form id="port-form" onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid gap-x-4 sm:grid-cols-2">
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
          <FormFieldSelect<PortOperationalStatus>
            label="Estado"
            name="status"
            value={form.status}
            onChange={(v) => setField("status", v)}
            options={PORT_STATUS_OPTIONS}
          />
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
          <FormField
            label="Mayor barco (nombre)"
            name="largest_vessel_recorded"
            value={form.largest_vessel_recorded}
            onChange={(v) => setField("largest_vessel_recorded", String(v))}
          />
          <FormField
            label="Mayor barco LOA (m)"
            name="largest_vessel_loa_m"
            type="number"
            step="0.01"
            value={form.largest_vessel_loa_m ?? ""}
            onChange={(v) =>
              setField("largest_vessel_loa_m", v === "" ? null : Number(v))
            }
          />
        </div>
        <FormField
          label="Notas"
          name="notes"
          value={form.notes}
          onChange={(v) => setField("notes", String(v))}
        />
        <div className="mb-4 flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setField("is_active", e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
            />
            Activo
          </label>
        </div>
      </form>
    </Modal>
  );
}
