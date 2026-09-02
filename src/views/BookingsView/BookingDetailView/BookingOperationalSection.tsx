"use client";

import { useCallback, useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import PositionOccupancyHint from "@/components/booking/PositionOccupancyHint";
import ValidationIssuesAlert from "@/components/booking/ValidationIssuesAlert";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import PaxCapacityMeter from "@/components/booking/PaxCapacityMeter";
import PaxConceptsGuideButton from "@/components/booking/PaxConceptsGuide";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/contexts/ConfirmContext";
import { ApiError } from "@/services/apiClient";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { paxPercent } from "@/lib/bookingPaxDisplay";
import {
  canAuthorizeExceptions,
  canEditBookingSchedule,
  canEditPortOperations,
} from "@/lib/navAccess";
import {
  suggestBookingPositions,
  updateBooking,
} from "@/services/bookings/bookingService";
import type {
  Booking,
  BookingValidationIssue,
  PositionSuggestion,
} from "@/types/booking";
import { issueSeverity } from "@/lib/bookingConflictSeverity";

type BookingOperationalSectionProps = {
  booking: Booking;
  onUpdated: (booking: Booking) => void;
  onError: (message: string | null) => void;
  canWrite?: boolean;
  returnTo?: string | null;
};

function apiErrorMentionsCode(err: unknown, code: string): boolean {
  if (!(err instanceof ApiError)) return false;
  const blob = `${err.message} ${JSON.stringify(err.fieldErrors ?? {})}`;
  return blob.includes(code);
}

export default function BookingOperationalSection({
  booking,
  onUpdated,
  onError,
  canWrite = true,
  returnTo = null,
}: BookingOperationalSectionProps) {
  const { user } = useAuth();
  const { requestConfirm } = useConfirm();
  const mayAuthorize = canAuthorizeExceptions(user?.role);
  const canSchedule = canWrite && canEditBookingSchedule(user?.role);
  const canPortOps = canWrite && canEditPortOperations(user?.role);

  const [positionId, setPositionId] = useState(booking.position ?? 0);
  const [eta, setEta] = useState(booking.eta?.slice(0, 5) ?? "");
  const [etd, setEtd] = useState(booking.etd?.slice(0, 5) ?? "");
  const [etaReal, setEtaReal] = useState(booking.eta_real?.slice(0, 5) ?? "");
  const [etdReal, setEtdReal] = useState(booking.etd_real?.slice(0, 5) ?? "");
  const [actualPax, setActualPax] = useState(
    booking.actual_pax != null ? String(booking.actual_pax) : "",
  );
  const [actualCrew, setActualCrew] = useState(
    booking.actual_crew != null ? String(booking.actual_crew) : "",
  );
  const [operationNotes, setOperationNotes] = useState(
    booking.operation_notes ?? "",
  );
  const [manifestFile, setManifestFile] = useState<File | null>(null);
  const [suggestions, setSuggestions] = useState<PositionSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ackCombinedRed, setAckCombinedRed] = useState(false);
  const [needsCombinedRedAck, setNeedsCombinedRedAck] = useState(false);

  const cancelled = booking.status === "c";
  const scheduleReadOnly = !canSchedule || cancelled;
  const portOpsReadOnly = !canPortOps || cancelled;

  const capacity = booking.vessel_pax_capacity;
  const plannedPct = paxPercent(booking.planned_pax, capacity);
  const actualPct = paxPercent(
    actualPax === "" ? booking.actual_pax : Number(actualPax),
    booking.planned_pax,
  );

  const missingPortOps: string[] = [];
  if (canPortOps && !cancelled) {
    if (actualPax.trim() === "" && booking.actual_pax == null) {
      missingPortOps.push("PAX real (desembarcados)");
    }
    if (actualCrew.trim() === "" && booking.actual_crew == null) {
      missingPortOps.push("Tripulación real");
    }
    if (!booking.arrival_manifest_url && !manifestFile) {
      missingPortOps.push("Manifiesto adjunto");
    }
  }

  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const data = await suggestBookingPositions({
        port: booking.port,
        vessel: booking.vessel,
        call_date: booking.call_date,
        exclude_booking: booking.id,
        eta: eta || null,
        etd: etd || null,
      });
      setSuggestions(data.positions);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [booking.port, booking.vessel, booking.call_date, booking.id, eta, etd]);

  useEffect(() => {
    setPositionId(booking.position ?? 0);
    setEta(booking.eta?.slice(0, 5) ?? "");
    setEtd(booking.etd?.slice(0, 5) ?? "");
    setEtaReal(booking.eta_real?.slice(0, 5) ?? "");
    setEtdReal(booking.etd_real?.slice(0, 5) ?? "");
    setActualPax(booking.actual_pax != null ? String(booking.actual_pax) : "");
    setActualCrew(booking.actual_crew != null ? String(booking.actual_crew) : "");
    setOperationNotes(booking.operation_notes ?? "");
    setManifestFile(null);
    setAckCombinedRed(false);
    setNeedsCombinedRedAck(false);
  }, [booking]);

  useEffect(() => {
    if (cancelled || !canSchedule) return;
    const timer = window.setTimeout(() => {
      void loadSuggestions();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [cancelled, canSchedule, loadSuggestions]);

  async function performSave() {
    setSaving(true);
    onError(null);
    try {
      const payload: Parameters<typeof updateBooking>[1] = {};
      if (canSchedule) {
        payload.position = positionId > 0 ? positionId : null;
        payload.eta = eta || null;
        payload.etd = etd || null;
        payload.acknowledge_combined_red = ackCombinedRed || undefined;
      }
      if (canPortOps) {
        payload.actual_pax = actualPax === "" ? null : Number(actualPax);
        payload.actual_crew = actualCrew === "" ? null : Number(actualCrew);
        payload.eta_real = etaReal || null;
        payload.etd_real = etdReal || null;
        payload.operation_notes = operationNotes;
        if (manifestFile) payload.arrival_manifest = manifestFile;
      }
      const updated = await updateBooking(booking.id, payload);
      onUpdated(updated);
      setManifestFile(null);
      setNeedsCombinedRedAck(false);
      setAckCombinedRed(false);
    } catch (err) {
      if (apiErrorMentionsCode(err, "combined_loa_red")) {
        setNeedsCombinedRedAck(true);
      }
      onError(
        getApiErrorMessage(err, "No se pudo guardar la información operativa."),
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (canPortOps && missingPortOps.length > 0) {
      requestConfirm({
        title: "Datos de arribo incompletos",
        message: `Faltan: ${missingPortOps.join(", ")}. ¿Guardar de todas formas?`,
        confirmLabel: "Guardar",
        onConfirm: () => {
          void performSave();
        },
      });
      return;
    }
    void performSave();
  }

  const positionOptions = suggestions.map((position) => {
    const tags: string[] = [];
    if (position.recommended) tags.push("recomendada");
    if (position.occupied) tags.push("ocupada");
    const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";
    return {
      value: position.id,
      label: `${position.code}${suffix}`,
    };
  });

  const selectedSuggestion = suggestions.find((p) => p.id === positionId);
  const ltaTrack =
    booking.status === "lta" ||
    booking.status === "cl" ||
    booking.status === "ltd";
  const ltaSoftFailCodes = new Set([
    "lta_beyond_horizon",
    "lta_horizon_denied",
    "lta_policy_denied",
  ]);
  const liveWarnings = (selectedSuggestion?.warnings ?? []).filter((warning) => {
    if (!ltaTrack) return true;
    return !ltaSoftFailCodes.has(warning.code);
  });
  const liveNormalized = liveWarnings.map((warning) => ({
    ...warning,
    severity: issueSeverity(warning),
  }));
  const liveHasLtaMatch = liveNormalized.some(
    (item) => item.code === "lta_agreement_match",
  );
  const liveSuggestLoaded = selectedSuggestion != null;
  const snapshotIssues: BookingValidationIssue[] = (
    booking.conflict_snapshot ?? []
  )
    .map((item) => ({
      level: item.level ?? "warning",
      code: item.code,
      message: item.message,
      severity: issueSeverity(item),
      detail: item.detail,
    }))
    .filter((item) => {
      if (!ltaSoftFailCodes.has(item.code)) return true;
      if (ltaTrack) return false;
      if (liveHasLtaMatch) return false;
      if (liveSuggestLoaded) {
        return liveNormalized.some((live) => live.code === item.code);
      }
      return true;
    });
  const sameSavedPosition = positionId === (booking.position ?? 0);
  const displayIssues = (() => {
    const byCode = new Map<string, BookingValidationIssue>();
    if (sameSavedPosition) {
      for (const item of snapshotIssues) {
        byCode.set(item.code || item.message, item);
      }
    }
    for (const item of liveNormalized) {
      byCode.set(item.code || item.message, item);
    }
    return Array.from(byCode.values());
  })();

  const showSave = (canSchedule || canPortOps) && !cancelled;
  const showPosition =
    canSchedule || positionOptions.length > 0 || booking.position;

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Operación y posición
      </h2>

      <div className="mt-4 space-y-4">
        {showPosition ? (
          <div>
            <FormFieldSelect<number>
              label="Reasignar posición"
              name="booking_position"
              value={positionId}
              onChange={setPositionId}
              options={positionOptions}
              optionLabel={loadingSuggestions ? "Cargando…" : "Sin asignar"}
              emptyValue={0}
              disabled={scheduleReadOnly}
            />
            <PositionOccupancyHint
              occupant={
                selectedSuggestion?.occupied
                  ? selectedSuggestion.occupant
                  : null
              }
              positionCode={selectedSuggestion?.code}
              callDate={booking.call_date}
            />
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="ETA"
            name="booking_eta"
            type="text"
            value={eta}
            onChange={(value) => setEta(String(value))}
            placeholder="08:00"
            disabled={scheduleReadOnly}
          />
          <FormField
            label="ETD"
            name="booking_etd"
            type="text"
            value={etd}
            onChange={(value) => setEtd(String(value))}
            placeholder="18:00"
            disabled={scheduleReadOnly}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="ETA real"
            name="booking_eta_real"
            type="text"
            value={etaReal}
            onChange={(value) => setEtaReal(String(value))}
            placeholder="08:00"
            disabled={portOpsReadOnly}
          />
          <FormField
            label="ETD real"
            name="booking_etd_real"
            type="text"
            value={etdReal}
            onChange={(value) => setEtdReal(String(value))}
            placeholder="18:00"
            disabled={portOpsReadOnly}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PaxCapacityMeter
            label="Prom. PAX / Cap. máx."
            labelEnd={<PaxConceptsGuideButton />}
            value={booking.planned_pax}
            total={capacity}
            percent={plannedPct}
            hint={
              plannedPct != null
                ? `Planificado vs capacidad: ${plannedPct}%`
                : null
            }
          />
          <PaxCapacityMeter
            label="PAX real (desembarcados)"
            value={
              actualPax === "" ? booking.actual_pax : Number(actualPax)
            }
            total={booking.planned_pax}
            percent={actualPct}
            editable
            editText={actualPax}
            onEditChange={setActualPax}
            editDisabled={portOpsReadOnly}
            editName="booking_actual_pax"
            hint={
              actualPct != null
                ? `Cumplimiento vs planificado: ${actualPct}%`
                : null
            }
          />
          <FormField
            label="Tripulación real (post-arribo)"
            name="booking_actual_crew"
            type="number"
            min={0}
            value={actualCrew}
            onChange={(value) => setActualCrew(String(value))}
            disabled={portOpsReadOnly}
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Manifiesto
          </p>
          {booking.arrival_manifest_url ? (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <a
                href={booking.arrival_manifest_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-[var(--admin-accent)] hover:underline"
              >
                Ver manifiesto adjunto
              </a>
            </div>
          ) : null}
          {!portOpsReadOnly ? (
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              disabled={portOpsReadOnly}
              onChange={(e) => setManifestFile(e.target.files?.[0] ?? null)}
              className="block w-full cursor-pointer text-sm text-zinc-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[var(--admin-accent)]/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--admin-accent)]"
            />
          ) : null}
          {manifestFile ? (
            <p className="mt-1 text-xs text-zinc-500">
              Nuevo archivo: {manifestFile.name}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <label
          htmlFor="booking_operation_notes"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200"
        >
          Notas de operación
        </label>
        <textarea
          id="booking_operation_notes"
          name="booking_operation_notes"
          rows={3}
          value={operationNotes}
          onChange={(e) => setOperationNotes(e.target.value)}
          disabled={portOpsReadOnly}
          placeholder="Observaciones de arribo / muelle…"
          className="w-full rounded-md border border-[var(--admin-border)] bg-gradient-to-b from-white to-[var(--admin-surface-muted)] px-4 py-2.5 text-sm text-zinc-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] focus:border-[var(--admin-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700/70 dark:from-zinc-900 dark:to-zinc-800 dark:text-zinc-100"
        />
      </div>

      {needsCombinedRedAck ? (
        <div className="mt-4 space-y-2 rounded-xl border border-red-200/80 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/30">
          {mayAuthorize ? (
            <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-800 dark:text-zinc-100">
              <input
                type="checkbox"
                checked={ackCombinedRed}
                onChange={(e) => setAckCombinedRed(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
              />
              <span className="font-medium">
                Autorizar zona roja de LOA combinada (RN-05)
              </span>
            </label>
          ) : (
            <p className="text-sm text-red-800 dark:text-red-300">
              LOA combinada en zona roja: solo un port-operator o admin puede
              autorizar este cambio.
            </p>
          )}
        </div>
      ) : null}

      {displayIssues.length > 0 ? (
        <ValidationIssuesAlert
          className="mt-4"
          warnings={displayIssues}
          returnTo={returnTo}
        />
      ) : null}

      {showSave ? (
        <div className="mt-4">
          <DefaultButton type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar operación"}
          </DefaultButton>
        </div>
      ) : null}
    </section>
  );
}
