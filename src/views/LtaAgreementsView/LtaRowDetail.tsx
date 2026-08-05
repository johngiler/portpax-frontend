"use client";

import {
  Anchor,
  CalendarRange,
  FileText,
  MapPin,
  Package,
  Ship,
  StickyNote,
} from "lucide-react";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { LongTermAgreement } from "@/types/lta";
import { formatLtaWeekdays } from "@/types/lta";
import LtaLinkedBookings from "./LtaLinkedBookings";

type LtaRowDetailProps = {
  agreement: LongTermAgreement;
  active: boolean;
};

function MetaCard({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof FileText;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200/70 bg-white/90 p-3.5 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/70">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        {label}
      </div>
      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{children}</div>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return formatIsoDateLabel(value, "long");
}

export default function LtaRowDetail({ agreement, active }: LtaRowDetailProps) {
  const vesselsLabel = agreement.all_vessels
    ? "Todos los barcos de la naviera"
    : agreement.vessel_names.length
      ? agreement.vessel_names.join(", ")
      : "—";

  const positionsLabel = agreement.position_codes.length
    ? agreement.position_codes.join(", ")
    : "Todo el puerto";

  return (
    <div className="w-full rounded-2xl border border-[var(--admin-accent)]/15 bg-gradient-to-br from-white via-white to-[var(--admin-accent)]/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:from-zinc-900 dark:via-zinc-900 dark:to-[var(--admin-accent)]/[0.08] sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {agreement.code}
          </p>
          <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
            {agreement.name}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            agreement.is_active
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300"
          }`}
        >
          {agreement.is_active ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetaCard icon={MapPin} label="Puerto">
          {agreement.port_name}
          <span className="mt-0.5 block text-xs font-normal text-zinc-500">
            {agreement.port_code}
          </span>
        </MetaCard>
        <MetaCard icon={Anchor} label="Naviera">
          {agreement.shipping_line_name}
          <span className="mt-0.5 block text-xs font-normal text-zinc-500">
            {agreement.shipping_line_code}
          </span>
        </MetaCard>
        <MetaCard icon={Ship} label="Barcos">
          {vesselsLabel}
        </MetaCard>
        <MetaCard icon={MapPin} label="Posiciones">
          {positionsLabel}
        </MetaCard>
        <MetaCard icon={CalendarRange} label="Días de la semana">
          {formatLtaWeekdays(agreement.weekdays)}
        </MetaCard>
        <MetaCard icon={CalendarRange} label="Cadencia">
          {agreement.interval_days != null && agreement.cadence_anchor
            ? `Cada ${agreement.interval_days} días desde ${formatDate(agreement.cadence_anchor)}`
            : "Sin ritmo fijo"}
        </MetaCard>
        <MetaCard icon={CalendarRange} label="Ventana (ref. meses)">
          {agreement.advance_months_min}–{agreement.advance_months_max} meses
        </MetaCard>
        <MetaCard icon={CalendarRange} label="Vigencia">
          {formatDate(agreement.valid_from)} → {formatDate(agreement.valid_until)}
        </MetaCard>
        <MetaCard icon={Package} label="Packs mínimos">
          {agreement.min_packs != null ? agreement.min_packs : "—"}
        </MetaCard>
        <MetaCard icon={FileText} label="Contrato">
          {agreement.contract_file_url ? (
            <a
              href={agreement.contract_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--admin-accent)] hover:underline"
            >
              {agreement.contract_file_name || "Ver contrato"}
            </a>
          ) : (
            <span className="font-normal text-zinc-400">Sin archivo</span>
          )}
        </MetaCard>
        {agreement.notes ? (
          <MetaCard icon={StickyNote} label="Notas">
            <span className="whitespace-pre-wrap font-normal">{agreement.notes}</span>
          </MetaCard>
        ) : null}
      </div>

      <LtaLinkedBookings agreementId={agreement.id} active={active} />
    </div>
  );
}
