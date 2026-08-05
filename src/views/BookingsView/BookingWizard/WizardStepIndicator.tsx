"use client";

import { Check } from "lucide-react";
import { BOOKING_WIZARD_STEPS, type BookingWizardStepId } from "./wizardTypes";

type WizardStepIndicatorProps = {
  currentStep: BookingWizardStepId;
  maxReachableIndex: number;
  onStepClick?: (stepId: BookingWizardStepId) => void;
  compact?: boolean;
};

type StepArrowProps = {
  done: boolean;
  compact?: boolean;
};

function StepArrow({ done, compact }: StepArrowProps) {
  return (
    <span
      className={
        compact
          ? "flex w-8 shrink-0 items-center justify-center sm:w-12 md:w-14"
          : "flex w-12 shrink-0 items-center justify-center sm:w-16 md:w-20"
      }
      aria-hidden
    >
      <svg
        viewBox="0 0 56 10"
        className={[
          compact
            ? "h-2 w-full max-w-[2.5rem] transition-colors duration-200 sm:max-w-[3.5rem]"
            : "h-2.5 w-full max-w-[3.5rem] transition-colors duration-200 sm:max-w-[4.5rem]",
          done ? "text-[var(--admin-accent)]" : "text-zinc-400 dark:text-zinc-500",
        ].join(" ")}
        fill="none"
      >
        <path
          d="M0 5h40M36 1l8 4-8 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function WizardStepIndicator({
  currentStep,
  maxReachableIndex,
  onStepClick,
  compact = false,
}: WizardStepIndicatorProps) {
  const currentIndex = BOOKING_WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav
      aria-label="Pasos de reserva"
      className={
        compact
          ? undefined
          : "border-b border-zinc-200/80 pb-5 dark:border-zinc-800"
      }
    >
      <ol
        className={
          compact
            ? "mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-y-2 px-1"
            : "mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-y-4 px-2 sm:px-4"
        }
      >
        {BOOKING_WIZARD_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isComplete = index < currentIndex;
          const isReachable = index <= maxReachableIndex;
          const isLast = index === BOOKING_WIZARD_STEPS.length - 1;
          const trailDone = index < currentIndex;

          return (
            <li key={step.id} className="flex items-start">
              <div
                className={
                  compact
                    ? "flex min-w-[3.75rem] flex-col items-center sm:min-w-[4.5rem]"
                    : "flex min-w-[4.5rem] flex-col items-center sm:min-w-[5rem]"
                }
              >
                <button
                  type="button"
                  disabled={!isReachable || !onStepClick}
                  onClick={() => onStepClick?.(step.id)}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={step.label}
                  className={[
                    "transition-colors duration-200",
                    isReachable && onStepClick ? "cursor-pointer" : "cursor-default",
                  ].join(" ")}
                >
                  <span
                    className={[
                      compact
                        ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors duration-200 sm:h-8 sm:w-8"
                        : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200 sm:h-10 sm:w-10",
                      isActive
                        ? "border-[var(--admin-accent)] bg-[var(--admin-accent)] text-white shadow-sm shadow-[var(--admin-accent)]/25"
                        : isComplete
                          ? "border-[var(--admin-accent)]/30 bg-[var(--admin-accent)]/8 text-[var(--admin-accent)]"
                          : isReachable
                            ? "border-zinc-200 bg-white text-zinc-500 hover:border-[var(--admin-accent)]/35 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                            : "border-zinc-100 bg-zinc-50 text-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-600",
                    ].join(" ")}
                  >
                    {isComplete ? (
                      <Check
                        className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Icon
                        className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
                        strokeWidth={2}
                      />
                    )}
                  </span>
                </button>
                <span
                  className={[
                    compact
                      ? "mt-1 block text-center text-[10px] font-medium leading-tight"
                      : "mt-1.5 block text-center text-[10px] font-medium leading-tight sm:text-xs",
                    isActive
                      ? "text-[var(--admin-accent)]"
                      : isComplete
                        ? "text-zinc-600 dark:text-zinc-300"
                        : "text-zinc-400 dark:text-zinc-500",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div
                  className={
                    compact
                      ? "flex h-7 shrink-0 items-center sm:h-8"
                      : "flex h-9 shrink-0 items-center sm:h-10"
                  }
                >
                  <StepArrow done={trailDone} compact={compact} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
