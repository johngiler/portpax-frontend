"use client";

import DefaultButton from "@/components/buttons/DefaultButton";
import LtaBookingWindowPanel from "@/components/lta/LtaBookingWindowPanel";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import {
  LTA_BOOKING_POLICY_OPTIONS,
  formatLtaWeekdays,
  type LongTermAgreement,
} from "@/types/lta";
import LtaDetailAuditSection from "./LtaDetailAuditSection";
import LtaLinkedBookings from "./LtaLinkedBookings";

type LtaRowDetailProps = {
  agreement: LongTermAgreement;
  active: boolean;
  canWrite?: boolean;
  generateBusy?: boolean;
  onGenerate?: () => void;
  onRegenerate?: () => void;
};

function DetailSection({
  title,
  description,
  columns = 2,
  children,
}: {
  title: string;
  description?: string;
  columns?: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950/30">
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
        {description ? (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>
      <div
        className={
          columns === 2 ? "grid gap-x-4 gap-y-3 sm:grid-cols-2" : "grid grid-cols-1 gap-y-3"
        }
      >
        {children}
      </div>
    </section>
  );
}

function DetailField({
  label,
  children,
  span = 1,
}: {
  label: string;
  children: React.ReactNode;
  span?: 1 | 2;
}) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : undefined}>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-100">
        {children}
      </div>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return formatIsoDateLabel(value, "long");
}

export default function LtaRowDetail({
  agreement,
  active,
  canWrite = false,
  generateBusy = false,
  onGenerate,
  onRegenerate,
}: LtaRowDetailProps) {
  const vesselsLabel = agreement.all_vessels
    ? "Todos los barcos de la naviera"
    : agreement.vessel_names.length
      ? agreement.vessel_names.join(", ")
      : "—";
  const hasGenerated = Boolean(agreement.bookings_generated);

  const positionsLabel = agreement.position_codes.length
    ? agreement.position_codes.join(", ")
    : "Todo el puerto";

  const policyLabel =
    LTA_BOOKING_POLICY_OPTIONS.find((o) => o.value === agreement.booking_policy)?.label ??
    agreement.booking_policy;

  return (
    <div className="w-full space-y-4 rounded-2xl border border-[var(--admin-accent)]/15 bg-gradient-to-br from-white via-white to-[var(--admin-accent)]/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:from-zinc-900 dark:via-zinc-900 dark:to-[var(--admin-accent)]/[0.08] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {agreement.code}
          </p>
          <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-300">
            {agreement.name}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            agreement.is_active
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300"
          }`}
        >
          {agreement.is_active ? "Activo" : "Inactivo"}
        </span>
      </div>

      <DetailSection title="Puerto y naviera" description="Alcance geográfico y titular del acuerdo.">
        <DetailField label="Puerto">
          {agreement.port_name}
          <span className="mt-0.5 block text-xs font-normal text-zinc-500">
            {agreement.port_code}
          </span>
        </DetailField>
        <DetailField label="Naviera">
          {agreement.shipping_line_name}
          <span className="mt-0.5 block text-xs font-normal text-zinc-500">
            {agreement.shipping_line_code}
          </span>
        </DetailField>
      </DetailSection>

      <DetailSection
        title="Slots operativos"
        description="Barcos, posiciones y días cubiertos por el contrato."
        columns={1}
      >
        <DetailField label="Barcos">{vesselsLabel}</DetailField>
        <DetailField label="Posiciones">{positionsLabel}</DetailField>
        <DetailField label="Días de la semana">
          {formatLtaWeekdays(agreement.weekdays)}
        </DetailField>
      </DetailSection>

      <DetailSection title="Cadencia" description="Ritmo de escalas acordado.">
        <DetailField label="Cadencia (días)">
          {agreement.interval_days != null ? agreement.interval_days : "—"}
        </DetailField>
        <DetailField label="Fecha ancla">
          {agreement.cadence_anchor ? formatDate(agreement.cadence_anchor) : "—"}
        </DetailField>
      </DetailSection>

      <DetailSection
        title="Política y vigencia"
        description="Ventana LTA del acuerdo (bloques: 2 actual + 3 open + zona LTA)."
      >
        <DetailField label="Política de ventana">{policyLabel}</DetailField>
        <DetailField label="Profundidad LTA (bloques)">
          {agreement.lta_depth_blocks}
        </DetailField>
        <DetailField label="Vigente desde">{formatDate(agreement.valid_from)}</DetailField>
        <DetailField label="Vigente hasta">{formatDate(agreement.valid_until)}</DetailField>
        <DetailField label="Reserva de slot en zona LTA" span={2}>
          {agreement.reserve_foreign_slots ? "Sí" : "No"}
        </DetailField>
      </DetailSection>

      <DetailSection
        title="Mapa de bloques"
        description="Posición del acuerdo según vigencia y política (referencia: hoy)."
        columns={1}
      >
        <LtaBookingWindowPanel
          validFrom={agreement.valid_from}
          validUntil={agreement.valid_until}
          bookingPolicy={agreement.booking_policy}
          ltaDepthBlocks={agreement.lta_depth_blocks}
        />
      </DetailSection>

      {canWrite ? (
        <DetailSection
          title="Reservas del acuerdo"
          description="Genera escalas LTA en la zona del contrato (primer barco × cada posición)."
          columns={1}
        >
          <div className="flex flex-wrap gap-3">
            {!hasGenerated ? (
              <DefaultButton
                type="button"
                disabled={generateBusy || !onGenerate}
                onClick={onGenerate}
              >
                {generateBusy ? "En cola…" : "Generar"}
              </DefaultButton>
            ) : (
              <DefaultButton
                type="button"
                disabled={generateBusy || !onRegenerate}
                onClick={onRegenerate}
              >
                {generateBusy ? "En cola…" : "Regenerar"}
              </DefaultButton>
            )}
          </div>
        </DetailSection>
      ) : null}

      <DetailSection title="Contrato" description="Compromiso comercial y adjunto." columns={1}>
        <DetailField label="Mínimo de PAX">
          {agreement.min_packs != null ? agreement.min_packs : "—"}
        </DetailField>
        <DetailField label="Archivo">
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
        </DetailField>
        {agreement.notes ? (
          <DetailField label="Notas">
            <span className="whitespace-pre-wrap font-normal">{agreement.notes}</span>
          </DetailField>
        ) : null}
      </DetailSection>

      <LtaLinkedBookings agreementId={agreement.id} active={active} />

      <LtaDetailAuditSection agreementId={agreement.id} active={active} />
    </div>
  );
}
