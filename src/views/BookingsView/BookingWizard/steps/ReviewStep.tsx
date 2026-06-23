"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Anchor,
  CalendarDays,
  Hash,
  LayoutGrid,
  MapPin,
  Ship,
} from "lucide-react";
import CountryLabel from "@/components/ui/CountryLabel";
import ValidationIssuesAlert from "@/components/booking/ValidationIssuesAlert";
import { formatIsoDateLabel, previewBookingCode } from "@/lib/bookingDates";
import { previewAssignedPositions, validateBookings } from "@/services/bookings/bookingService";
import type { BookingValidationResult, PositionSuggestion } from "@/types/booking";
import type { Port } from "@/types/catalog";
import { portDisplayName } from "@/types/catalog";
import type { ShippingLine, Vessel } from "@/types/cruise";

type ReviewStepProps = {
  port: Port | null;
  line: ShippingLine | null;
  vessel: Vessel | null;
  callDates: string[];
  notes: string;
  onNotesChange: (notes: string) => void;
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
}: ReviewStepProps) {
  const [validation, setValidation] = useState<BookingValidationResult | null>(null);
  const [positionsByDate, setPositionsByDate] = useState<
    Record<string, PositionSuggestion | null>
  >({});
  const [loadingPositions, setLoadingPositions] = useState(false);

  useEffect(() => {
    if (!port || !vessel || callDates.length === 0) {
      setValidation(null);
      return;
    }
    validateBookings({
      port: port.id,
      vessel: vessel.id,
      call_dates: callDates,
    })
      .then(setValidation)
      .catch(() => setValidation(null));
  }, [port, vessel, callDates]);

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

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="border-b border-zinc-200/80 bg-gradient-to-r from-[var(--admin-accent)]/12 via-[var(--admin-accent)]/5 to-transparent px-5 py-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--admin-accent)]">
              Paquete de reservas
            </p>
            <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {vessel?.name ?? "Crucero"} en {port ? portDisplayName(port) : "puerto"}
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
            {port?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={port.logo}
                alt=""
                className="h-6 w-6 shrink-0 rounded object-contain"
              />
            ) : null}
            <span className="truncate">{port ? portDisplayName(port) : "—"}</span>
          </div>
          {port ? (
            <CountryLabel
              country={port.country}
              className="mt-1 text-xs font-normal text-zinc-500 dark:text-zinc-400"
            />
          ) : null}
        </SummaryItem>
        <SummaryItem icon={Anchor} label="Naviera">
          <span className="truncate">{line?.name ?? "—"}</span>
          {line ? (
            <p className="mt-0.5 truncate text-xs font-normal text-zinc-500">{line.code}</p>
          ) : null}
        </SummaryItem>
        <SummaryItem icon={Ship} label="Barco">
          <span className="truncate">{vessel?.name ?? "—"}</span>
          {vessel?.loa_m ? (
            <p className="mt-0.5 text-xs font-normal text-zinc-500">LOA {vessel.loa_m} m</p>
          ) : null}
        </SummaryItem>
        <SummaryItem icon={CalendarDays} label="Fechas">
          <span>{callDates.length} día{callDates.length === 1 ? "" : "s"} seleccionado{callDates.length === 1 ? "" : "s"}</span>
        </SummaryItem>
      </div>

      {validation && (validation.warnings.length > 0 || validation.errors.length > 0) ? (
        <div className="border-t border-zinc-200/80 px-5 py-4 dark:border-zinc-800">
          <ValidationIssuesAlert
            errors={validation.errors}
            warnings={validation.warnings}
          />
        </div>
      ) : null}

      <div className="border-t border-zinc-200/80 px-5 py-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center gap-2">
          <Hash className="h-4 w-4 text-[var(--admin-accent)]" strokeWidth={2} />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Códigos de reserva
          </h3>
        </div>
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
          Un código único por escala: puerto · naviera · barco · fecha
        </p>
        <div className="overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-700">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-zinc-200/80 bg-zinc-50/80 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950/50">
            <span>Fecha de escala</span>
            <span>Posición</span>
            <span>Código</span>
          </div>
          <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
            {callDates.map((iso, index) => {
              const assigned = positionsByDate[iso];
              return (
              <li
                key={iso}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-[var(--admin-accent)]/[0.04]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {formatIsoDateLabel(iso)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">Escala {index + 1}</p>
                </div>
                <div className="min-w-[4.5rem] text-center">
                  {loadingPositions ? (
                    <span className="text-xs text-zinc-400">…</span>
                  ) : assigned ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <LayoutGrid className="h-3 w-3" strokeWidth={2} />
                      {assigned.code}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      Sin posición
                    </span>
                  )}
                </div>
                <code
                  className="rounded-lg bg-[var(--admin-accent)]/8 px-2.5 py-1 text-[11px] font-semibold tracking-tight text-[var(--admin-accent)] sm:text-xs"
                >
                  {port && line && vessel
                    ? previewBookingCode(port.code, line.code, vessel.name, iso)
                    : iso}
                </code>
              </li>
              );
            })}
          </ul>
        </div>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          La posición se calcula automáticamente (LOA, calado y disponibilidad) al crear la
          reserva.
        </p>
      </div>

      <div className="border-t border-zinc-200/80 bg-zinc-50/40 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/30">
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
