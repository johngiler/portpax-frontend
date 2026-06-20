"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import { fetchBerths } from "@/services/catalogs/berthService";
import type { Position, PositionPayload, PositionType } from "@/types/catalog";
import { POSITION_TYPE_OPTIONS } from "@/types/catalog";

export type PositionFormMode = "create" | "edit";

type PositionFormModalProps = {
  open: boolean;
  mode: PositionFormMode;
  portId: number;
  initial?: Position | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: PositionPayload) => Promise<void>;
};

type FormState = PositionPayload;

type FieldErrors = Partial<Record<keyof FormState, string>>;

function emptyForm(portId: number): FormState {
  return {
    port: portId,
    berth: null,
    code: "",
    position_type: "pier",
    max_loa_m: null,
    min_draft_m: null,
    out_of_service: false,
    is_projection: false,
    notes: "",
    sort_order: 0,
    is_active: true,
  };
}

function positionToForm(position: Position): FormState {
  return {
    port: position.port,
    berth: position.berth,
    code: position.code,
    position_type: position.position_type,
    max_loa_m: position.max_loa_m != null ? Number(position.max_loa_m) : null,
    min_draft_m: position.min_draft_m != null ? Number(position.min_draft_m) : null,
    out_of_service: position.out_of_service,
    is_projection: position.is_projection,
    notes: position.notes,
    sort_order: position.sort_order,
    is_active: position.is_active,
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.code.trim()) errors.code = "Requerido";
  return errors;
}

export default function PositionFormModal({
  open,
  mode,
  portId,
  initial,
  saving,
  onClose,
  onSubmit,
}: PositionFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm(portId));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [berthOptions, setBerthOptions] = useState<{ value: number; label: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? positionToForm(initial) : emptyForm(portId));
    setErrors({});
    fetchBerths({ port: portId, pageSize: 100 })
      .then((data) =>
        setBerthOptions(data.results.map((b) => ({ value: b.id, label: b.code }))),
      )
      .catch(() => setBerthOptions([]));
  }, [open, initial, portId]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "position_type" && value === "anchorage") {
        next.berth = null;
      }
      return next;
    });
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
      code: form.code.trim().toUpperCase(),
      berth: form.position_type === "anchorage" ? null : form.berth,
    });
  }

  const title = mode === "create" ? "Nueva posición" : "Editar posición";

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
          <DefaultButton type="submit" form="position-form" disabled={saving}>
            {saving ? "Guardando…" : mode === "create" ? "Crear" : "Guardar"}
          </DefaultButton>
        </div>
      }
    >
      <form id="position-form" onSubmit={handleSubmit}>
        <FormField
          label="Código"
          name="code"
          value={form.code}
          onChange={(v) => setField("code", String(v))}
          required
          error={errors.code}
          placeholder="P1"
        />
        <FormFieldSelect<PositionType>
          label="Tipo"
          name="position_type"
          value={form.position_type}
          onChange={(v) => setField("position_type", v)}
          options={POSITION_TYPE_OPTIONS}
        />
        {form.position_type === "pier" && (
          <FormFieldSelect<number>
            label="Muelle"
            name="berth"
            value={form.berth ?? 0}
            onChange={(v) => setField("berth", v === 0 ? null : v)}
            options={berthOptions}
            optionLabel="Sin muelle asignado"
            emptyValue={0}
          />
        )}
        <div className="grid gap-x-4 sm:grid-cols-2">
          <FormField
            label="LOA máx. (m)"
            name="max_loa_m"
            type="number"
            step="0.01"
            value={form.max_loa_m ?? ""}
            onChange={(v) => setField("max_loa_m", v === "" ? null : Number(v))}
          />
          <FormField
            label="Calado mín. (m)"
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
        <div className="mb-4 flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={form.out_of_service}
              onChange={(e) => setField("out_of_service", e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
            />
            Fuera de servicio
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={form.is_projection}
              onChange={(e) => setField("is_projection", e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
            />
            Proyección
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setField("is_active", e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
            />
            Activa
          </label>
        </div>
      </form>
    </Modal>
  );
}
