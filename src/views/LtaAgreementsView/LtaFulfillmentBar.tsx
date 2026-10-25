"use client";

type Props = {
  confirmed: number;
  pending: number;
  compact?: boolean;
};

export default function LtaFulfillmentBar({
  confirmed,
  pending,
  compact = false,
}: Props) {
  const total = Math.max(0, confirmed) + Math.max(0, pending);
  const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  const label = `${confirmed.toLocaleString("es")} / ${total.toLocaleString("es")}`;

  return (
    <div className={compact ? "min-w-0" : "min-w-[7.5rem]"}>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Cumplimiento ${label}`}
        title={`${confirmed.toLocaleString("es")} confirmadas · ${pending.toLocaleString("es")} LTA`}
      >
        <div
          className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p
        className={[
          "mt-1 tabular-nums text-zinc-600 dark:text-zinc-300",
          compact ? "text-[10px]" : "text-xs",
        ].join(" ")}
      >
        {label}
      </p>
    </div>
  );
}
