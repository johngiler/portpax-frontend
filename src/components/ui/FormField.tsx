"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import Select, { type StylesConfig } from "react-select";
import CatalogLogoThumb, {
  type CatalogLogoKind,
} from "@/components/ui/CatalogLogoThumb";

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
  logoKind,
  compact,
}: {
  label: string;
  logoUrl?: string | null;
  showLogo?: boolean;
  logoKind?: CatalogLogoKind;
  compact?: boolean;
}) {
  if (!showLogo) return <>{label}</>;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <CatalogLogoThumb
        src={logoUrl}
        alt=""
        size={compact ? "xs" : "sm"}
        kind={logoKind}
      />
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
  type?: "text" | "number" | "email" | "date" | "password";
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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && passwordVisible ? "text" : type;

  return (
    <div className={compact ? "mb-3" : "mb-4"}>
      <label htmlFor={name} className={compact ? labelCompactClass : labelClass}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
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
          className={`${compact ? inputCompactClass : inputClass} ${isPassword ? "pr-11" : ""} ${error ? inputErrorClass : ""}`}
          required={required}
          min={min}
          step={step}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          autoComplete={isPassword ? "new-password" : undefined}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setPasswordVisible((v) => !v)}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-zinc-200"
            aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
            disabled={disabled}
          >
            {passwordVisible ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        )}
      </div>
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
  logoKind,
  labelEnd,
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
  /** Placeholder icon when logo is missing (port / shipping_line / vessel). */
  logoKind?: CatalogLogoKind;
  /** Optional control aligned to the right of the label (e.g. help link). */
  labelEnd?: ReactNode;
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
      {labelEnd ? (
        <div
          className={`flex items-center justify-between gap-2 ${
            compact ? "mb-1" : "mb-1.5"
          }`}
        >
          <label
            htmlFor={name}
            className={
              compact
                ? "text-xs font-medium text-zinc-700 dark:text-zinc-200"
                : "text-sm font-medium text-zinc-700 dark:text-zinc-200"
            }
          >
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
          {labelEnd}
        </div>
      ) : (
        <label htmlFor={name} className={compact ? labelCompactClass : labelClass}>
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
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
            logoKind={logoKind}
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
  logoKind,
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
  logoKind?: CatalogLogoKind;
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
            logoKind={logoKind}
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
