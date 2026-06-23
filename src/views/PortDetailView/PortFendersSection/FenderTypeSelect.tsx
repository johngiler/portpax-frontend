"use client";

import CreatableSelect from "react-select/creatable";
import {
  buildCatalogSelectStyles,
  errorClass,
  labelClass,
} from "@/components/ui/FormField";

export type FenderTypeOption = { value: string; label: string };

type FenderTypeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: FenderTypeOption[];
  error?: string;
  disabled?: boolean;
};

export default function FenderTypeSelect({
  value,
  onChange,
  options,
  error,
  disabled,
}: FenderTypeSelectProps) {
  const selectedOption =
    value.trim().length > 0
      ? (options.find(
          (option) =>
            option.label.localeCompare(value.trim(), "es", { sensitivity: "accent" }) === 0,
        ) ?? { value: value.trim(), label: value.trim() })
      : null;
  const styles = buildCatalogSelectStyles<string>(Boolean(error));

  return (
    <div className="mb-4">
      <label htmlFor="fender_type" className={labelClass}>
        Tipo
        <span className="text-red-500"> *</span>
      </label>
      <CreatableSelect<FenderTypeOption, false>
        inputId="fender_type"
        name="fender_type"
        value={selectedOption}
        options={options}
        onChange={(selected) => onChange(selected?.value ?? "")}
        onCreateOption={(inputValue) => onChange(inputValue.trim())}
        formatCreateLabel={(inputValue) => `Crear "${inputValue.trim()}"`}
        isValidNewOption={(inputValue) => inputValue.trim().length > 0}
        styles={styles}
        isClearable
        placeholder="Seleccionar o crear tipo…"
        aria-invalid={!!error}
        isDisabled={disabled}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
        menuShouldBlockScroll={false}
        blurInputOnSelect
      />
      {error && (
        <p id="fender_type-error" className={errorClass} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
