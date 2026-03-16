"use client";

import Select, { type StylesConfig } from "react-select";

const labelClass =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200";
const inputClass =
  "w-full rounded-md border border-[var(--admin-border)] bg-gradient-to-b from-white to-[var(--admin-surface-muted)] px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] transition-all focus:border-[var(--admin-accent)] focus:from-white focus:to-white focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 dark:border-zinc-700/70 dark:from-zinc-900 dark:to-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:from-zinc-900 dark:focus:to-zinc-900";
const errorClass = "mt-1 text-xs font-medium text-red-600 dark:text-red-400";

type FormFieldProps = {
  label: string;
  name: string;
  type?: "text" | "number" | "email";
  value: string | number | "";
  onChange: (value: any) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  min?: number;
  step?: string;
  disabled?: boolean;
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
}: FormFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className={labelClass}>
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
        className={inputClass}
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
}: {
  label: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  optionLabel?: string;
  /** Valor cuando se elige la opción vacía (ej. 0 para IDs) */
  emptyValue?: T;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}) {
  const handleChange = (selected: { value: T; label: string } | null) => {
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

  const styles: StylesConfig<{ value: T; label: string }, false> = {
    control: (base, state) => ({
      ...base,
      minHeight: "42px",
      borderRadius: 6,
      borderColor: state.isFocused
        ? "var(--admin-accent)"
        : "var(--admin-border)",
      background:
        "linear-gradient(to bottom, var(--admin-surface) 0%, var(--admin-surface-muted) 100%)",
      boxShadow: state.isFocused
        ? "0 0 0 2px color-mix(in srgb, var(--admin-accent) 20%, transparent)"
        : "inset 0 1px 2px rgba(15,23,42,0.06)",
      "&:hover": {
        borderColor: state.isFocused
          ? "var(--admin-accent)"
          : "var(--admin-border)",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 12px",
    }),
    placeholder: (base) => ({
      ...base,
      color: "rgb(161 161 170)",
    }),
    singleValue: (base) => ({
      ...base,
      color: "var(--foreground)",
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: "var(--admin-border)",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "rgb(113 113 122)",
      "&:hover": { color: "rgb(63 63 70)" },
    }),
    clearIndicator: (base) => ({
      ...base,
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
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 70,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? "color-mix(in srgb, var(--admin-accent) 10%, transparent)"
        : state.isSelected
          ? "color-mix(in srgb, var(--admin-accent) 16%, transparent)"
          : "transparent",
      color: "var(--foreground)",
      cursor: "pointer",
    }),
  };

  return (
    <div className="mb-4">
      <label htmlFor={name} className={labelClass}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <Select<{ value: T; label: string }, false>
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
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
      />
      {error && (
        <p id={`${name}-error`} className={errorClass} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { inputClass, labelClass };
