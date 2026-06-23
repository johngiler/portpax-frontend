"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import FormSection from "@/components/ui/FormSection";
import { FormField, FormFieldMultiSelect, FormFieldSelect } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { submitModalForm } from "@/lib/apiFormErrors";
import {
  formatPortBollardLabel,
  formatPortFenderLabel,
} from "@/lib/inventoryLabels";
import { normalizePositionShortCode, positionDisplayCode } from "@/lib/positionCode";
import { deriveCombinedDefaults } from "@/lib/positionCombination";
import { fetchBerths } from "@/services/catalogs/berthService";
import { fetchPortBollards } from "@/services/catalogs/portBollardService";
import { fetchPortFenders } from "@/services/catalogs/portFenderService";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchPositions } from "@/services/catalogs/positionService";
import type { Position, PositionPayload, PositionType } from "@/types/catalog";
import { POSITION_TYPE_OPTIONS, portDisplayName, positionTypeLabel } from "@/types/catalog";
import CombinedPositionFields from "./CombinedPositionFields";

export type PositionFormMode = "create" | "edit";

type PositionFormModalProps = {
  open: boolean;
  mode: PositionFormMode;
  lockedPortId?: number;
  initial?: Position | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: PositionPayload) => Promise<void>;
};

type FormState = PositionPayload;

type FieldErrors = Partial<Record<keyof FormState, string>> & {
  component?: string;
};

function emptyForm(portId = 0): FormState {
  return {
    port: portId,
    berth: null,
    code: "",
    position_type: "pier",
    max_loa_m: null,
    min_draft_m: null,
    port_bollard_ids: [],
    port_fender_ids: [],
    bollard_count: null,
    fender_count: null,
    notes: "",
    latitude: null,
    longitude: null,
    sort_order: 0,
    is_active: true,
  };
}

function positionToForm(position: Position): FormState {
  return {
    port: position.port,
    berth: position.berth,
    code: positionDisplayCode(position),
    position_type: position.position_type,
    max_loa_m: position.max_loa_m != null ? Number(position.max_loa_m) : null,
    min_draft_m: position.min_draft_m != null ? Number(position.min_draft_m) : null,
    port_bollard_ids: position.port_bollard_ids ?? [],
    port_fender_ids: position.port_fender_ids ?? [],
    bollard_count: position.bollard_count,
    fender_count: position.fender_count,
    notes: position.notes,
    latitude: position.latitude != null ? Number(position.latitude) : null,
    longitude: position.longitude != null ? Number(position.longitude) : null,
    sort_order: position.sort_order,
    is_active: position.is_active,
  };
}

function validate(form: FormState, isCombined: boolean, componentA: number, componentB: number): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.port) errors.port = "Requerido";
  if (!form.code.trim()) errors.code = "Requerido";
  if (isCombined) {
    if (!componentA || !componentB) errors.component = "Selecciona dos posiciones base.";
    else if (componentA === componentB) errors.component = "Las posiciones base deben ser distintas.";
  }
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [berthOptions, setBerthOptions] = useState<{ value: number; label: string }[]>([]);
  const [portOptions, setPortOptions] = useState<{ value: number; label: string }[]>([]);
  const [isCombined, setIsCombined] = useState(false);
  const [componentAId, setComponentAId] = useState(0);
  const [componentBId, setComponentBId] = useState(0);
  const [basePositions, setBasePositions] = useState<Position[]>([]);
  const [loadingBasePositions, setLoadingBasePositions] = useState(false);
  const [bollardOptions, setBollardOptions] = useState<{ value: number; label: string }[]>([]);
  const [fenderOptions, setFenderOptions] = useState<{ value: number; label: string }[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  useEffect(() => {
    if (!open) return;
    const defaultPort = lockedPortId ?? initial?.port ?? 0;
    setForm(initial ? positionToForm(initial) : emptyForm(defaultPort));
    setErrors({});
    setSubmitError(null);
    setIsCombined(Boolean(initial?.is_combined));
    setComponentAId(initial?.component_positions[0]?.id ?? 0);
    setComponentBId(initial?.component_positions[1]?.id ?? 0);
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
    if (!isCombined || !componentAId || !componentBId || componentAId === componentBId) return;
    const first = basePositions.find((p) => p.id === componentAId);
    const second = basePositions.find((p) => p.id === componentBId);
    if (!first || !second) return;

    const defaults = deriveCombinedDefaults(first, second);
    setForm((prev) => ({
      ...prev,
      position_type: "pier",
      code: defaults.code,
      max_loa_m: defaults.max_loa_m,
      min_draft_m: defaults.min_draft_m,
      berth: defaults.berth,
    }));
  }, [isCombined, componentAId, componentBId, basePositions]);

  useEffect(() => {
    if (!open || !form.port) {
      setBerthOptions([]);
      return;
    }
    fetchBerths({ port: form.port, pageSize: 100 })
      .then((data) => setBerthOptions(data.results.map((b) => ({ value: b.id, label: b.code }))))
      .catch(() => setBerthOptions([]));
  }, [open, form.port]);

  useEffect(() => {
    if (!open || !form.port) {
      setBollardOptions([]);
      setFenderOptions([]);
      return;
    }
    setLoadingInventory(true);
    Promise.all([fetchPortBollards(form.port), fetchPortFenders(form.port)])
      .then(([bollards, fenders]) => {
        setBollardOptions(
          bollards.map((item) => ({ value: item.id, label: formatPortBollardLabel(item) })),
        );
        setFenderOptions(
          fenders.map((item) => ({ value: item.id, label: formatPortFenderLabel(item) })),
        );
      })
      .catch(() => {
        setBollardOptions([]);
        setFenderOptions([]);
      })
      .finally(() => setLoadingInventory(false));
  }, [open, form.port]);

  useEffect(() => {
    if (!open || !isCombined || !form.port) {
      setBasePositions([]);
      return;
    }
    setLoadingBasePositions(true);
    fetchPositions({ port: form.port, combinable: true, pageSize: 100 })
      .then((data) => {
        const results = data.results.filter((p) => p.id !== initial?.id);
        setBasePositions(results);
      })
      .catch(() => setBasePositions([]))
      .finally(() => setLoadingBasePositions(false));
  }, [open, isCombined, form.port, initial?.id]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "position_type" && value === "anchorage") {
        next.berth = null;
        next.port_bollard_ids = [];
        next.port_fender_ids = [];
      }
      if (key === "port") {
        next.berth = null;
        next.port_bollard_ids = [];
        next.port_fender_ids = [];
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

  function handleCombinedToggle(next: boolean) {
    setIsCombined(next);
    setComponentAId(0);
    setComponentBId(0);
    if (next) {
      setForm((prev) => ({ ...prev, position_type: "pier", berth: null, code: "" }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form, isCombined, componentAId, componentBId);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: PositionPayload = {
      ...form,
      port: lockedPortId ?? form.port,
      code: normalizePositionShortCode(form.code),
      notes: form.notes.trim(),
      berth: form.position_type === "anchorage" ? null : form.berth,
      port_bollard_ids:
        form.position_type === "anchorage" || isCombined ? [] : form.port_bollard_ids,
      port_fender_ids:
        form.position_type === "anchorage" || isCombined ? [] : form.port_fender_ids,
    };

    if (isCombined) {
      payload.position_type = "pier";
      payload.component_position_ids = [componentAId, componentBId];
    } else if (mode === "edit" && initial?.is_combined) {
      payload.component_position_ids = [];
    }

    await submitModalForm(
      () => onSubmit(payload),
      {
        fallback: "No se pudo guardar la posición.",
        setSubmitError,
        setFieldErrors: setErrors,
      },
    );
  }

  const title = mode === "create" ? "Nueva posición" : "Editar posición";
  const displayName = form.code.trim() || "Posición sin código";
  const baseOptions = basePositions.map((p) => ({
    value: p.id,
    label: `${positionDisplayCode(p)}${p.max_loa_m ? ` · ${p.max_loa_m} m` : ""}`,
  }));

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
            <DefaultButton type="submit" form="position-form" disabled={saving}>
              {saving ? "Guardando…" : mode === "create" ? "Crear posición" : "Guardar cambios"}
            </DefaultButton>
          </div>
        </div>
      }
    >
      <form id="position-form" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <ModalFormError message={submitError} />
          <div className="rounded-xl border border-zinc-200/80 bg-gradient-to-b from-[var(--admin-accent)]/5 to-white p-4 dark:border-zinc-800 dark:from-[var(--admin-accent)]/10 dark:to-zinc-900">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{displayName}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-[var(--admin-accent)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--admin-accent)]">
                {positionTypeLabel(form.position_type)}
              </span>
              {isCombined && (
                <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  Combinada
                </span>
              )}
            </div>
          </div>

          {mode === "create" && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCombinedToggle(false)}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  !isCombined
                    ? "bg-[var(--admin-accent)] text-white"
                    : "border border-[var(--admin-border)] text-zinc-600 hover:bg-[var(--admin-surface-muted)]"
                }`}
              >
                Posición simple
              </button>
              <button
                type="button"
                onClick={() => handleCombinedToggle(true)}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isCombined
                    ? "bg-[var(--admin-accent)] text-white"
                    : "border border-[var(--admin-border)] text-zinc-600 hover:bg-[var(--admin-surface-muted)]"
                }`}
              >
                Posición combinada
              </button>
            </div>
          )}

          <FormSection
            title="Identificación"
            description={
              isCombined
                ? "Posición virtual para barcos que ocupan dos slots de muelle."
                : "Puerto, código y asignación de muelle."
            }
          >
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
            {isCombined && form.port > 0 && (
              <CombinedPositionFields
                componentAId={componentAId}
                componentBId={componentBId}
                options={baseOptions}
                loading={loadingBasePositions}
                disabled={saving}
                error={errors.component}
                onChangeA={setComponentAId}
                onChangeB={setComponentBId}
              />
            )}
            <FormField
              label="Nombre de posición"
              name="code"
              value={form.code}
              onChange={(v) => setField("code", String(v))}
              required
              error={errors.code}
              placeholder={isCombined ? "P1+P2" : "P1"}
            />
            {!isCombined && (
              <>
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
              </>
            )}
          </FormSection>

          <FormSection
            title="Características"
            description="Eslora, calado e inventario operativo de la posición."
          >
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
            {!isCombined && form.position_type !== "anchorage" && form.port > 0 && (
              <>
                <FormFieldMultiSelect<number>
                  label="Bitas"
                  name="port_bollard_ids"
                  value={form.port_bollard_ids}
                  onChange={(v) => setField("port_bollard_ids", v)}
                  options={bollardOptions}
                  placeholder={
                    loadingInventory ? "Cargando inventario…" : "Seleccionar bitas…"
                  }
                  disabled={loadingInventory || saving}
                  error={errors.port_bollard_ids}
                />
                <FormFieldMultiSelect<number>
                  label="Defensas"
                  name="port_fender_ids"
                  value={form.port_fender_ids}
                  onChange={(v) => setField("port_fender_ids", v)}
                  options={fenderOptions}
                  placeholder={
                    loadingInventory ? "Cargando inventario…" : "Seleccionar defensas…"
                  }
                  disabled={loadingInventory || saving}
                  error={errors.port_fender_ids}
                />
              </>
            )}
          </FormSection>

          <FormSection title="Ubicación" description="Coordenadas GPS de la posición.">
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
                ? "La posición aparece en listados y asignaciones."
                : "Oculta para usuarios; conserva su historial."}
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
