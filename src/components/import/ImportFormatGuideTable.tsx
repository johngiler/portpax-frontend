"use client";

import { ChevronDown } from "lucide-react";
import type { ImportFormatGuide } from "@/lib/importFormatGuides";

type ImportFormatGuideToggleProps = {
  open: boolean;
  onToggle: () => void;
  label?: string;
};

export function ImportFormatGuideToggle({
  open,
  onToggle,
  label,
}: ImportFormatGuideToggleProps) {
  const text =
    label ?? (open ? "Ocultar guía de formatos" : "Ver guía de formatos");

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium text-[var(--admin-accent)] transition-colors hover:underline"
    >
      {text}
      <ChevronDown
        className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        aria-hidden
      />
    </button>
  );
}

type ImportFormatGuideTableProps = {
  guide: ImportFormatGuide;
  className?: string;
};

export default function ImportFormatGuideTable({
  guide,
  className = "",
}: ImportFormatGuideTableProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/60 dark:bg-zinc-900/50 ${className}`}
    >
      <div className="border-b border-[var(--admin-border)] bg-white/70 px-3 py-2 dark:bg-zinc-900/80">
        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
          {guide.title}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {guide.summary}
        </p>
      </div>
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-[var(--admin-border)] bg-white/50 dark:bg-zinc-900/60">
            <th className="whitespace-nowrap px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
              Campo
            </th>
            <th className="whitespace-nowrap px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
              Req.
            </th>
            <th className="whitespace-nowrap px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
              Formato
            </th>
            <th className="px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
              Notas / normalización
            </th>
          </tr>
        </thead>
        <tbody>
          {guide.rows.map((row) => (
            <tr
              key={row.field}
              className="border-b border-[var(--admin-border)]/70 last:border-0"
            >
              <td className="whitespace-nowrap px-3 py-2 align-top font-semibold text-[var(--admin-accent)]">
                {row.field}
              </td>
              <td className="whitespace-nowrap px-3 py-2 align-top font-medium text-zinc-700 dark:text-zinc-200">
                {row.required ? "Sí" : "No"}
              </td>
              <td className="whitespace-nowrap px-3 py-2 align-top text-zinc-800 dark:text-zinc-100">
                {row.accepted}
              </td>
              <td className="px-3 py-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
                {row.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {guide.footer ? (
        <p className="border-t border-[var(--admin-border)]/70 px-3 py-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {guide.footer}
        </p>
      ) : null}
    </div>
  );
}
