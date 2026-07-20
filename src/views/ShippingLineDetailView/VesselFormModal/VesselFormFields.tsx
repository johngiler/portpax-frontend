import type { VesselPayload } from "@/types/cruise";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import FormSection from "@/components/ui/FormSection";

export type VesselFormState = VesselPayload;

type VesselFormFieldsProps = {
  form: VesselFormState;
  errors: Partial<Record<keyof VesselFormState, string>>;
  lineOptions: { value: number; label: string; logoUrl?: string | null }[];
  lockedShippingLineId?: number;
  lockedShippingLineName?: string;
  onFieldChange: <K extends keyof VesselFormState>(key: K, value: VesselFormState[K]) => void;
  hideActiveToggle?: boolean;
};

export default function VesselFormFields({
  form,
  errors,
  lineOptions,
  lockedShippingLineId,
  lockedShippingLineName,
  onFieldChange,
  hideActiveToggle = false,
}: VesselFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormSection
        title="Identificación"
        description="Nombre y clasificación del barco en el catálogo."
        columns={1}
      >
        {!lockedShippingLineId ? (
          <FormFieldSelect<number>
            label="Naviera"
            name="shipping_line"
            value={form.shipping_line}
            onChange={(value) => onFieldChange("shipping_line", value)}
            options={lineOptions}
            optionLabel="Seleccionar naviera…"
            emptyValue={0}
            required
            error={errors.shipping_line}
            showLogo
            logoKind="shipping_line"
          />
        ) : lockedShippingLineName ? (
          <div className="mb-4">
            <p className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">Naviera</p>
            <p className="rounded-md border border-[var(--admin-border)] bg-zinc-50/60 px-4 py-2.5 text-sm text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-200">
              {lockedShippingLineName}
            </p>
          </div>
        ) : null}
        <FormField
          label="Nombre del barco"
          name="name"
          value={form.name}
          onChange={(value) => onFieldChange("name", String(value))}
          required
          error={errors.name}
          placeholder="AIDAcosma"
        />
      </FormSection>

      <FormSection
        title="Clasificación"
        description="Segmento, clase y registro del barco."
      >
        <FormField
          label="Clase"
          name="vessel_class"
          value={form.vessel_class}
          onChange={(value) => onFieldChange("vessel_class", String(value))}
          placeholder="Hyperion"
        />
        <FormField
          label="Segmento"
          name="segment"
          value={form.segment}
          onChange={(value) => onFieldChange("segment", String(value))}
          placeholder="Premium"
        />
        <FormField
          label="Tamaño"
          name="size_category"
          value={form.size_category}
          onChange={(value) => onFieldChange("size_category", String(value))}
          placeholder="XL"
        />
        <FormField
          label="Bandera"
          name="flag"
          value={form.flag}
          onChange={(value) => onFieldChange("flag", String(value))}
          placeholder="Alemania"
        />
        <FormField
          label="Año de construcción"
          name="year_built"
          type="number"
          value={form.year_built ?? ""}
          onChange={(value) => onFieldChange("year_built", value === "" ? null : Number(value))}
          placeholder="2022"
        />
      </FormSection>

      <FormSection
        title="Capacidad"
        description="Tonaje y personas a bordo."
      >
        <FormField
          label="GT (tonelaje bruto)"
          name="gross_tonnage"
          type="number"
          step="0.01"
          value={form.gross_tonnage ?? ""}
          onChange={(value) => onFieldChange("gross_tonnage", value === "" ? null : Number(value))}
        />
        <FormField
          label="Pax"
          name="pax_capacity"
          type="number"
          min={0}
          value={form.pax_capacity ?? ""}
          onChange={(value) => onFieldChange("pax_capacity", value === "" ? null : Number(value))}
          placeholder="5226"
        />
        <FormField
          label="Tripulación"
          name="crew_capacity"
          type="number"
          min={0}
          value={form.crew_capacity ?? ""}
          onChange={(value) => onFieldChange("crew_capacity", value === "" ? null : Number(value))}
          placeholder="1500"
        />
      </FormSection>

      <FormSection
        title="Dimensiones"
        description="LOA, manga y calado — usados en validaciones de booking."
      >
        <FormField
          label="Eslora LOA (m)"
          name="loa_m"
          type="number"
          step="0.01"
          value={form.loa_m ?? ""}
          onChange={(value) => onFieldChange("loa_m", value === "" ? null : Number(value))}
          placeholder="337"
        />
        <FormField
          label="Manga (m)"
          name="beam_m"
          type="number"
          step="0.01"
          value={form.beam_m ?? ""}
          onChange={(value) => onFieldChange("beam_m", value === "" ? null : Number(value))}
        />
        <FormField
          label="Calado (m)"
          name="draft_m"
          type="number"
          step="0.01"
          value={form.draft_m ?? ""}
          onChange={(value) => onFieldChange("draft_m", value === "" ? null : Number(value))}
        />
      </FormSection>

      <FormSection
        title="Amarre y bitas"
        description="Datos operativos de amarre en puerto."
      >
        <FormField
          label="Líneas de amarre"
          name="mooring_line_count"
          type="number"
          min={0}
          value={form.mooring_line_count ?? ""}
          onChange={(value) =>
            onFieldChange("mooring_line_count", value === "" ? null : Number(value))
          }
        />
        <FormField
          label="N° de bitas"
          name="bollard_count"
          type="number"
          min={0}
          value={form.bollard_count ?? ""}
          onChange={(value) => onFieldChange("bollard_count", value === "" ? null : Number(value))}
        />
        <FormField
          label="SWL por bita (t)"
          name="bollard_swl_t"
          type="number"
          step="0.01"
          value={form.bollard_swl_t ?? ""}
          onChange={(value) => onFieldChange("bollard_swl_t", value === "" ? null : Number(value))}
        />
      </FormSection>

      {!hideActiveToggle ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => onFieldChange("is_active", event.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
          />
          Barco activo
        </label>
      ) : null}
    </div>
  );
}
