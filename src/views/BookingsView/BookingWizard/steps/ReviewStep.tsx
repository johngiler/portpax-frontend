"use client";

import { formatIsoDateLabel, previewBookingCode } from "@/lib/bookingDates";
import type { Port } from "@/types/catalog";
import type { ShippingLine, Vessel } from "@/types/cruise";

type ReviewStepProps = {
  port: Port | null;
  line: ShippingLine | null;
  vessel: Vessel | null;
  callDates: string[];
  notes: string;
  onNotesChange: (notes: string) => void;
};

export default function ReviewStep({
  port,
  line,
  vessel,
  callDates,
  notes,
  onNotesChange,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Resumen</h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Puerto</dt>
            <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {port?.name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Naviera</dt>
            <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {line?.name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Barco</dt>
            <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {vessel?.name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Fechas</dt>
            <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {callDates.length} escala{callDates.length === 1 ? "" : "s"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-[var(--admin-accent)]/5 to-white p-5 dark:border-zinc-800 dark:from-[var(--admin-accent)]/10 dark:to-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Códigos de reserva (preview)
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Cada fecha genera su propio código: puerto · naviera · barco · fecha
        </p>
        <ul className="mt-4 space-y-2">
          {callDates.map((iso) => (
            <li
              key={iso}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950/50"
            >
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                {formatIsoDateLabel(iso)}
              </span>
              <code className="text-xs font-semibold text-[var(--admin-accent)]">
                {port && line && vessel
                  ? previewBookingCode(port.code, line.code, vessel.name, iso)
                  : iso}
              </code>
            </li>
          ))}
        </ul>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Notas (opcional)
        </span>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Comentarios internos para el paquete de reservas…"
          className="w-full rounded-xl border border-[var(--admin-border)] bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm focus:border-[var(--admin-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>
    </div>
  );
}
