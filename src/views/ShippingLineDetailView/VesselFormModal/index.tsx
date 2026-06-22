"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import CatalogLogoField from "@/components/ui/CatalogLogoField";
import Modal from "@/components/ui/Modal";
import { fetchShippingLines } from "@/services/catalogs/shippingLineService";
import type { Vessel, VesselPayload } from "@/types/cruise";
import { vesselStatusLabel } from "@/types/cruise";
import VesselFormFields, { type VesselFormState } from "./VesselFormFields";

export type VesselFormMode = "create" | "edit";

export type VesselFormSubmitPayload = {
  payload: VesselPayload;
  logoFile?: File | null;
  removeLogo?: boolean;
};

type VesselFormModalProps = {
  open: boolean;
  mode: VesselFormMode;
  initial?: Vessel | null;
  lockedShippingLineId?: number;
  lockedShippingLineName?: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: VesselFormSubmitPayload) => Promise<void>;
};

type FieldErrors = Partial<Record<keyof VesselFormState, string>>;

function emptyForm(): VesselFormState {
  return {
    shipping_line: 0,
    name: "",
    vessel_class: "",
    gross_tonnage: null,
    pax_capacity: null,
    crew_capacity: null,
    loa_m: null,
    beam_m: null,
    draft_m: null,
    flag: "",
    year_built: null,
    segment: "",
    size_category: "",
    mooring_line_count: null,
    bollard_count: null,
    bollard_swl_t: null,
    is_active: true,
  };
}

function vesselToForm(vessel: Vessel): VesselFormState {
  return {
    shipping_line: vessel.shipping_line,
    name: vessel.name,
    vessel_class: vessel.vessel_class,
    gross_tonnage: vessel.gross_tonnage != null ? Number(vessel.gross_tonnage) : null,
    pax_capacity: vessel.pax_capacity,
    crew_capacity: vessel.crew_capacity,
    loa_m: vessel.loa_m != null ? Number(vessel.loa_m) : null,
    beam_m: vessel.beam_m != null ? Number(vessel.beam_m) : null,
    draft_m: vessel.draft_m != null ? Number(vessel.draft_m) : null,
    flag: vessel.flag,
    year_built: vessel.year_built,
    segment: vessel.segment,
    size_category: vessel.size_category,
    mooring_line_count: vessel.mooring_line_count,
    bollard_count: vessel.bollard_count,
    bollard_swl_t: vessel.bollard_swl_t != null ? Number(vessel.bollard_swl_t) : null,
    is_active: vessel.is_active,
  };
}

function validate(form: VesselFormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.shipping_line) errors.shipping_line = "Requerido";
  if (!form.name.trim()) errors.name = "Requerido";
  return errors;
}

export default function VesselFormModal({
  open,
  mode,
  initial,
  lockedShippingLineId,
  lockedShippingLineName,
  saving,
  onClose,
  onSubmit,
}: VesselFormModalProps) {
  const [form, setForm] = useState<VesselFormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [lineOptions, setLineOptions] = useState<{ value: number; label: string }[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const base = initial ? vesselToForm(initial) : emptyForm();
    if (lockedShippingLineId) {
      base.shipping_line = lockedShippingLineId;
    }
    setForm(base);
    setErrors({});
    setLogoFile(null);
    setRemoveLogo(false);
    setLogoPreview(initial?.logo ?? null);
    if (lockedShippingLineId) {
      setLineOptions([]);
      return;
    }
    fetchShippingLines({ pageSize: 500 })
      .then((data) =>
        setLineOptions(
          data.results.map((line) => ({
            value: line.id,
            label: line.group_name !== line.name ? `${line.name} (${line.group_name})` : line.name,
          })),
        ),
      )
      .catch(() => setLineOptions([]));
  }, [open, initial, lockedShippingLineId]);

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

  function setField<K extends keyof VesselFormState>(key: K, value: VesselFormState[K]) {
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
    await onSubmit({
      payload: { ...form, name: form.name.trim() },
      logoFile,
      removeLogo,
    });
  }

  const title = mode === "create" ? "Nuevo barco" : "Editar barco";
  const displayName = form.name.trim() || "Barco sin nombre";

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
            <DefaultButton type="submit" form="vessel-form" disabled={saving}>
              {saving ? "Guardando…" : mode === "create" ? "Crear barco" : "Guardar cambios"}
            </DefaultButton>
          </div>
        </div>
      }
    >
      <form id="vessel-form" onSubmit={handleSubmit}>
        <div className="grid gap-5 lg:grid-cols-[minmax(220px,260px)_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
            <div className="rounded-xl border border-zinc-200/80 bg-gradient-to-b from-[var(--admin-accent)]/5 to-white p-4 dark:border-zinc-800 dark:from-[var(--admin-accent)]/10 dark:to-zinc-900">
              <CatalogLogoField
                compact
                label="Imagen del barco"
                deleteLabel="la imagen del barco"
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
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-[var(--admin-accent)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--admin-accent)]">
                    {vesselStatusLabel(form.is_active)}
                  </span>
                  {form.loa_m ? (
                    <span className="inline-flex rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      LOA {form.loa_m} m
                    </span>
                  ) : null}
                  {form.pax_capacity ? (
                    <span className="inline-flex rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      {form.pax_capacity.toLocaleString("es-MX")} pax
                    </span>
                  ) : null}
                </div>
                {lockedShippingLineName ? (
                  <p className="mt-2 truncate text-xs text-zinc-500">{lockedShippingLineName}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
              <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <span className="font-medium">Barco activo</span>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setField("is_active", event.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
                />
              </label>
            </div>
          </aside>

          <VesselFormFields
            form={form}
            errors={errors}
            lineOptions={lineOptions}
            lockedShippingLineId={lockedShippingLineId}
            lockedShippingLineName={lockedShippingLineName}
            onFieldChange={setField}
            hideActiveToggle
          />
        </div>
      </form>
    </Modal>
  );
}
