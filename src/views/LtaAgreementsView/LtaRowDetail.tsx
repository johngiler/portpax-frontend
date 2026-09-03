"use client";

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
  onOpenExceptions?: () => void;
};

function DetailSection({
  title,
  description,
  columns = 2,
  children,
}: {
  title: string;
  description?: React.ReactNode;
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
          typeof description === "string" ? (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          ) : (
            <div className="mt-1.5 min-w-0">{description}</div>
          )
        ) : null}
      </div>
      <div
        className={
          columns === 2
            ? "grid gap-x-4 gap-y-3 sm:grid-cols-2"
            : "grid grid-cols-1 gap-y-3"
        }
      >
        {children}
      </div>
    </section>
  );
}

function OverviewField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">
        {children}
      </div>
    </div>
  );
}

function formatDateShort(value: string | null): string {
  if (!value) return "—";
  return formatIsoDateLabel(value, "short");
}

export default function LtaRowDetail({
  agreement,
  active,
  canWrite = false,
  generateBusy = false,
  onGenerate,
  onRegenerate,
  onOpenExceptions,
}: LtaRowDetailProps) {
  const vesselsLabel = agreement.all_vessels
    ? "Todos los barcos de la naviera"
    : agreement.vessel_names.length
      ? agreement.vessel_names.join(", ")
      : "—";

  const positionsLabel = agreement.position_codes.length
    ? agreement.position_codes.join(", ")
    : "Todo el puerto";

  const policyLabel =
    LTA_BOOKING_POLICY_OPTIONS.find((o) => o.value === agreement.booking_policy)
      ?.label ?? agreement.booking_policy;

  const depth = Math.max(1, Number(agreement.lta_depth_blocks) || 1);
  const validityLabel = `${formatDateShort(agreement.valid_from)} → ${formatDateShort(agreement.valid_until)}`;
  const cadenceLabel =
    agreement.interval_days != null ? `Cada ${agreement.interval_days} d` : "—";
  const anchorLabel = agreement.cadence_anchor
    ? formatDateShort(agreement.cadence_anchor)
    : "Sin ancla";

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

      <section className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950/30">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Resumen del acuerdo
        </h3>

        <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <OverviewField label="Fecha ancla">{anchorLabel}</OverviewField>
          <OverviewField label="Vigencia">{validityLabel}</OverviewField>
          <OverviewField label="Política de ventana">{policyLabel}</OverviewField>
          <OverviewField label="Profundidad LTA">
            {depth} {depth === 1 ? "bloque" : "bloques"}
          </OverviewField>
          <OverviewField label="Puerto">
            {agreement.port_name}
            <span className="mt-0.5 block text-xs font-normal text-zinc-500">
              {agreement.port_code}
            </span>
          </OverviewField>
          <OverviewField label="Naviera">
            {agreement.shipping_line_name}
            <span className="mt-0.5 block text-xs font-normal text-zinc-500">
              {agreement.shipping_line_code}
            </span>
          </OverviewField>
          <OverviewField label="Barcos">{vesselsLabel}</OverviewField>
          <OverviewField label="Posiciones">{positionsLabel}</OverviewField>
          <OverviewField label="Días de la semana">
            {formatLtaWeekdays(agreement.weekdays)}
          </OverviewField>
          <OverviewField label="Cadencia">{cadenceLabel}</OverviewField>
          <OverviewField label="Reserva de slot en zona LTA">
            {agreement.reserve_foreign_slots ? "Sí" : "No"}
          </OverviewField>
          <OverviewField label="Mínimo de PAX">
            {agreement.min_packs != null ? agreement.min_packs : "—"}
          </OverviewField>
          <OverviewField label="Archivo">
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
          </OverviewField>
        </div>

        {agreement.notes ? (
          <div className="mt-5 border-t border-zinc-200/70 pt-5 dark:border-zinc-800">
            <OverviewField label="Notas">
              <span className="whitespace-pre-wrap font-normal text-zinc-700 dark:text-zinc-200">
                {agreement.notes}
              </span>
            </OverviewField>
          </div>
        ) : null}
      </section>

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

      <LtaLinkedBookings
        agreement={agreement}
        active={active}
        canWrite={canWrite}
        generateBusy={generateBusy}
        onGenerate={onGenerate}
        onRegenerate={onRegenerate}
        onOpenExceptions={onOpenExceptions}
      />

      <LtaDetailAuditSection agreementId={agreement.id} active={active} />
    </div>
  );
}
