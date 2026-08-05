"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, X } from "lucide-react";
import DefaultButton from "@/components/buttons/DefaultButton";
import type { BookingWizardStepId } from "./wizardTypes";

type WizardCardActionsProps = {
  step: BookingWizardStepId;
  cancelHref: string;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  canContinue: boolean;
  stepDataLoading: boolean;
  submitting: boolean;
  reviewBlocked: boolean;
  callDateCount: number;
  placement: "top" | "bottom";
};

export default function WizardCardActions({
  step,
  cancelHref,
  onBack,
  onNext,
  onSubmit,
  canContinue,
  stepDataLoading,
  submitting,
  reviewBlocked,
  callDateCount,
  placement,
}: WizardCardActionsProps) {
  const shell =
    placement === "top"
      ? "mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-800"
      : "mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/80 pt-6 dark:border-zinc-800";

  return (
    <div className={shell}>
      <div className="flex gap-2">
        <Link
          href={cancelHref}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <X className="h-4 w-4" />
          Cancelar
        </Link>
        {step !== "port" && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Atrás
          </button>
        )}
      </div>

      {step !== "review" ? (
        <DefaultButton
          type="button"
          onClick={onNext}
          disabled={stepDataLoading || !canContinue}
          aria-disabled={stepDataLoading || !canContinue}
        >
          <span className="inline-flex items-center gap-2">
            {stepDataLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {stepDataLoading ? "Cargando…" : "Continuar"}
            {!stepDataLoading ? <ArrowRight className="h-4 w-4" /> : null}
          </span>
        </DefaultButton>
      ) : (
        <DefaultButton
          type="button"
          onClick={onSubmit}
          disabled={submitting || reviewBlocked}
          aria-disabled={submitting || reviewBlocked}
        >
          <span className="inline-flex items-center gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Crear {callDateCount} reserva{callDateCount === 1 ? "" : "s"}
          </span>
        </DefaultButton>
      )}
    </div>
  );
}
