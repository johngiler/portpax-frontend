"use client";

import type { BookingAuditEntry } from "@/types/booking";

type BookingAuditSectionProps = {
  entries: BookingAuditEntry[];
};

export default function BookingAuditSection({ entries }: BookingAuditSectionProps) {
  if (entries.length === 0) return null;

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Historial</h2>
      <ul className="mt-4 space-y-3">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="rounded-xl border border-zinc-200/80 px-4 py-3 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {entry.summary}
              </p>
              <time className="text-xs text-zinc-400">
                {new Date(entry.created_at).toLocaleString("es-MX")}
              </time>
            </div>
            {entry.user_display ? (
              <p className="mt-1 text-xs text-zinc-500">{entry.user_display}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
