"use client";

import type { ReactNode } from "react";

type PaxCapacityMeterProps = {
  /** Omit when a parent table/header already names the metric. */
  label?: string;
  /** Optional control next to the label (e.g. info guide). */
  labelEnd?: ReactNode;
  /** Left figure (promedio or PAX real). */
  value: number | null | undefined;
  /** Right figure (cap. máx. or planificado). */
  total: number | null | undefined;
  /** Ratio value/total (0–100+). Computed if omitted. */
  percent?: number | null;
  /** Optional line under the chip (detail view). */
  hint?: string | null;
  /** Edit the left figure in-place (PAX real). */
  editable?: boolean;
  editText?: string;
  onEditChange?: (value: string) => void;
  editDisabled?: boolean;
  editName?: string;
  compact?: boolean;
  className?: string;
};

function formatNum(n: number | null | undefined): string {
  return n != null ? n.toLocaleString("es-MX") : "—";
}

/**
 * Unified PAX metric chip: % · value / total + hairline track.
 */
export default function PaxCapacityMeter({
  label,
  labelEnd,
  value,
  total,
  percent,
  hint = null,
  editable = false,
  editText = "",
  onEditChange,
  editDisabled = false,
  editName,
  compact = false,
  className = "",
}: PaxCapacityMeterProps) {
  const numericEdit =
    editable && editText.trim() !== "" ? Number(editText) : null;
  const leftValue =
    editable && numericEdit != null && Number.isFinite(numericEdit)
      ? numericEdit
      : value;

  const pctRaw =
    percent != null
      ? percent
      : leftValue != null && total != null && total > 0
        ? Math.round((leftValue / total) * 100)
        : null;
  const trackPct =
    pctRaw != null ? Math.min(100, Math.max(0, pctRaw)) : null;
  const over = pctRaw != null && pctRaw > 100;
  const title = [
    leftValue != null ? formatNum(leftValue) : null,
    total != null ? formatNum(total) : null,
    pctRaw != null ? `${pctRaw}%` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const textSize = compact ? "text-xs" : "text-sm";

  return (
    <div className={className}>
      {label ? (
        labelEnd ? (
          <div
            className={
              compact
                ? "mb-1 flex items-center justify-between gap-2"
                : "mb-1.5 flex items-center justify-between gap-2"
            }
          >
            <span
              className={
                compact
                  ? "text-xs font-medium text-zinc-700 dark:text-zinc-200"
                  : "text-sm font-medium text-zinc-700 dark:text-zinc-200"
              }
            >
              {label}
            </span>
            {labelEnd}
          </div>
        ) : (
          <span
            className={
              compact
                ? "mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-200"
                : "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200"
            }
          >
            {label}
          </span>
        )
      ) : null}
      <div
        className={[
          "relative overflow-hidden rounded-md border border-[var(--admin-border)] bg-gradient-to-b from-white to-[var(--admin-surface-muted)] shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] dark:border-zinc-700/70 dark:from-zinc-900 dark:to-zinc-800",
          compact ? "min-h-[2.125rem]" : "min-h-[2.625rem]",
          editable && !editDisabled
            ? "focus-within:border-[var(--admin-accent)] focus-within:ring-2 focus-within:ring-[var(--admin-accent)]/20"
            : "",
        ].join(" ")}
        title={title || undefined}
      >
        <div
          className={[
            "flex items-baseline justify-between gap-2",
            compact ? "px-3 pb-2.5 pt-1.5" : "px-4 pb-3 pt-2",
          ].join(" ")}
        >
          {pctRaw != null ? (
            <span
              className={[
                "shrink-0 tabular-nums tracking-tight font-semibold",
                textSize,
                over
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-[var(--admin-accent)]",
              ].join(" ")}
            >
              {pctRaw}%
            </span>
          ) : (
            <span className={`shrink-0 font-semibold tabular-nums text-zinc-300 ${textSize}`}>
              —%
            </span>
          )}
          <p
            className={[
              "flex min-w-0 flex-1 items-baseline justify-end gap-1 tabular-nums tracking-tight",
              textSize,
            ].join(" ")}
          >
            {editable ? (
              <input
                type="number"
                min={0}
                name={editName}
                value={editText}
                disabled={editDisabled}
                onChange={(e) => onEditChange?.(e.target.value)}
                placeholder="—"
                className={[
                  "w-[5.5rem] border-0 bg-transparent p-0 text-right font-semibold tabular-nums text-zinc-900 outline-none placeholder:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-50 dark:placeholder:text-zinc-600",
                  textSize,
                  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                ].join(" ")}
              />
            ) : (
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {formatNum(value)}
              </span>
            )}
            <span className="font-normal text-zinc-300 dark:text-zinc-600">
              /
            </span>
            <span className="font-medium text-zinc-400 dark:text-zinc-500">
              {formatNum(total)}
            </span>
          </p>
        </div>
        {trackPct != null ? (
          <div
            className="absolute inset-x-0 bottom-0 h-[3px] bg-zinc-200/90 dark:bg-zinc-700/80"
            aria-hidden
          >
            <div
              className={[
                "h-full transition-[width] duration-500 ease-out",
                over
                  ? "bg-amber-500 dark:bg-amber-400"
                  : "bg-[var(--admin-accent)]",
              ].join(" ")}
              style={{ width: `${trackPct}%` }}
            />
          </div>
        ) : null}
      </div>
      {hint ? (
        <p className="mt-0.5 text-xs leading-tight text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
