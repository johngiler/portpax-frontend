"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import { useMotionTransition } from "@/lib/motionPresets";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { sanitizeReturnTo } from "@/lib/safeReturnTo";
import { createBookingBatch } from "@/services/bookings/bookingService";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchAllShippingLines } from "@/services/catalogs/shippingLineService";
import { fetchAllVessels } from "@/services/catalogs/vesselService";
import type { Port } from "@/types/catalog";
import type { ShippingLine, Vessel } from "@/types/cruise";
import type { BookingListItem } from "@/types/booking";
import BookingWizardChrome from "./BookingWizardChrome";
import BookingWizardSuccess from "./BookingWizardSuccess";
import WizardCardActions from "./WizardCardActions";
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

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

function parsePrefill(searchParams: URLSearchParams): {
  portId: number | null;
  callDate: string | null;
  positionId: number | null;
  positionLabel: string;
} {
  const portId = Number.parseInt(searchParams.get("port") || "", 10);
  const dateRaw = searchParams.get("date")?.trim() ?? "";
  const positionId = Number.parseInt(searchParams.get("position") || "", 10);
  const positionLabel = searchParams.get("positionLabel")?.trim() ?? "";
  return {
    portId: Number.isFinite(portId) && portId > 0 ? portId : null,
    callDate: ISO_DATE_RE.test(dateRaw) ? dateRaw : null,
    positionId:
      Number.isFinite(positionId) && positionId > 0 ? positionId : null,
    positionLabel,
  };
}

function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null;
  let parent = node.parentElement;
  while (parent) {
    const { overflowY, overflow } = getComputedStyle(parent);
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflow === "auto" ||
      overflow === "scroll"
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

export default function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transition = useMotionTransition(0.22);
  const prefillDoneRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const cancelHref = returnTo ?? "/bookings";

  const [step, setStep] = useState<BookingWizardStepId>("port");
  const [form, setForm] = useState<BookingWizardForm>(emptyBookingWizardForm);
  const [direction, setDirection] = useState(1);

  const [ports, setPorts] = useState<Port[]>([]);
  const [lines, setLines] = useState<ShippingLine[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);

  const [loadingPorts, setLoadingPorts] = useState(true);
  const [loadingLines, setLoadingLines] = useState(true);
  const [loadingVessels, setLoadingVessels] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);

  const [viewError, setViewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdBookings, setCreatedBookings] = useState<BookingListItem[] | null>(null);
  const [reviewBlocked, setReviewBlocked] = useState(true);

  const handleReviewBlockingChange = useCallback((blocked: boolean) => {
    setReviewBlocked(blocked);
  }, []);

  const handleDatesLoadingChange = useCallback((loading: boolean) => {
    setLoadingDates(loading);
  }, []);

  const stepDataLoading =
    (step === "port" && loadingPorts) ||
    (step === "line" && loadingLines) ||
    (step === "vessel" && loadingVessels) ||
    (step === "dates" && loadingDates);

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
      const all = await fetchAllShippingLines();
      setLines(all.filter((l) => l.is_active));
    } catch {
      setLines([]);
    } finally {
      setLoadingLines(false);
    }
  }, []);

  const loadVessels = useCallback(async (shippingLineId: number) => {
    setLoadingVessels(true);
    try {
      const all = await fetchAllVessels({ shipping_line: shippingLineId });
      setVessels(all.filter((v) => v.is_active));
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

  useEffect(() => {
    if (prefillDoneRef.current) return;
    const prefill = parsePrefill(searchParams);
    if (!prefill.portId) return;
    prefillDoneRef.current = true;
    setForm((prev) => ({
      ...prev,
      portId: prefill.portId,
      callDates: prefill.callDate ? [prefill.callDate] : prev.callDates,
      preferredPositionId: prefill.positionId,
      preferredPositionLabel: prefill.positionLabel,
    }));
    setStep("line");
  }, [searchParams]);

  const reachable = useMemo(() => maxReachableIndex(form), [form]);

  function scrollToTop() {
    const scrollRoot = getScrollParent(rootRef.current);
    if (scrollRoot) {
      scrollRoot.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goToStep(target: BookingWizardStepId) {
    const targetIndex = stepIndex(target);
    if (targetIndex > reachable) return;
    // Do not skip ahead while the current step is still loading its data.
    if (targetIndex > stepIndex(step) && stepDataLoading) return;
    setDirection(targetIndex > stepIndex(step) ? 1 : -1);
    setStep(target);
    setViewError(null);
  }

  function goNext() {
    if (stepDataLoading || !canAdvance(step, form)) return;
    const nextIndex = stepIndex(step) + 1;
    if (nextIndex >= BOOKING_WIZARD_STEPS.length) return;
    setDirection(1);
    setStep(BOOKING_WIZARD_STEPS[nextIndex].id);
    setViewError(null);
    scrollToTop();
  }

  function goBack() {
    const prevIndex = stepIndex(step) - 1;
    if (prevIndex < 0) return;
    setDirection(-1);
    setStep(BOOKING_WIZARD_STEPS[prevIndex].id);
    setViewError(null);
    scrollToTop();
  }

  function selectPort(portId: number) {
    setForm((prev) => ({
      ...prev,
      portId,
      preferredPositionId: null,
      preferredPositionLabel: "",
    }));
  }

  function selectLine(lineId: number) {
    setForm((prev) => ({
      ...prev,
      shippingLineId: lineId,
      vesselId: null,
      callDates: prev.callDates,
    }));
  }

  function selectVessel(vesselId: number) {
    setForm((prev) => ({
      ...prev,
      vesselId,
    }));
  }

  async function handleSubmit() {
    if (
      !form.portId ||
      !form.shippingLineId ||
      !form.vesselId ||
      form.callDates.length === 0 ||
      reviewBlocked
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
        eta: form.eta || null,
        etd: form.etd || null,
        planned_pax: form.plannedPax === "" ? null : Number(form.plannedPax),
        position: form.preferredPositionId,
        status: form.status,
      });
      setCreatedBookings(created);
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudieron crear las reservas."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (createdBookings !== null) {
    return (
      <BookingWizardSuccess
        bookings={createdBookings}
        onViewAll={() => router.push(returnTo ?? "/bookings")}
        onNewBooking={() => {
          setForm(emptyBookingWizardForm());
          setStep("port");
          setCreatedBookings(null);
          prefillDoneRef.current = true;
        }}
      />
    );
  }

  const stepMeta = BOOKING_WIZARD_STEPS.find((s) => s.id === step)!;

  return (
    <div ref={rootRef}>
      <BookingWizardChrome
        step={step}
        maxReachableIndex={reachable}
        onStepClick={goToStep}
        port={selectedPort}
        line={selectedLine}
        vessel={selectedVessel}
        dateCount={form.callDates.length}
        positionLabel={form.preferredPositionLabel || null}
        errorBanner={
          viewError ? (
            <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />
          ) : null
        }
      />

      <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-[var(--admin-card-shadow)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-8">
        <WizardCardActions
          placement="top"
          step={step}
          cancelHref={cancelHref}
          onBack={goBack}
          onNext={goNext}
          onSubmit={handleSubmit}
          canContinue={canAdvance(step, form)}
          stepDataLoading={stepDataLoading}
          submitting={submitting}
          reviewBlocked={reviewBlocked}
          callDateCount={form.callDates.length}
        />

        <div className="mb-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{stepMeta.label}</h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
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
              <DatesStep
                portId={form.portId}
                vesselId={form.vesselId}
                selectedDates={form.callDates}
                onChange={(d) => setForm((p) => ({ ...p, callDates: d }))}
                eta={form.eta}
                etd={form.etd}
                plannedPax={form.plannedPax}
                onEtaChange={(eta) => setForm((p) => ({ ...p, eta }))}
                onEtdChange={(etd) => setForm((p) => ({ ...p, etd }))}
                onPlannedPaxChange={(plannedPax) =>
                  setForm((p) => ({ ...p, plannedPax }))
                }
                preferredPositionId={form.preferredPositionId}
                preferredPositionLabel={form.preferredPositionLabel}
                onPreferredPositionChange={(id, label) =>
                  setForm((p) => ({
                    ...p,
                    preferredPositionId: id,
                    preferredPositionLabel: label,
                  }))
                }
                onLoadingChange={handleDatesLoadingChange}
              />
            )}
            {step === "review" && (
              <ReviewStep
                port={selectedPort}
                line={selectedLine}
                vessel={selectedVessel}
                callDates={form.callDates}
                notes={form.notes}
                onNotesChange={(notes) => setForm((p) => ({ ...p, notes }))}
                status={form.status}
                onStatusChange={(status) => setForm((p) => ({ ...p, status }))}
                eta={form.eta}
                etd={form.etd}
                plannedPax={form.plannedPax}
                preferredPositionId={form.preferredPositionId}
                preferredPositionLabel={form.preferredPositionLabel}
                onBlockingChange={handleReviewBlockingChange}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <WizardCardActions
          placement="bottom"
          step={step}
          cancelHref={cancelHref}
          onBack={goBack}
          onNext={goNext}
          onSubmit={handleSubmit}
          canContinue={canAdvance(step, form)}
          stepDataLoading={stepDataLoading}
          submitting={submitting}
          reviewBlocked={reviewBlocked}
          callDateCount={form.callDates.length}
        />
      </div>
    </div>
  );
}
