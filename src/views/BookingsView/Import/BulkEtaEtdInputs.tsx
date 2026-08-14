"use client";

import { useRef } from "react";
import { fromTimeInputValue } from "@/lib/bookingDisplay";

type BulkEtaEtdInputsProps = {
  eta: string | null | undefined;
  etd: string | null | undefined;
  disabled?: boolean;
  onEtaChange: (value: string | null) => void;
  onEtdChange: (value: string | null) => void;
  onCommit: (next: { eta: string | null; etd: string | null }) => void;
};

/** Pair of time fields; Tab stays inside the pair (does not revalidate mid-tab). */
export default function BulkEtaEtdInputs({
  eta,
  etd,
  disabled = false,
  onEtaChange,
  onEtdChange,
  onCommit,
}: BulkEtaEtdInputsProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const etaRef = useRef(eta);
  const etdRef = useRef(etd);
  etaRef.current = eta;
  etdRef.current = etd;

  function commitPair() {
    onCommit({
      eta: fromTimeInputValue(etaRef.current ?? ""),
      etd: fromTimeInputValue(etdRef.current ?? ""),
    });
  }

  return (
    <div
      ref={boxRef}
      className="flex items-center gap-1"
      onBlur={() => {
        // relatedTarget is often null (Safari). Wait until the next field is focused.
        requestAnimationFrame(() => {
          const active = document.activeElement;
          if (boxRef.current && active && boxRef.current.contains(active)) return;
          commitPair();
        });
      }}
    >
      <input
        type="text"
        inputMode="numeric"
        placeholder="08:00"
        value={(eta ?? "").slice(0, 5)}
        disabled={disabled}
        tabIndex={0}
        onChange={(e) => onEtaChange(e.target.value || null)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitPair();
          }
        }}
        className="w-[4.25rem] rounded-md border border-zinc-200 bg-white px-1 py-1.5 text-center text-xs tabular-nums text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        aria-label="ETA"
      />
      <span className="text-zinc-400" aria-hidden>
        –
      </span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="17:00"
        value={(etd ?? "").slice(0, 5)}
        disabled={disabled}
        tabIndex={0}
        onChange={(e) => onEtdChange(e.target.value || null)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitPair();
          }
        }}
        className="w-[4.25rem] rounded-md border border-zinc-200 bg-white px-1 py-1.5 text-center text-xs tabular-nums text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        aria-label="ETD"
      />
    </div>
  );
}
