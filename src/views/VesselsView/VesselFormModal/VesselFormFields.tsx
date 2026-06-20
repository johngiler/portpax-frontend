import type { VesselPayload } from "@/types/cruise";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";

export type VesselFormState = VesselPayload;

type VesselFormFieldsProps = {
  form: VesselFormState;
  errors: Partial<Record<keyof VesselFormState, string>>;
  lineOptions: { value: number; label: string }[];
  onFieldChange: <K extends keyof VesselFormState>(key: K, value: VesselFormState[K]) => void;
};

export default function VesselFormFields({
  form,
  errors,
  lineOptions,
  onFieldChange,
}: VesselFormFieldsProps) {
  return (
    <>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <FormFieldSelect<number>
          label="Naviera"
          name="shipping_line"
          value={form.shipping_line}
          onChange={(v) => onFieldChange("shipping_line", v)}
          options={lineOptions}
          optionLabel="Seleccionar naviera…"
          emptyValue={0}
          required
          error={errors.shipping_line}
        />
        <FormField
          label="Nombre del barco"
          name="name"
          value={form.name}
          onChange={(v) => onFieldChange("name", String(v))}
          required
          error={errors.name}
        />
        <FormField
          label="Clase"
          name="vessel_class"
          value={form.vessel_class}
          onChange={(v) => onFieldChange("vessel_class", String(v))}
        />
        <FormField
          label="Segmento"
          name="segment"
          value={form.segment}
          onChange={(v) => onFieldChange("segment", String(v))}
        />
        <FormField
          label="Tamaño"
          name="size_category"
          value={form.size_category}
          onChange={(v) => onFieldChange("size_category", String(v))}
        />
        <FormField
          label="Bandera"
          name="flag"
          value={form.flag}
          onChange={(v) => onFieldChange("flag", String(v))}
        />
        <FormField
          label="Año"
          name="year_built"
          type="number"
          value={form.year_built ?? ""}
          onChange={(v) => onFieldChange("year_built", v === "" ? null : Number(v))}
        />
        <FormField
          label="GT"
          name="gross_tonnage"
          type="number"
          step="0.01"
          value={form.gross_tonnage ?? ""}
          onChange={(v) => onFieldChange("gross_tonnage", v === "" ? null : Number(v))}
        />
        <FormField
          label="Pax"
          name="pax_capacity"
          type="number"
          min={0}
          value={form.pax_capacity ?? ""}
          onChange={(v) => onFieldChange("pax_capacity", v === "" ? null : Number(v))}
        />
        <FormField
          label="Tripulación"
          name="crew_capacity"
          type="number"
          min={0}
          value={form.crew_capacity ?? ""}
          onChange={(v) => onFieldChange("crew_capacity", v === "" ? null : Number(v))}
        />
        <FormField
          label="Eslora LOA (m)"
          name="loa_m"
          type="number"
          step="0.01"
          value={form.loa_m ?? ""}
          onChange={(v) => onFieldChange("loa_m", v === "" ? null : Number(v))}
        />
        <FormField
          label="Manga (m)"
          name="beam_m"
          type="number"
          step="0.01"
          value={form.beam_m ?? ""}
          onChange={(v) => onFieldChange("beam_m", v === "" ? null : Number(v))}
        />
        <FormField
          label="Calado (m)"
          name="draft_m"
          type="number"
          step="0.01"
          value={form.draft_m ?? ""}
          onChange={(v) => onFieldChange("draft_m", v === "" ? null : Number(v))}
        />
        <FormField
          label="Líneas de amarre"
          name="mooring_line_count"
          type="number"
          min={0}
          value={form.mooring_line_count ?? ""}
          onChange={(v) => onFieldChange("mooring_line_count", v === "" ? null : Number(v))}
        />
        <FormField
          label="N° de bitas"
          name="bollard_count"
          type="number"
          min={0}
          value={form.bollard_count ?? ""}
          onChange={(v) => onFieldChange("bollard_count", v === "" ? null : Number(v))}
        />
        <FormField
          label="SWL por bita (t)"
          name="bollard_swl_t"
          type="number"
          step="0.01"
          value={form.bollard_swl_t ?? ""}
          onChange={(v) => onFieldChange("bollard_swl_t", v === "" ? null : Number(v))}
        />
      </div>
      <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => onFieldChange("is_active", e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
        />
        Activo
      </label>
    </>
  );
}
