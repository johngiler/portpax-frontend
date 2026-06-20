"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import { fetchBerths } from "@/services/catalogs/berthService";
import { fetchPorts } from "@/services/catalogs/portService";
import type { Position, PositionPayload, PositionType } from "@/types/catalog";
import { POSITION_TYPE_OPTIONS, portDisplayName } from "@/types/catalog";

export type PositionFormMode = "create" | "edit";

type PositionFormModalProps = {
  open: boolean;
  mode: PositionFormMode;
  /** When set, port is fixed (e.g. port detail modal). */
  lockedPortId?: number;
  initial?: Position | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: PositionPayload) => Promise<void>;
};

type FormState = PositionPayload;

type FieldErrors = Partial<Record<keyof FormState, string>>;

function emptyForm(portId = 0): FormState {
  return {
    port: portId,
    berth: null,
    code: "",
    position_type: "pier",
    max_loa_m: null,
    min_draft_m: null,
    bollard_count: null,
    fender_count: null,
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
    bollard_count: position.bollard_count,
    fender_count: position.fender_count,
    out_of_service: position.out_of_service,
    is_projection: position.is_projection,
    notes: position.notes,
    sort_order: position.sort_order,
    is_active: position.is_active,
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.port) errors.port = "Requerido";
  if (!form.code.trim()) errors.code = "Requerido";
  return errors;
}

export default function PositionFormModal({
  open,
  mode,
  lockedPortId,
  initial,
  saving,
  onClose,
  onSubmit,
}: PositionFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm(lockedPortId ?? 0));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [berthOptions, setBerthOptions] = useState<{ value: number; label: string }[]>([]);
  const [portOptions, setPortOptions] = useState<{ value: number; label: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    const defaultPort = lockedPortId ?? initial?.port ?? 0;
    setForm(initial ? positionToForm(initial) : emptyForm(defaultPort));
    setErrors({});
    if (!lockedPortId) {
      fetchPorts({ pageSize: 100 })
        .then((data) =>
          setPortOptions(
            data.results.map((p) => ({ value: p.id, label: portDisplayName(p) })),
          ),
        )
        .catch(() => setPortOptions([]));
    }
  }, [open, initial, lockedPortId]);

  useEffect(() => {
    if (!open || !form.port) {
      setBerthOptions([]);
      return;
    }
    fetchBerths({ port: form.port, pageSize: 100 })
      .then((data) =>
        setBerthOptions(data.results.map((b) => ({ value: b.id, label: b.code }))),
      )
      .catch(() => setBerthOptions([]));
  }, [open, form.port]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "position_type" && value === "anchorage") {
        next.berth = null;
      }
      if (key === "port") {
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
      port: lockedPortId ?? form.port,
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
        {!lockedPortId && (
          <FormFieldSelect<number>
            label="Puerto"
            name="port"
            value={form.port}
            onChange={(v) => setField("port", v)}
            options={portOptions}
            optionLabel="Seleccionar puerto…"
            emptyValue={0}
            required
            error={errors.port}
            disabled={mode === "edit"}
          />
        )}
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
        {form.position_type === "pier" && form.port > 0 && (
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
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
          Características
        </p>
        <div className="mb-4 grid gap-x-4 sm:grid-cols-2">
          <FormField
            label="Eslora (m)"
            name="max_loa_m"
            type="number"
            step="0.01"
            value={form.max_loa_m ?? ""}
            onChange={(v) => setField("max_loa_m", v === "" ? null : Number(v))}
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
            label="Bitas"
            name="bollard_count"
            type="number"
            min={0}
            value={form.bollard_count ?? ""}
            onChange={(v) => setField("bollard_count", v === "" ? null : Number(v))}
          />
          <FormField
            label="Defensas"
            name="fender_count"
            type="number"
            min={0}
            value={form.fender_count ?? ""}
            onChange={(v) => setField("fender_count", v === "" ? null : Number(v))}
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
