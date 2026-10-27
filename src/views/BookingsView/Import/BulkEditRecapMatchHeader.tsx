"use client";

type BulkEditRecapMatchHeaderProps = {
  perfect: number;
  total: number;
  mismatchOnly: boolean;
  disabled?: boolean;
  onMismatchOnlyChange: (next: boolean) => void;
};

export default function BulkEditRecapMatchHeader({
  perfect,
  total,
  mismatchOnly,
  disabled = false,
  onMismatchOnlyChange,
}: BulkEditRecapMatchHeaderProps) {
  const pct = total > 0 ? Math.round((100 * perfect) / total) : 0;
  const allGood = total > 0 && perfect >= total;
  const mismatches = Math.max(0, total - perfect);
  const label = `${perfect.toLocaleString("es")} / ${total.toLocaleString("es")} al 100%`;

  return (
    <div className="w-44 shrink-0 sm:w-52">
      <label className="mb-1 flex cursor-pointer items-center justify-end gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={mismatchOnly}
          disabled={disabled || total === 0}
          onChange={(e) => onMismatchOnlyChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
        />
        Solo inconsistencias
        {mismatches > 0 ? (
          <span className="tabular-nums text-zinc-400">({mismatches})</span>
        ) : null}
      </label>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        title={label}
      >
        <div
          className={`h-full rounded-full ${
            allGood
              ? "bg-emerald-500 dark:bg-emerald-400"
              : "bg-amber-500 dark:bg-amber-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p
        className={`mt-1 text-right text-xs tabular-nums ${
          allGood
            ? "font-semibold text-emerald-600 dark:text-emerald-400"
            : "text-zinc-600 dark:text-zinc-300"
        }`}
      >
        {label}
      </p>
    </div>
  );
}
