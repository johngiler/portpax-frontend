"use client";

import AsyncCreatableSelect from "react-select/async-creatable";
import {
  buildCatalogSelectStyles,
  type CatalogSelectOption,
} from "@/components/ui/FormField";
import { suggestBookingTags } from "@/services/bookings/bookingTagService";

type BookingTagFieldProps = {
  label?: string;
  name?: string;
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
};

export default function BookingTagField({
  label = "Tag",
  name = "booking_tag",
  value,
  onChange,
  disabled = false,
  compact = false,
  className = "",
}: BookingTagFieldProps) {
  const styles = buildCatalogSelectStyles<string>(false, compact);
  const selected: CatalogSelectOption<string> | null = value.trim()
    ? { value: value.trim(), label: value.trim() }
    : null;

  return (
    <div className={compact ? `mb-0 ${className}` : `mb-3 ${className}`}>
      {label.trim() ? (
        <label
          htmlFor={name}
          className={
            compact
              ? "mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-200"
              : "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200"
          }
        >
          {label}
        </label>
      ) : null}
      <AsyncCreatableSelect<CatalogSelectOption<string>, false>
        inputId={name}
        name={name}
        value={selected}
        isClearable
        isDisabled={disabled}
        isSearchable
        cacheOptions
        defaultOptions
        placeholder="Opcional · buscar o crear…"
        noOptionsMessage={() => "Escribe para crear un tag"}
        loadingMessage={() => "Buscando…"}
        formatCreateLabel={(input) => `Crear «${input.trim()}»`}
        styles={styles}
        loadOptions={async (inputValue) => {
          const remote = await suggestBookingTags(inputValue);
          return remote.map((t) => ({ value: t.name, label: t.name }));
        }}
        onChange={(opt) => onChange(opt?.value?.trim() || "")}
        onCreateOption={(input) => onChange(input.trim())}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
      />
    </div>
  );
}
