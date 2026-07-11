"use client";

import { ClipboardList } from "lucide-react";
import Link from "next/link";

type DashboardReservasCardProps = {
  total: number;
  requested: number;
  confirmed: number;
  cancelled: number;
  yearsLabel: string;
};

export default function DashboardReservasCard({
  total,
  requested,
  confirmed,
  cancelled,
  yearsLabel,
}: DashboardReservasCardProps) {
  const cancelPct = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  return (
    <Link href="/bookings" className="block no-underline">
      <div
        className="relative flex min-h-[130px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-zinc-200/80 p-5 shadow-[var(--admin-card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800"
        style={{
          borderTopWidth: "3px",
          borderTopColor: "#3478b5",
          background:
            "linear-gradient(160deg, rgba(52, 120, 181, 0.14) 0%, var(--background) 55%)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Reservas
            </p>
            <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
              {total}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              {total > 0
                ? `${yearsLabel} · ${cancelPct}% canceladas`
                : `Sin reservas en ${yearsLabel}`}
            </p>
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#3478b518" }}
            aria-hidden
          >
            <ClipboardList className="h-5 w-5 text-[#3478b5]" strokeWidth={2} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-zinc-200/70 pt-3 dark:border-zinc-700/70">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600/90 dark:text-amber-400">
              Solicitadas
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {requested}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--admin-accent)]">
              Confirmadas
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {confirmed}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-red-600/90 dark:text-red-400">
              Canceladas
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {cancelled}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
