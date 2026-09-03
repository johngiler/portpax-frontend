"use client";

import { formatLtaWeekdays, type LongTermAgreement } from "@/types/lta";

type LtaRuleSetChipsProps = {
  agreement: LongTermAgreement;
  /** Override vessel label (e.g. from a linked booking). */
  vesselName?: string | null;
  /** Override position code (e.g. from a linked booking). */
  positionCode?: string | null;
  className?: string;
};

/** Compact rule chips: port · line · weekdays · cadence · position · vessel. */
export default function LtaRuleSetChips({
  agreement,
  vesselName = null,
  positionCode = null,
  className = "",
}: LtaRuleSetChipsProps) {
  const vessel =
    vesselName?.trim() ||
    (agreement.all_vessels
      ? "Todos los barcos"
      : agreement.vessel_names[0] ?? "Sin barco");
  const positions =
    positionCode?.trim() ||
    (agreement.position_codes.length
      ? agreement.position_codes.join(", ")
      : "Todo el puerto");
  const cadence =
    agreement.interval_days != null
      ? `Cada ${agreement.interval_days} d`
      : "Sin cadencia";
  const chips = [
    agreement.port_name || "Sin puerto",
    agreement.shipping_line_name || "Sin naviera",
    formatLtaWeekdays(agreement.weekdays),
    cadence,
    positions,
    vessel,
  ];

  return (
    <ul
      className={[
        "flex min-w-0 flex-nowrap items-center gap-1 overflow-x-auto",
        className,
      ].join(" ")}
    >
      {chips.map((label) => (
        <li
          key={label}
          title={label}
          className="max-w-[4.5rem] shrink-0 truncate rounded-md border border-zinc-200/80 bg-zinc-50 px-1 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
