"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Anchor,
  CalendarDays,
  ChevronDown,
  Clock3,
  Hash,
  LayoutGrid,
  MapPin,
  Ship,
} from "lucide-react";
import CountryLabel from "@/components/ui/CountryLabel";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import { FormFieldSelect } from "@/components/ui/FormField";
import ValidationIssuesAlert from "@/components/booking/ValidationIssuesAlert";
import { formatIsoDateLabel, previewBookingCode } from "@/lib/bookingDates";
import { formatTimeShort } from "@/lib/bookingDisplay";
import {
  previewAssignedPositions,
  validateBookings,
} from "@/services/bookings/bookingService";
import type {
  BookingValidationIssue,
  BookingValidationResult,
  PositionSuggestion,
} from "@/types/booking";
import { BOOKING_STATUS_LABELS } from "@/types/booking";
import type { Port } from "@/types/catalog";
import { portDisplayName } from "@/types/catalog";
import type { ShippingLine, Vessel } from "@/types/cruise";
import { issueSeverity } from "@/lib/bookingConflictSeverity";
import type { WizardCreateStatus } from "../wizardTypes";

/** Align with backend `LTA_SOFT_FAIL_CODES` — do not hard-block create. */
const LTA_SOFT_FAIL_CODES = new Set([
  "lta_beyond_horizon",
  "lta_horizon_denied",
  "lta_policy_denied",
]);

/** Operational conflicts are non-blocking; always allow create. */
function splitOperationalIssues(result: BookingValidationResult): {
  errors: BookingValidationIssue[];
  warnings: BookingValidationIssue[];
  blocked: boolean;
} {
  const soft: BookingValidationIssue[] = [];
  for (const issue of result.errors) {
    const severity = issueSeverity(issue);
    if (LTA_SOFT_FAIL_CODES.has(issue.code)) {
      soft.push({
        ...issue,
        level: "warning",
        severity,
        message: issue.message,
      });
    } else {
      soft.push({
        ...issue,
        level: "warning",
        severity,
      });
    }
  }
  return {
    errors: [],
    warnings: [...result.warnings, ...soft],
    blocked: false,
  };
}

const CREATE_STATUS_OPTIONS: { value: WizardCreateStatus; label: string }[] = [
  { value: "h", label: BOOKING_STATUS_LABELS.h },
  { value: "co", label: BOOKING_STATUS_LABELS.co },
  { value: "cl", label: BOOKING_STATUS_LABELS.cl },
  { value: "lta", label: BOOKING_STATUS_LABELS.lta },
  { value: "ltd", label: BOOKING_STATUS_LABELS.ltd },
];

type ReviewStepProps = {
  port: Port | null;
  line: ShippingLine | null;
  vessel: Vessel | null;
  callDates: string[];
  notes: string;
  onNotesChange: (notes: string) => void;
  status: WizardCreateStatus;
  onStatusChange: (status: WizardCreateStatus) => void;
  eta: string;
  etd: string;
  plannedPax: string;
  preferredPositionId?: number | null;
  preferredPositionLabel?: string;
  /** Reports blocking validation (errors) so Create can be disabled. */
  onBlockingChange?: (blocked: boolean) => void;
};

type SummaryItemProps = {
  icon: typeof MapPin;
  label: string;
  children: ReactNode;
};

function SummaryItem({ icon: Icon, label, children }: SummaryItemProps) {
  return (
    <div className="flex gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ReviewStep({
  port,
  line,
  vessel,
  callDates,
  notes,
  onNotesChange,
  status,
  onStatusChange,
  eta,
  etd,
  plannedPax,
  preferredPositionId = null,
  preferredPositionLabel = "",
  onBlockingChange,
}: ReviewStepProps) {
  const [validation, setValidation] = useState<BookingValidationResult | null>(
    null,
  );
  const [positionsByDate, setPositionsByDate] = useState<
    Record<string, PositionSuggestion | null>
  >({});
  const [loadingPositions, setLoadingPositions] = useState(false);

  useEffect(() => {
    if (!port || !vessel || callDates.length === 0) {
      setValidation(null);
      onBlockingChange?.(true);
      return;
    }
    onBlockingChange?.(true);
    let cancelled = false;
    validateBookings({
      port: port.id,
      vessel: vessel.id,
      call_dates: callDates,
      position: preferredPositionId,
      eta: eta || null,
      etd: etd || null,
    })
      .then((result) => {
        if (cancelled) return;
        const split = splitOperationalIssues(result);
        setValidation({
          ...result,
          valid: true,
          errors: split.errors,
          warnings: split.warnings,
        });
        onBlockingChange?.(false);
      })
      .catch(() => {
        if (cancelled) return;
        setValidation(null);
        onBlockingChange?.(true);
      });
    return () => {
      cancelled = true;
    };
  }, [port, vessel, callDates, eta, etd, preferredPositionId, onBlockingChange]);

  useEffect(() => {
    if (!port || !vessel || callDates.length === 0) {
      setPositionsByDate({});
      return;
    }
    setLoadingPositions(true);
    previewAssignedPositions({
      port: port.id,
      vessel: vessel.id,
      call_dates: callDates,
    })
      .then(setPositionsByDate)
      .catch(() => setPositionsByDate({}))
      .finally(() => setLoadingPositions(false));
  }, [port, vessel, callDates]);

  const displayLabel =
    preferredPositionLabel ||
    (preferredPositionId != null
      ? Object.values(positionsByDate).find((p) => p?.id === preferredPositionId)
          ?.code
      : null) ||
    null;

  const etaEtdLabel =
    eta || etd
      ? `${formatTimeShort(eta || null)}–${formatTimeShort(etd || null)}`
      : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="border-b border-zinc-200/80 bg-gradient-to-r from-[var(--admin-accent)]/12 via-[var(--admin-accent)]/5 to-transparent px-5 py-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--admin-accent)]">
              Paquete de reservas
            </p>
            <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {vessel?.name ?? "Crucero"} en{" "}
              {port ? portDisplayName(port) : "puerto"}
            </p>
          </div>
          <span className="rounded-full bg-[var(--admin-accent)] px-3 py-1 text-sm font-semibold text-white shadow-sm shadow-[var(--admin-accent)]/25">
            {callDates.length} escala{callDates.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryItem icon={MapPin} label="Puerto">
          <div className="flex items-center gap-2">
            <CatalogLogoThumb src={port?.logo} alt="" size="xs" kind="port" />
            <span className="truncate">
              {port ? portDisplayName(port) : "—"}
            </span>
          </div>
          {port ? (
            <CountryLabel
              country={port.country}
              className="mt-1 text-xs font-normal text-zinc-500 dark:text-zinc-400"
            />
          ) : null}
        </SummaryItem>
        <SummaryItem icon={Anchor} label="Naviera">
          <div className="flex items-center gap-2">
            <CatalogLogoThumb
              src={line?.logo}
              alt=""
              size="xs"
              kind="shipping_line"
            />
            <span className="truncate">{line?.name ?? "—"}</span>
          </div>
          {line ? (
            <p className="mt-0.5 truncate text-xs font-normal text-zinc-500">
              {line.code}
            </p>
          ) : null}
        </SummaryItem>
        <SummaryItem icon={Ship} label="Barco">
          <div className="flex items-center gap-2">
            <CatalogLogoThumb
              src={vessel?.logo}
              alt=""
              size="xs"
              kind="vessel"
            />
            <span className="truncate">{vessel?.name ?? "—"}</span>
          </div>
          {vessel?.loa_m ? (
            <p className="mt-0.5 text-xs font-normal text-zinc-500">
              LOA {vessel.loa_m} m
            </p>
          ) : null}
        </SummaryItem>
        <SummaryItem icon={CalendarDays} label="Fechas">
          {callDates.length === 0 ? (
            <span>—</span>
          ) : callDates.length === 1 ? (
            <span className="leading-snug">
              {formatIsoDateLabel(callDates[0], "long")}
            </span>
          ) : (
            <details className="group min-w-0">
              <summary className="flex cursor-pointer list-none items-center gap-1 font-semibold text-zinc-900 marker:content-none dark:text-zinc-50 [&::-webkit-details-marker]:hidden">
                <span>
                  {callDates.length} día{callDates.length === 1 ? "" : "s"}{" "}
                  seleccionado{callDates.length === 1 ? "" : "s"}
                </span>
                <ChevronDown
                  className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition group-open:rotate-180"
                  strokeWidth={2}
                  aria-hidden
                />
              </summary>
              <ul className="mt-2 max-h-44 divide-y divide-zinc-100 overflow-y-auto rounded-xl border border-zinc-200/80 bg-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.35)] ring-1 ring-[var(--admin-accent)]/10 dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40 dark:ring-[var(--admin-accent)]/20">
                {[...callDates]
                  .sort((a, b) => a.localeCompare(b))
                  .map((iso, index) => (
                    <li
                      key={iso}
                      className="flex items-center gap-2.5 px-2.5 py-2 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent)]/10 text-[11px] font-bold tabular-nums text-[var(--admin-accent)]">
                        {index + 1}
                      </span>
                      <span className="min-w-0 text-xs font-semibold leading-snug text-zinc-800 dark:text-zinc-100">
                        {formatIsoDateLabel(iso, "long")}
                      </span>
                    </li>
                  ))}
              </ul>
            </details>
          )}
          {plannedPax ? (
            <p className="mt-1 text-xs font-normal text-zinc-500">
              PAX {plannedPax}
            </p>
          ) : null}
        </SummaryItem>
      </div>

      {validation &&
      (validation.warnings.length > 0 || validation.errors.length > 0) ? (
        <div className="border-t border-zinc-200/80 px-5 py-4 dark:border-zinc-800">
          <ValidationIssuesAlert
            errors={validation.errors}
            warnings={validation.warnings}
          />
        </div>
      ) : null}

      <div className="border-t border-zinc-200/80 px-5 py-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center gap-2">
          <Hash
            className="h-4 w-4 text-[var(--admin-accent)]"
            strokeWidth={2}
          />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Resumen de escalas
          </h3>
        </div>
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
          Fecha, horario, posición y código por escala (puerto · naviera · barco
          · fecha)
        </p>
        <div className="overflow-x-auto overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-700">
          <div className="min-w-[36rem]">
            <div className="grid grid-cols-[minmax(0,1.4fr)_auto_auto_minmax(0,1.2fr)] gap-x-4 border-b border-zinc-200/80 bg-zinc-50/80 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950/50">
              <span>Fecha de escala</span>
              <span>ETA–ETD</span>
              <span>Posición</span>
              <span>Código</span>
            </div>
            <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
              {callDates.map((iso, index) => {
                const assigned = positionsByDate[iso];
                const rowLabel =
                  displayLabel ||
                  (loadingPositions ? null : assigned?.code) ||
                  null;
                return (
                  <li
                    key={iso}
                    className="grid grid-cols-[minmax(0,1.4fr)_auto_auto_minmax(0,1.2fr)] items-center gap-4 px-4 py-3 transition-colors hover:bg-[var(--admin-accent)]/[0.04]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {formatIsoDateLabel(iso)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        Escala {index + 1}
                      </p>
                    </div>
                    <div className="min-w-[5.5rem] text-center">
                      {etaEtdLabel ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-semibold tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                          <Clock3 className="h-3 w-3 shrink-0 opacity-70" />
                          {etaEtdLabel}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-400">
                          —
                        </span>
                      )}
                    </div>
                    <div className="min-w-[4.5rem] text-center">
                      {rowLabel ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          <LayoutGrid className="h-3 w-3" strokeWidth={2} />
                          {rowLabel}
                        </span>
                      ) : loadingPositions ? (
                        <span className="text-xs text-zinc-400">…</span>
                      ) : (
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                          Sin posición
                        </span>
                      )}
                    </div>
                    <code className="truncate rounded-lg bg-[var(--admin-accent)]/8 px-2.5 py-1 text-[11px] font-semibold tracking-tight text-[var(--admin-accent)] sm:text-xs">
                      {port && line && vessel
                        ? previewBookingCode(
                            port.code,
                            line.code,
                            vessel.name,
                            iso,
                          )
                        : iso}
                    </code>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-zinc-200/80 bg-zinc-50/40 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/30">
        <div className="max-w-md">
          <FormFieldSelect<WizardCreateStatus>
            label="Estado"
            name="wizard_status"
            value={status}
            required
            options={CREATE_STATUS_OPTIONS}
            onChange={onStatusChange}
          />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Notas internas (opcional)
          </span>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            placeholder="Comentarios para el equipo de booking…"
            className="w-full rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm transition-colors focus:border-[var(--admin-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
      </div>
    </div>
  );
}
