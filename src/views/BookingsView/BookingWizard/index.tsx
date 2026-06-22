"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import { useMotionTransition } from "@/lib/motionPresets";
import { ApiError } from "@/services/apiClient";
import { createBookingBatch } from "@/services/bookings/bookingService";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchShippingLines } from "@/services/catalogs/shippingLineService";
import { fetchVessels } from "@/services/catalogs/vesselService";
import type { Port } from "@/types/catalog";
import type { ShippingLine, Vessel } from "@/types/cruise";
import WizardStepIndicator from "./WizardStepIndicator";
import DatesStep from "./steps/DatesStep";
import PortStep from "./steps/PortStep";
import ReviewStep from "./steps/ReviewStep";
import ShippingLineStep from "./steps/ShippingLineStep";
import VesselStep from "./steps/VesselStep";
import {
  BOOKING_WIZARD_STEPS,
  type BookingWizardForm,
  type BookingWizardStepId,
  emptyBookingWizardForm,
} from "./wizardTypes";

function stepIndex(stepId: BookingWizardStepId): number {
  return BOOKING_WIZARD_STEPS.findIndex((s) => s.id === stepId);
}

function maxReachableIndex(form: BookingWizardForm): number {
  if (!form.portId) return 0;
  if (!form.shippingLineId) return 1;
  if (!form.vesselId) return 2;
  if (form.callDates.length === 0) return 3;
  return 4;
}

function canAdvance(stepId: BookingWizardStepId, form: BookingWizardForm): boolean {
  switch (stepId) {
    case "port":
      return form.portId !== null;
    case "line":
      return form.shippingLineId !== null;
    case "vessel":
      return form.vesselId !== null;
    case "dates":
      return form.callDates.length > 0;
    case "review":
      return true;
    default:
      return false;
  }
}

export default function BookingWizard() {
  const router = useRouter();
  const transition = useMotionTransition(0.22);
  const [step, setStep] = useState<BookingWizardStepId>("port");
  const [form, setForm] = useState<BookingWizardForm>(emptyBookingWizardForm);
  const [direction, setDirection] = useState(1);

  const [ports, setPorts] = useState<Port[]>([]);
  const [lines, setLines] = useState<ShippingLine[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);

  const [loadingPorts, setLoadingPorts] = useState(true);
  const [loadingLines, setLoadingLines] = useState(true);
  const [loadingVessels, setLoadingVessels] = useState(false);

  const [viewError, setViewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const selectedPort = ports.find((p) => p.id === form.portId) ?? null;
  const selectedLine = lines.find((l) => l.id === form.shippingLineId) ?? null;
  const selectedVessel = vessels.find((v) => v.id === form.vesselId) ?? null;

  const loadPorts = useCallback(async () => {
    setLoadingPorts(true);
    try {
      const data = await fetchPorts({ page: 1, pageSize: 50 });
      setPorts(data.results.filter((p) => p.is_active));
    } catch {
      setPorts([]);
    } finally {
      setLoadingPorts(false);
    }
  }, []);

  const loadLines = useCallback(async () => {
    setLoadingLines(true);
    try {
      const data = await fetchShippingLines({ page: 1, pageSize: 100 });
      setLines(data.results.filter((l) => l.is_active));
    } catch {
      setLines([]);
    } finally {
      setLoadingLines(false);
    }
  }, []);

  const loadVessels = useCallback(async (shippingLineId: number) => {
    setLoadingVessels(true);
    try {
      const data = await fetchVessels({ shipping_line: shippingLineId, pageSize: 200 });
      setVessels(data.results.filter((v) => v.is_active));
    } catch {
      setVessels([]);
    } finally {
      setLoadingVessels(false);
    }
  }, []);

  useEffect(() => {
    loadPorts();
    loadLines();
  }, [loadPorts, loadLines]);

  useEffect(() => {
    if (form.shippingLineId) {
      loadVessels(form.shippingLineId);
    } else {
      setVessels([]);
    }
  }, [form.shippingLineId, loadVessels]);

  const reachable = useMemo(() => maxReachableIndex(form), [form]);

  function goToStep(target: BookingWizardStepId) {
    const targetIndex = stepIndex(target);
    if (targetIndex > reachable) return;
    setDirection(targetIndex > stepIndex(step) ? 1 : -1);
    setStep(target);
    setViewError(null);
  }

  function goNext() {
    if (!canAdvance(step, form)) return;
    const nextIndex = stepIndex(step) + 1;
    if (nextIndex >= BOOKING_WIZARD_STEPS.length) return;
    setDirection(1);
    setStep(BOOKING_WIZARD_STEPS[nextIndex].id);
    setViewError(null);
  }

  function goBack() {
    const prevIndex = stepIndex(step) - 1;
    if (prevIndex < 0) return;
    setDirection(-1);
    setStep(BOOKING_WIZARD_STEPS[prevIndex].id);
    setViewError(null);
  }

  function selectPort(portId: number) {
    setForm((prev) => ({
      ...prev,
      portId,
    }));
  }

  function selectLine(lineId: number) {
    setForm((prev) => ({
      ...prev,
      shippingLineId: lineId,
      vesselId: null,
      callDates: [],
    }));
  }

  function selectVessel(vesselId: number) {
    setForm((prev) => ({
      ...prev,
      vesselId,
      callDates: [],
    }));
  }

  async function handleSubmit() {
    if (
      !form.portId ||
      !form.shippingLineId ||
      !form.vesselId ||
      form.callDates.length === 0
    ) {
      return;
    }

    setSubmitting(true);
    setViewError(null);
    try {
      const created = await createBookingBatch({
        port: form.portId,
        shipping_line: form.shippingLineId,
        vessel: form.vesselId,
        call_dates: form.callDates,
        notes: form.notes,
      });
      setSuccessCount(created.length);
    } catch (err) {
      setViewError(
        err instanceof ApiError ? err.message : "No se pudieron crear las reservas.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (successCount !== null) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
          <span className="text-2xl font-bold">{successCount}</span>
        </div>
        <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Reservas creadas
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Se generaron {successCount} código{successCount === 1 ? "" : "s"} de reserva en un solo
          paquete.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <DefaultButton type="button" onClick={() => router.push("/bookings")}>
            Ver reservas
          </DefaultButton>
          <button
            type="button"
            onClick={() => {
              setForm(emptyBookingWizardForm());
              setStep("port");
              setSuccessCount(null);
            }}
            className="cursor-pointer rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Nueva reserva
          </button>
        </div>
      </div>
    );
  }

  const stepMeta = BOOKING_WIZARD_STEPS.find((s) => s.id === step)!;

  return (
    <div className="space-y-6">
      {viewError && <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />}

      <WizardStepIndicator
        currentStep={step}
        maxReachableIndex={reachable}
        onStepClick={goToStep}
      />

      <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-[var(--admin-card-shadow)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{stepMeta.label}</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {step === "port" && "Selecciona el puerto de escala."}
            {step === "line" && "Elige la naviera operadora."}
            {step === "vessel" && "Selecciona el crucero que hará la escala."}
            {step === "dates" && "Marca uno o varios días en el calendario."}
            {step === "review" && "Revisa y confirma el paquete de reservas."}
          </p>
        </div>

        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
            transition={transition}
          >
            {step === "port" && (
              <PortStep
                ports={ports}
                selectedId={form.portId}
                onSelect={selectPort}
                loading={loadingPorts}
              />
            )}
            {step === "line" && (
              <ShippingLineStep
                lines={lines}
                selectedId={form.shippingLineId}
                onSelect={selectLine}
                loading={loadingLines}
              />
            )}
            {step === "vessel" && (
              <VesselStep
                vessels={vessels}
                selectedId={form.vesselId}
                onSelect={selectVessel}
                loading={loadingVessels}
              />
            )}
            {step === "dates" && (
              <DatesStep selectedDates={form.callDates} onChange={(d) => setForm((p) => ({ ...p, callDates: d }))} />
            )}
            {step === "review" && (
              <ReviewStep
                port={selectedPort}
                line={selectedLine}
                vessel={selectedVessel}
                callDates={form.callDates}
                notes={form.notes}
                onNotesChange={(notes) => setForm((p) => ({ ...p, notes }))}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/80 pt-6 dark:border-zinc-800">
          <div className="flex gap-2">
            <Link
              href="/bookings"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancelar
            </Link>
            {step !== "port" && (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
            )}
          </div>

          {step !== "review" ? (
            <DefaultButton type="button" onClick={goNext} disabled={!canAdvance(step, form)}>
              <span className="inline-flex items-center gap-2">
                Continuar
                <ArrowRight className="h-4 w-4" />
              </span>
            </DefaultButton>
          ) : (
            <DefaultButton type="button" onClick={handleSubmit} disabled={submitting}>
              <span className="inline-flex items-center gap-2">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Crear {form.callDates.length} reserva{form.callDates.length === 1 ? "" : "s"}
              </span>
            </DefaultButton>
          )}
        </div>
      </div>
    </div>
  );
}
