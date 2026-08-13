"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatIsoAsDmy, parseDmyToIso } from "@/lib/bookingDates";

type IsoDateInputProps = {
  /** ISO YYYY-MM-DD (or empty). */
  value: string;
  onChange: (iso: string) => void;
  id?: string;
  name?: string;
  className?: string;
  /** Visual density — filter sidebar / FormField compact / FormField default. */
  size?: "compact" | "default" | "filter";
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  onBlur?: () => void;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

const SIZE_CLASS = {
  compact:
    "rounded-md border bg-gradient-to-b from-white to-[var(--admin-surface-muted)] px-3 py-2 pr-9 text-xs shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] dark:from-zinc-900 dark:to-zinc-800",
  default:
    "rounded-md border bg-gradient-to-b from-white to-[var(--admin-surface-muted)] px-4 py-2.5 pr-11 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] dark:from-zinc-900 dark:to-zinc-800",
  filter:
    "rounded-lg border bg-white px-2.5 py-1.5 pr-9 text-xs dark:bg-zinc-800",
} as const;

export default function IsoDateInput({
  value,
  onChange,
  id,
  name,
  className = "",
  size = "filter",
  disabled = false,
  required = false,
  error = false,
  onBlur,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: IsoDateInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const nativeRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => (value ? formatIsoAsDmy(value) : ""));

  useEffect(() => {
    setText(value ? formatIsoAsDmy(value) : "");
  }, [value]);

  function commitText(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      onChange("");
      setText("");
      return;
    }
    const iso = parseDmyToIso(trimmed);
    if (iso) {
      onChange(iso);
      setText(formatIsoAsDmy(iso));
      return;
    }
    setText(value ? formatIsoAsDmy(value) : "");
  }

  function openPicker() {
    const el = nativeRef.current;
    if (!el || disabled) return;
    try {
      el.showPicker();
    } catch {
      el.click();
    }
  }

  const sizeClass = SIZE_CLASS[size];

  return (
    <div className={`relative ${className}`}>
      <input
        id={inputId}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        disabled={disabled}
        required={required}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          commitText(text);
          onBlur?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitText(text);
          }
        }}
        className={`w-full tabular-nums text-zinc-900 transition-all placeholder-zinc-400 focus:from-white focus:to-white focus:outline-none focus:ring-2 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:from-zinc-900 dark:focus:to-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 ${sizeClass} ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
            : "border-[var(--admin-border)] focus:border-[var(--admin-accent)] focus:ring-[var(--admin-accent)]/20 dark:border-zinc-700/70"
        }`}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={openPicker}
        className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-zinc-200"
        aria-label="Abrir calendario"
        title="Abrir calendario"
      >
        <CalendarDays className="h-3.5 w-3.5" aria-hidden />
      </button>
      <input
        ref={nativeRef}
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />
    </div>
  );
}
