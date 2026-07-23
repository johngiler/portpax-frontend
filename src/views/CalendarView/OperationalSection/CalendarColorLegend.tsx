"use client";

import InfoTooltip from "@/components/ui/InfoTooltip";
import { CORP_DOT_CLASS, type CorpColorKey } from "../corpColors";
import { TRAFFIC_DOT, TRAFFIC_LABEL } from "./calendarOpsUtils";

const CORP_LEGEND: { key: CorpColorKey; label: string }[] = [
  { key: "rci", label: "RCI" },
  { key: "ncl", label: "NCL" },
  { key: "msc", label: "MSC" },
  { key: "ccl", label: "Carnival" },
  { key: "vv", label: "Virgin" },
  { key: "other", label: "Otras" },
];

type CalendarColorLegendProps = {
  showCorp?: boolean;
  showTraffic?: boolean;
};

/** Compact color key under the calendar (dots + short labels). */
export default function CalendarColorLegend({
  showCorp = true,
  showTraffic = true,
}: CalendarColorLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-100 pb-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
      {showCorp ? (
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {CORP_LEGEND.map(({ key, label }) => (
            <li key={key} className="inline-flex items-center gap-1.5">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${CORP_DOT_CLASS[key]}`}
                aria-hidden
              />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {showCorp && showTraffic ? (
        <span
          className="hidden h-3 w-px bg-zinc-200 sm:block dark:bg-zinc-700"
          aria-hidden
        />
      ) : null}

      {showTraffic ? (
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {(["free", "limited", "full"] as const).map((key) => (
            <li key={key} className="inline-flex items-center gap-1.5">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${TRAFFIC_DOT[key]}`}
                aria-hidden
              />
              <span>{TRAFFIC_LABEL[key]}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <InfoTooltip
        label="Leyenda del calendario"
        content="El color del chip indica la corporación de la naviera. El punto del día resume la ocupación de muelles (verde libre, ámbar parcial, rojo lleno). Hold: anillo ámbar. Cancelada: tachado atenuado."
      />
    </div>
  );
}
