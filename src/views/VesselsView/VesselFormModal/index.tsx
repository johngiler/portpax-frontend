"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import Modal from "@/components/ui/Modal";
import { fetchShippingLines } from "@/services/catalogs/shippingLineService";
import type { Vessel, VesselPayload } from "@/types/cruise";
import VesselFormFields, { type VesselFormState } from "./VesselFormFields";

export type VesselFormMode = "create" | "edit";

type VesselFormModalProps = {
  open: boolean;
  mode: VesselFormMode;
  initial?: Vessel | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: VesselPayload) => Promise<void>;
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
  saving,
  onClose,
  onSubmit,
}: VesselFormModalProps) {
  const [form, setForm] = useState<VesselFormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [lineOptions, setLineOptions] = useState<{ value: number; label: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? vesselToForm(initial) : emptyForm());
    setErrors({});
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
  }, [open, initial]);

  function setField<K extends keyof VesselFormState>(key: K, value: VesselFormState[K]) {
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
    await onSubmit({ ...form, name: form.name.trim() });
  }

  const title = mode === "create" ? "Nuevo barco" : "Editar barco";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-3xl"
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
          <DefaultButton type="submit" form="vessel-form" disabled={saving}>
            {saving ? "Guardando…" : mode === "create" ? "Crear" : "Guardar"}
          </DefaultButton>
        </div>
      }
    >
      <form id="vessel-form" onSubmit={handleSubmit}>
        <VesselFormFields
          form={form}
          errors={errors}
          lineOptions={lineOptions}
          onFieldChange={setField}
        />
      </form>
    </Modal>
  );
}
