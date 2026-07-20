"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import CatalogLogoField from "@/components/ui/CatalogLogoField";
import FormSection from "@/components/ui/FormSection";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { submitModalForm } from "@/lib/apiFormErrors";
import {
  formatPortBollardOptionLabel,
  formatPortFenderOptionLabel,
} from "@/lib/inventoryLabels";
import {
  buildPositionCode,
  formatPositionStoredCode,
  normalizePositionShortCode,
  positionDisplayCode,
} from "@/lib/positionCode";
import { deriveCombinedDefaults } from "@/lib/positionCombination";
import { fetchBerths } from "@/services/catalogs/berthService";
import { fetchPortBollards } from "@/services/catalogs/portBollardService";
import { fetchPortFenders } from "@/services/catalogs/portFenderService";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchPositions } from "@/services/catalogs/positionService";
import type {
  Position,
  PositionDetail,
  PositionPayload,
  PositionType,
} from "@/types/catalog";
import {
  POSITION_TYPE_OPTIONS,
  formatMeters,
  portDisplayName,
  positionTypeLabel,
} from "@/types/catalog";
import CombinedPositionFields from "./CombinedPositionFields";
import PositionInventoryRows, {
  allocationsFromBollardRows,
  allocationsFromFenderRows,
  rowsFromAllocations,
  type InventoryRow,
} from "./PositionInventoryRows";

export type PositionFormMode = "create" | "edit";

export type PositionFormSubmitPayload = {
  payload: PositionPayload;
  imageFile?: File | null;
  removeImage?: boolean;
};

type PositionFormModalProps = {
  open: boolean;
  mode: PositionFormMode;
  lockedPortId?: number;
  lockedPortCode?: string;
  initial?: Position | PositionDetail | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: PositionFormSubmitPayload) => Promise<void>;
};

function initialCoverUrl(initial?: Position | PositionDetail | null): string | null {
  if (!initial || !("cover_image" in initial)) return null;
  return initial.cover_image ?? null;
}

type FormState = PositionPayload;

type FieldErrors = Partial<Record<keyof FormState, string>> & {
  component?: string;
  bollard_allocations?: string;
  fender_allocations?: string;
};

function emptyForm(portId = 0): FormState {
  return {
    port: portId,
    berth: null,
    code: "",
    position_type: "pier",
    max_loa_m: null,
    min_draft_m: null,
    bollard_allocations: [],
    fender_allocations: [],
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
    bollard_allocations: position.bollard_allocations ?? [],
    fender_allocations: position.fender_allocations ?? [],
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
  lockedPortCode,
  initial,
  saving,
  onClose,
  onSubmit,
}: PositionFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm(lockedPortId ?? 0));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [berthOptions, setBerthOptions] = useState<{ value: number; label: string }[]>([]);
  const [portOptions, setPortOptions] = useState<
    { value: number; label: string; logoUrl?: string | null }[]
  >([]);
  const [portCodesById, setPortCodesById] = useState<Record<number, string>>({});
  const [isCombined, setIsCombined] = useState(false);
  const [componentAId, setComponentAId] = useState(0);
  const [componentBId, setComponentBId] = useState(0);
  const [basePositions, setBasePositions] = useState<Position[]>([]);
  const [loadingBasePositions, setLoadingBasePositions] = useState(false);
  const [bollardOptions, setBollardOptions] = useState<{ value: number; label: string }[]>([]);
  const [fenderOptions, setFenderOptions] = useState<{ value: number; label: string }[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [bollardRows, setBollardRows] = useState<InventoryRow[]>([]);
  const [fenderRows, setFenderRows] = useState<InventoryRow[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const defaultPort = lockedPortId ?? initial?.port ?? 0;
    setForm(initial ? positionToForm(initial) : emptyForm(defaultPort));
    setBollardRows(
      rowsFromAllocations(initial?.bollard_allocations ?? [], "port_bollard"),
    );
    setFenderRows(
      rowsFromAllocations(initial?.fender_allocations ?? [], "port_fender"),
    );
    setErrors({});
    setSubmitError(null);
    setImageFile(null);
    setRemoveImage(false);
    setImagePreview(initialCoverUrl(initial));
    setIsCombined(Boolean(initial?.is_combined));
    setComponentAId(initial?.component_positions[0]?.id ?? 0);
    setComponentBId(initial?.component_positions[1]?.id ?? 0);
    fetchPorts({ pageSize: 100 })
      .then((data) => {
        setPortOptions(
          data.results.map((p) => ({
            value: p.id,
            label: portDisplayName(p),
            logoUrl: p.logo,
          })),
        );
        setPortCodesById(Object.fromEntries(data.results.map((p) => [p.id, p.code])));
      })
      .catch(() => {
        setPortOptions([]);
        setPortCodesById({});
      });
  }, [open, initial, lockedPortId]);

  useEffect(() => {
    if (!open) return;
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    if (removeImage) {
      setImagePreview(null);
      return;
    }
    setImagePreview(initialCoverUrl(initial));
  }, [open, imageFile, removeImage, initial]);

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
          bollards.map((item) => ({
            value: item.id,
            label: formatPortBollardOptionLabel(item),
          })),
        );
        setFenderOptions(
          fenders.map((item) => ({
            value: item.id,
            label: formatPortFenderOptionLabel(item),
          })),
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
        next.bollard_allocations = [];
        next.fender_allocations = [];
      }
      if (key === "port") {
        next.berth = null;
        next.bollard_allocations = [];
        next.fender_allocations = [];
      }
      return next;
    });
    if (key === "position_type" && value === "anchorage") {
      setBollardRows([]);
      setFenderRows([]);
    }
    if (key === "port") {
      setBollardRows([]);
      setFenderRows([]);
    }
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
      setForm((prev) => ({
        ...prev,
        position_type: "pier",
        berth: null,
        code: "",
        bollard_allocations: [],
        fender_allocations: [],
      }));
      setBollardRows([]);
      setFenderRows([]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form, isCombined, componentAId, componentBId);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const bollardAllocations = allocationsFromBollardRows(bollardRows);
    const fenderAllocations = allocationsFromFenderRows(fenderRows);

    const payload: PositionPayload = {
      ...form,
      port: lockedPortId ?? form.port,
      code: normalizePositionShortCode(form.code),
      notes: form.notes.trim(),
      berth: form.position_type === "anchorage" ? null : form.berth,
      bollard_allocations:
        form.position_type === "anchorage" || isCombined ? [] : bollardAllocations,
      fender_allocations:
        form.position_type === "anchorage" || isCombined ? [] : fenderAllocations,
    };

    if (isCombined) {
      payload.position_type = "pier";
      payload.component_position_ids = [componentAId, componentBId];
    } else if (mode === "edit" && initial?.is_combined) {
      payload.component_position_ids = [];
    }

    await submitModalForm(
      () =>
        onSubmit({
          payload,
          imageFile,
          removeImage,
        }),
      {
        fallback: "No se pudo guardar la posición.",
        setSubmitError,
        setFieldErrors: setErrors,
      },
    );
  }

  const title = mode === "create" ? "Nueva posición" : "Editar posición";
  const portCode =
    lockedPortCode ??
    initial?.port_code ??
    portCodesById[form.port] ??
    (lockedPortId ? portCodesById[lockedPortId] : undefined) ??
    "";
  const shortCode = form.code.trim();
  const rawDisplayCode = !shortCode
    ? ""
    : portCode
      ? buildPositionCode(portCode, shortCode)
      : mode === "edit" && initial?.code
        ? initial.code
        : shortCode;
  const displayName = !rawDisplayCode
    ? "Posición sin código"
    : formatPositionStoredCode(rawDisplayCode);
  const baseOptions = basePositions.map((p) => ({
    value: p.id,
    label: `${positionDisplayCode(p)}${p.max_loa_m ? ` · ${p.max_loa_m} m` : ""}`,
  }));

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
            <DefaultButton type="submit" form="position-form" disabled={saving}>
              {saving ? "Guardando…" : mode === "create" ? "Crear posición" : "Guardar cambios"}
            </DefaultButton>
          </div>
        </div>
      }
    >
      <form id="position-form" onSubmit={handleSubmit}>
        <ModalFormError message={submitError} />
        <div className="grid gap-5 lg:grid-cols-[minmax(220px,260px)_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
            <div className="rounded-xl border border-zinc-200/80 bg-gradient-to-b from-[var(--admin-accent)]/5 to-white p-4 dark:border-zinc-800 dark:from-[var(--admin-accent)]/10 dark:to-zinc-900">
              <CatalogLogoField
                compact
                label="Imagen de la posición"
                deleteLabel="la imagen de la posición"
                previewUrl={imagePreview}
                disabled={saving}
                onFileChange={(file) => {
                  setImageFile(file);
                  setRemoveImage(false);
                }}
                onRemove={() => {
                  setImageFile(null);
                  setRemoveImage(true);
                }}
                canRemove={Boolean(imagePreview)}
              />
              <div className="mt-4 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {displayName}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-[var(--admin-accent)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--admin-accent)]">
                    {positionTypeLabel(form.position_type)}
                  </span>
                  {form.is_active ? (
                    <span className="inline-flex rounded-full bg-[var(--admin-accent)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--admin-accent)]">
                      Activa
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      Inactiva
                    </span>
                  )}
                  {isCombined && (
                    <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                      Combinada
                    </span>
                  )}
                  {form.max_loa_m ? (
                    <span className="inline-flex rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      LOA {formatMeters(form.max_loa_m)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
              <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <span className="font-medium">Posición activa</span>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setField("is_active", e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
                />
              </label>
            </div>
          </aside>

          <div className="space-y-4">
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
                  showLogo
                  logoKind="port"
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
              columns={1}
            >
              <div className="grid gap-x-4 sm:grid-cols-2">
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
              </div>
              {!isCombined && form.position_type !== "anchorage" && form.port > 0 && (
                <div className="mt-4 flex flex-col gap-6 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
                  <PositionInventoryRows
                    label="Bitas"
                    rows={bollardRows}
                    options={bollardOptions}
                    selectPlaceholder={
                      loadingInventory ? "Cargando inventario…" : "Tipo de bita…"
                    }
                    disabled={loadingInventory || saving}
                    error={errors.bollard_allocations}
                    onChange={setBollardRows}
                  />
                  <PositionInventoryRows
                    label="Defensas"
                    rows={fenderRows}
                    options={fenderOptions}
                    selectPlaceholder={
                      loadingInventory ? "Cargando inventario…" : "Tipo de defensa…"
                    }
                    disabled={loadingInventory || saving}
                    error={errors.fender_allocations}
                    onChange={setFenderRows}
                  />
                </div>
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
          </div>
        </div>
      </form>
    </Modal>
  );
}
