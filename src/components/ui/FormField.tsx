"use client";

import Select, { type StylesConfig } from "react-select";

const labelClass =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200";
const labelCompactClass =
  "mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-200";
const inputClass =
  "w-full rounded-md border border-[var(--admin-border)] bg-gradient-to-b from-white to-[var(--admin-surface-muted)] px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] transition-all focus:border-[var(--admin-accent)] focus:from-white focus:to-white focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 dark:border-zinc-700/70 dark:from-zinc-900 dark:to-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:from-zinc-900 dark:focus:to-zinc-900";
const inputCompactClass =
  "w-full rounded-md border border-[var(--admin-border)] bg-gradient-to-b from-white to-[var(--admin-surface-muted)] px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] transition-all focus:border-[var(--admin-accent)] focus:from-white focus:to-white focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 dark:border-zinc-700/70 dark:from-zinc-900 dark:to-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:from-zinc-900 dark:focus:to-zinc-900";
const inputErrorClass =
  "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-500/25";
const errorClass = "mt-1 text-xs font-medium text-red-600 dark:text-red-400";

const SELECT_FONT = "0.875rem";
const SELECT_FONT_COMPACT = "0.75rem";

export type CatalogSelectOption<T extends string | number> = {
  value: T;
  label: string;
  logoUrl?: string | null;
};

function SelectOptionLabel({
  label,
  logoUrl,
  showLogo,
  compact,
}: {
  label: string;
  logoUrl?: string | null;
  showLogo?: boolean;
  compact?: boolean;
}) {
  if (!showLogo) return <>{label}</>;
  const size = compact ? "h-5 w-5" : "h-6 w-6";
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded border border-zinc-200/80 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800`}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="text-[8px] font-medium text-zinc-400">—</span>
        )}
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}

export function buildCatalogSelectStyles<T extends string | number>(
  error?: boolean,
  compact = false,
): StylesConfig<CatalogSelectOption<T>, false> {
  const fontSize = compact ? SELECT_FONT_COMPACT : SELECT_FONT;
  const minHeight = compact ? "34px" : "42px";

  return {
    control: (base, state) => ({
      ...base,
      minHeight,
      fontSize,
      borderRadius: 6,
      borderColor: error
        ? "#ef4444"
        : state.isFocused
          ? "var(--admin-accent)"
          : "var(--admin-border)",
      background:
        "linear-gradient(to bottom, var(--admin-surface) 0%, var(--admin-surface-muted) 100%)",
      boxShadow: error
        ? "0 0 0 2px color-mix(in srgb, #ef4444 20%, transparent)"
        : state.isFocused
          ? "0 0 0 2px color-mix(in srgb, var(--admin-accent) 20%, transparent)"
          : "inset 0 1px 2px rgba(15,23,42,0.06)",
      "&:hover": {
        borderColor: error
          ? "#ef4444"
          : state.isFocused
            ? "var(--admin-accent)"
            : "var(--admin-border)",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: compact ? "0 10px" : "0 12px",
    }),
    placeholder: (base) => ({
      ...base,
      fontSize,
      color: "rgb(161 161 170)",
    }),
    singleValue: (base) => ({
      ...base,
      fontSize,
      color: "var(--foreground)",
    }),
    input: (base) => ({
      ...base,
      fontSize,
      margin: 0,
      padding: 0,
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: "var(--admin-border)",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: compact ? 6 : 8,
      color: "rgb(113 113 122)",
      "&:hover": { color: "rgb(63 63 70)" },
    }),
    clearIndicator: (base) => ({
      ...base,
      padding: compact ? 6 : 8,
      color: "rgb(113 113 122)",
      "&:hover": { color: "rgb(63 63 70)" },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 8,
      border: "1px solid var(--admin-border)",
      backgroundColor: "var(--admin-surface)",
      boxShadow: "var(--admin-card-shadow-hover)",
      overflow: "hidden",
      zIndex: 60,
      fontSize,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 70,
    }),
    option: (base, state) => ({
      ...base,
      fontSize,
      padding: compact ? "8px 10px" : "10px 12px",
      backgroundColor: state.isFocused
        ? "color-mix(in srgb, var(--admin-accent) 10%, transparent)"
        : state.isSelected
          ? "color-mix(in srgb, var(--admin-accent) 16%, transparent)"
          : "transparent",
      color: "var(--foreground)",
      cursor: "pointer",
      fontWeight: 400,
    }),
  };
}

type FormFieldProps = {
  label: string;
  name: string;
  type?: "text" | "number" | "email" | "date";
  value: string | number | "";
  onChange: (value: any) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  min?: number;
  step?: string;
  disabled?: boolean;
  /** Smaller type scale for FilterSidebar and dense panels. */
  compact?: boolean;
};

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required,
  min,
  step,
  disabled,
  compact = false,
}: FormFieldProps) {
  return (
    <div className={compact ? "mb-3" : "mb-4"}>
      <label htmlFor={name} className={compact ? labelCompactClass : labelClass}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={(e) => {
          const v =
            type === "number"
              ? e.target.value === ""
                ? ""
                : Number(e.target.value)
              : e.target.value;
          onChange(v);
        }}
        placeholder={placeholder}
        className={`${compact ? inputCompactClass : inputClass} ${error ? inputErrorClass : ""}`}
        required={required}
        min={min}
        step={step}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className={errorClass} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormFieldSelect<T extends string | number>({
  label,
  name,
  value,
  onChange,
  options,
  optionLabel,
  emptyValue,
  required,
  error,
  disabled,
  compact = false,
  showLogo = false,
}: {
  label: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: CatalogSelectOption<T>[];
  optionLabel?: string;
  /** Valor cuando se elige la opción vacía (ej. 0 para IDs) */
  emptyValue?: T;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  compact?: boolean;
  /** Render logo thumbnail from option.logoUrl */
  showLogo?: boolean;
}) {
  const handleChange = (selected: CatalogSelectOption<T> | null) => {
    if (!selected) {
      onChange(
        (emptyValue ??
          (optionLabel ? ("" as T) : (options[0]?.value ?? ("" as T)))) as T,
      );
      return;
    }
    onChange(selected.value);
  };

  const selectedOption =
    value === 0 || value === "" || value === undefined || value === null
      ? null
      : (options.find((opt) => opt.value === value) ?? null);

  const styles = buildCatalogSelectStyles<T>(Boolean(error), compact);

  return (
    <div className={compact ? "mb-3" : "mb-4"}>
      <label htmlFor={name} className={compact ? labelCompactClass : labelClass}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <Select<CatalogSelectOption<T>, false>
        inputId={name}
        name={name}
        value={selectedOption}
        options={options}
        onChange={(v) => handleChange(v)}
        styles={styles}
        isClearable={!!optionLabel || emptyValue !== undefined}
        placeholder={optionLabel ?? "Seleccionar..."}
        aria-invalid={!!error}
        isDisabled={disabled}
        formatOptionLabel={(option) => (
          <SelectOptionLabel
            label={option.label}
            logoUrl={option.logoUrl}
            showLogo={showLogo}
            compact={compact}
          />
        )}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
        menuShouldBlockScroll={false}
        blurInputOnSelect
      />
      {error && (
        <p id={`${name}-error`} className={errorClass} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function buildCatalogMultiSelectStyles<T extends string | number>(
  error?: boolean,
  compact = false,
): StylesConfig<CatalogSelectOption<T>, true> {
  const single = buildCatalogSelectStyles<T>(error, compact);
  return {
    ...single,
    valueContainer: (base) => ({
      ...base,
      padding: compact ? "2px 6px" : "2px 8px",
      gap: 4,
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "color-mix(in srgb, var(--admin-accent) 12%, transparent)",
      borderRadius: 6,
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "var(--foreground)",
      fontSize: compact ? SELECT_FONT_COMPACT : "0.8125rem",
      paddingRight: 2,
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "rgb(113 113 122)",
      borderRadius: 4,
      ":hover": {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        color: "#ef4444",
      },
    }),
  } as StylesConfig<CatalogSelectOption<T>, true>;
}

export function FormFieldMultiSelect<T extends string | number>({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled,
  compact = false,
  showLogo = false,
}: {
  label: string;
  name: string;
  value: T[];
  onChange: (value: T[]) => void;
  options: CatalogSelectOption<T>[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  compact?: boolean;
  showLogo?: boolean;
}) {
  const selectedOptions = options.filter((opt) => value.includes(opt.value));
  const styles = buildCatalogMultiSelectStyles<T>(Boolean(error), compact);

  return (
    <div className={compact ? "mb-3" : "mb-4"}>
      <label htmlFor={name} className={compact ? labelCompactClass : labelClass}>
        {label}
      </label>
      <Select<CatalogSelectOption<T>, true>
        inputId={name}
        name={name}
        isMulti
        closeMenuOnSelect={false}
        value={selectedOptions}
        options={options}
        onChange={(selected) => onChange(selected ? selected.map((item) => item.value) : [])}
        styles={styles}
        placeholder={placeholder ?? "Seleccionar…"}
        aria-invalid={!!error}
        isDisabled={disabled}
        formatOptionLabel={(option) => (
          <SelectOptionLabel
            label={option.label}
            logoUrl={option.logoUrl}
            showLogo={showLogo}
            compact={compact}
          />
        )}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
        menuShouldBlockScroll={false}
        blurInputOnSelect={false}
      />
      {error && (
        <p id={`${name}-error`} className={errorClass} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { inputClass, labelClass, errorClass };
