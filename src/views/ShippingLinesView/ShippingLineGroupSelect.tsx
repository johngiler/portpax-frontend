"use client";

import { useState } from "react";
import CreatableSelect from "react-select/creatable";
import {
  buildCatalogSelectStyles,
  errorClass,
  labelClass,
} from "@/components/ui/FormField";
import { ApiError } from "@/services/apiClient";
import { createShippingLineGroup } from "@/services/catalogs/shippingLineGroupService";

export type ShippingLineGroupOption = { value: number; label: string };

type ShippingLineGroupSelectProps = {
  value: number;
  onChange: (value: number) => void;
  options: ShippingLineGroupOption[];
  onOptionsChange: (options: ShippingLineGroupOption[]) => void;
  error?: string;
  disabled?: boolean;
};

function catalogCodeFromName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "_");
}

export default function ShippingLineGroupSelect({
  value,
  onChange,
  options,
  onOptionsChange,
  error,
  disabled,
}: ShippingLineGroupSelectProps) {
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedOption =
    value > 0 ? (options.find((option) => option.value === value) ?? null) : null;
  const displayError = error ?? createError;
  const styles = buildCatalogSelectStyles<number>(Boolean(displayError));

  async function handleCreate(inputValue: string) {
    const name = inputValue.trim();
    if (!name) return;

    const existing = options.find(
      (option) => option.label.localeCompare(name, "es", { sensitivity: "accent" }) === 0,
    );
    if (existing) {
      onChange(existing.value);
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const group = await createShippingLineGroup({
        name,
        code: catalogCodeFromName(name),
        is_active: true,
      });
      const newOption = { value: group.id, label: group.name };
      onOptionsChange([...options, newOption]);
      onChange(group.id);
    } catch (err) {
      setCreateError(
        err instanceof ApiError ? err.message : "No se pudo crear el grupo corporativo.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mb-4">
      <label htmlFor="group" className={labelClass}>
        Grupo corporativo
        <span className="text-red-500"> *</span>
      </label>
      <CreatableSelect<ShippingLineGroupOption, false>
        inputId="group"
        name="group"
        value={selectedOption}
        options={options}
        onChange={(selected) => {
          setCreateError(null);
          onChange(selected?.value ?? 0);
        }}
        onCreateOption={(inputValue) => void handleCreate(inputValue)}
        formatCreateLabel={(inputValue) => `Crear "${inputValue.trim()}"`}
        isValidNewOption={(inputValue) => inputValue.trim().length > 0}
        styles={styles}
        isClearable
        placeholder="Seleccionar o crear grupo…"
        aria-invalid={!!displayError}
        isDisabled={disabled || creating}
        isLoading={creating}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
        menuShouldBlockScroll={false}
        blurInputOnSelect
      />
      <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        Si no existe, escribe el nombre y elige crear.
      </p>
      {displayError && (
        <p id="group-error" className={errorClass} role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
}
