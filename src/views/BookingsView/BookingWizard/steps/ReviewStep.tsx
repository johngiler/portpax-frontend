"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Anchor,
  CalendarDays,
  ChevronDown,
  Hash,
  MapPin,
  Ship,
} from "lucide-react";
import CountryLabel from "@/components/ui/CountryLabel";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import PositionOccupancyHint from "@/components/booking/PositionOccupancyHint";
import PaxCapacityMeter from "@/components/booking/PaxCapacityMeter";
import PaxConceptsGuideButton from "@/components/booking/PaxConceptsGuide";
import ValidationIssuesAlert from "@/components/booking/ValidationIssuesAlert";
import { formatIsoDateLabel, previewBookingCode } from "@/lib/bookingDates";
import { positionOccupancyHint } from "@/lib/positionOccupancyHint";
import { issueSeverity } from "@/lib/bookingConflictSeverity";
import {
  suggestBookingPositions,
  validateBookings,
  fetchPlannedPaxPreview,
  type PlannedPaxPreview,
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
import type { WizardCreateStatus, WizardDateEntry } from "../wizardTypes";

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
  dateEntries: Record<string, WizardDateEntry>;
  onDateEntryChange: (iso: string, patch: Partial<WizardDateEntry>) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
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

type DateRowEditorsProps = {
  iso: string;
  index: number;
  port: Port | null;
  line: ShippingLine | null;
  vessel: Vessel | null;
  entry: WizardDateEntry;
  onChange: (patch: Partial<WizardDateEntry>) => void;
  paxPreview: PlannedPaxPreview | null;
};

/** Dense cell: kill FormField vertical rhythm; header labels live in thead. */
const cellFieldClass = "[&>div]:mb-0 [&_label]:sr-only";

function DateRowEditors({
  iso,
  index,
  port,
  line,
  vessel,
  entry,
  onChange,
  paxPreview,
}: DateRowEditorsProps) {
  const [suggestions, setSuggestions] = useState<PositionSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (!port || !vessel) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoadingSuggestions(true);
    suggestBookingPositions({
      port: port.id,
      vessel: vessel.id,
      call_date: iso,
      eta: entry.eta || null,
      etd: entry.etd || null,
    })
      .then((data) => {
        if (cancelled) return;
        setSuggestions(data.positions);
        if (entry.positionId == null) {
          const recommended =
            data.positions.find((p) => p.recommended) ?? data.positions[0];
          if (recommended) {
            onChange({
              positionId: recommended.id,
              positionLabel: recommended.code,
            });
          }
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSuggestions(false);
      });
    return () => {
      cancelled = true;
    };
    // Seed / refresh on schedule; ignore positionId churn from auto-pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [port, vessel, iso, entry.eta, entry.etd]);

  const positionOptions = suggestions.map((position) => {
    const tags: string[] = [];
    if (position.recommended) tags.push("sugerida");
    if (position.occupied) tags.push("ocupada");
    const suffix = tags.length > 0 ? ` · ${tags.join(", ")}` : "";
    return {
      value: position.id,
      label: `${position.code}${suffix}`,
    };
  });

  if (
    entry.positionId != null &&
    entry.positionLabel &&
    !positionOptions.some((o) => o.value === entry.positionId)
  ) {
    positionOptions.unshift({
      value: entry.positionId,
      label: entry.positionLabel,
    });
  }

  const selectedSuggestion = suggestions.find((p) => p.id === entry.positionId);
  const occupancyHint = positionOccupancyHint(selectedSuggestion);
  const codePreview =
    port && line && vessel
      ? previewBookingCode(port.code, line.code, vessel.name, iso)
      : null;
  const showHint = Boolean(
    occupancyHint ||
      (selectedSuggestion?.occupied && selectedSuggestion.occupant),
  );

  function handlePositionChange(nextId: number) {
    if (nextId <= 0) {
      onChange({ positionId: null, positionLabel: "" });
      return;
    }
    const match = suggestions.find((p) => p.id === nextId);
    onChange({
      positionId: nextId,
      positionLabel: match?.code ?? (entry.positionLabel || String(nextId)),
    });
  }

  return (
    <>
      <tr className="border-t border-zinc-200/80 align-middle dark:border-zinc-800">
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent)]/10 text-[11px] font-bold tabular-nums text-[var(--admin-accent)]">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {formatIsoDateLabel(iso)}
              </p>
              {codePreview ? (
                <p
                  className="mt-0.5 truncate text-[10px] font-medium text-zinc-400"
                  title={codePreview}
                >
                  {codePreview}
                </p>
              ) : null}
            </div>
          </div>
        </td>
        <td className={`w-[5.5rem] px-1.5 py-2 ${cellFieldClass}`}>
          <FormField
            label="ETA"
            name={`wizard_eta_${iso}`}
            type="time"
            value={entry.eta}
            onChange={(v) => onChange({ eta: String(v) })}
            compact
          />
        </td>
        <td className={`w-[5.5rem] px-1.5 py-2 ${cellFieldClass}`}>
          <FormField
            label="ETD"
            name={`wizard_etd_${iso}`}
            type="time"
            value={entry.etd}
            onChange={(v) => onChange({ etd: String(v) })}
            compact
          />
        </td>
        <td className={`w-[13rem] min-w-[13rem] px-1.5 py-2 ${cellFieldClass}`}>
          <PaxCapacityMeter
            value={paxPreview?.planned_pax ?? null}
            total={
              paxPreview?.capacity ?? vessel?.pax_capacity ?? null
            }
            percent={paxPreview?.pct_of_capacity ?? null}
            compact
          />
        </td>
        <td className={`min-w-[9.5rem] px-1.5 py-2 ${cellFieldClass}`}>
          <FormFieldSelect<number>
            label="Posición"
            name={`wizard_position_${iso}`}
            value={entry.positionId ?? 0}
            onChange={handlePositionChange}
            options={positionOptions}
            optionLabel={
              loadingSuggestions ? "Cargando…" : "Auto"
            }
            emptyValue={0}
            compact
            disabled={loadingSuggestions}
          />
        </td>
        <td className={`min-w-[10.5rem] px-1.5 py-2 pr-3 ${cellFieldClass}`}>
          <FormFieldSelect<WizardCreateStatus>
            label="Estado"
            name={`wizard_status_${iso}`}
            value={entry.status}
            required
            options={CREATE_STATUS_OPTIONS}
            onChange={(status) => onChange({ status })}
            compact
          />
        </td>
      </tr>
      {showHint ? (
        <tr className="bg-zinc-50/50 dark:bg-zinc-950/30">
          <td colSpan={6} className="px-3 pb-2.5 pt-0">
            <PositionOccupancyHint
              message={occupancyHint}
              occupant={
                selectedSuggestion?.occupied
                  ? selectedSuggestion.occupant
                  : null
              }
              positionCode={selectedSuggestion?.code ?? entry.positionLabel}
              callDate={iso}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}

export default function ReviewStep({
  port,
  line,
  vessel,
  callDates,
  dateEntries,
  onDateEntryChange,
  notes,
  onNotesChange,
  onBlockingChange,
}: ReviewStepProps) {
  const [validation, setValidation] = useState<BookingValidationResult | null>(
    null,
  );
  const [paxPreview, setPaxPreview] = useState<PlannedPaxPreview | null>(null);

  useEffect(() => {
    if (!vessel) {
      setPaxPreview(null);
      return;
    }
    let cancelled = false;
    fetchPlannedPaxPreview({ vessel: vessel.id })
      .then((data) => {
        if (!cancelled) setPaxPreview(data);
      })
      .catch(() => {
        if (!cancelled) {
          setPaxPreview({
            planned_pax: vessel.pax_capacity,
            capacity: vessel.pax_capacity,
            sample_count: 0,
            source: vessel.pax_capacity != null ? "capacity" : "none",
            pct_of_capacity: vessel.pax_capacity != null ? 100 : null,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [vessel]);

  useEffect(() => {
    if (!port || !vessel || callDates.length === 0) {
      setValidation(null);
      onBlockingChange?.(true);
      return;
    }
    onBlockingChange?.(true);
    let cancelled = false;

    Promise.all(
      callDates.map((iso) => {
        const entry = dateEntries[iso];
        return validateBookings({
          port: port.id,
          vessel: vessel.id,
          call_dates: [iso],
          position: entry?.positionId ?? null,
          eta: entry?.eta || null,
          etd: entry?.etd || null,
        });
      }),
    )
      .then((results) => {
        if (cancelled) return;
        const mergedWarnings: BookingValidationIssue[] = [];
        const mergedErrors: BookingValidationIssue[] = [];
        const byDate: BookingValidationResult["by_date"] = {};
        results.forEach((result, index) => {
          const iso = callDates[index];
          const split = splitOperationalIssues(result);
          mergedWarnings.push(...split.warnings);
          mergedErrors.push(...split.errors);
          byDate[iso] = {
            valid: true,
            errors: split.errors,
            warnings: split.warnings,
          };
        });
        setValidation({
          valid: true,
          errors: mergedErrors,
          warnings: mergedWarnings,
          by_date: byDate,
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
  }, [port, vessel, callDates, dateEntries, onBlockingChange]);

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
            Detalle por escala
          </h3>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-700">
          <table className="w-full min-w-[56rem] border-collapse text-left">
            <thead>
              <tr className="bg-zinc-50/90 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-950/50">
                <th className="px-3 py-2.5 font-semibold">Fecha</th>
                <th className="px-1.5 py-2.5 font-semibold">ETA</th>
                <th className="px-1.5 py-2.5 font-semibold">ETD</th>
                <th className="w-[13rem] min-w-[13rem] px-1.5 py-2.5 font-semibold">
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    Prom. PAX / Cap. máx.
                    <PaxConceptsGuideButton />
                  </span>
                </th>
                <th className="px-1.5 py-2.5 font-semibold">Posición</th>
                <th className="px-1.5 py-2.5 pr-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {callDates.map((iso, index) => {
                const entry = dateEntries[iso];
                if (!entry) return null;
                return (
                  <DateRowEditors
                    key={iso}
                    iso={iso}
                    index={index}
                    port={port}
                    line={line}
                    vessel={vessel}
                    entry={entry}
                    paxPreview={paxPreview}
                    onChange={(patch) => onDateEntryChange(iso, patch)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4 border-t border-zinc-200/80 bg-zinc-50/40 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/30">
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
