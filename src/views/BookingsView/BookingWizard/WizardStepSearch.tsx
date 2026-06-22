"use client";

import { Search } from "lucide-react";

type WizardStepSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function WizardStepSearch({
  value,
  onChange,
  placeholder = "Buscar…",
}: WizardStepSearchProps) {
  return (
    <div className="relative max-w-md">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        strokeWidth={2}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-200/80 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 shadow-sm transition-colors focus:border-[var(--admin-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
    </div>
  );
}
