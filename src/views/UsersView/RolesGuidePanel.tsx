"use client";

import { ChevronDown } from "lucide-react";
import { USER_ROLE_GUIDE } from "@/types/accounts";

type RolesGuideToggleProps = {
  open: boolean;
  onToggle: () => void;
};

export function RolesGuideToggle({ open, onToggle }: RolesGuideToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium text-[var(--admin-accent)] transition-colors hover:underline"
    >
      {open ? "Ocultar roles" : "Ver tabla de roles"}
      <ChevronDown
        className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        aria-hidden
      />
    </button>
  );
}

export default function RolesGuideTable() {
  return (
    <div className="-mt-2 mb-4 overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/60 dark:bg-zinc-900/50">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-[var(--admin-border)] bg-white/70 dark:bg-zinc-900/80">
            <th className="px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
              Rol
            </th>
            <th className="px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
              Permisos
            </th>
          </tr>
        </thead>
        <tbody>
          {USER_ROLE_GUIDE.map((row) => (
            <tr
              key={row.value}
              className="border-b border-[var(--admin-border)]/70 last:border-0"
            >
              <td className="whitespace-nowrap px-3 py-2 align-top font-medium text-zinc-800 dark:text-zinc-100">
                {row.label}
              </td>
              <td className="px-3 py-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
