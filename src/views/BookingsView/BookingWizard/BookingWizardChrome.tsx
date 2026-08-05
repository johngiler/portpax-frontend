"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { Port } from "@/types/catalog";
import type { ShippingLine, Vessel } from "@/types/cruise";
import WizardSelectionSummary from "./WizardSelectionSummary";
import WizardStepIndicator from "./WizardStepIndicator";
import type { BookingWizardStepId } from "./wizardTypes";

type BookingWizardChromeProps = {
  step: BookingWizardStepId;
  maxReachableIndex: number;
  onStepClick: (stepId: BookingWizardStepId) => void;
  port: Port | null;
  line: ShippingLine | null;
  vessel: Vessel | null;
  dateCount: number;
  positionLabel?: string | null;
  errorBanner?: ReactNode;
};

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

export default function BookingWizardChrome({
  step,
  maxReachableIndex,
  onStepClick,
  port,
  line,
  vessel,
  dateCount,
  positionLabel = null,
  errorBanner,
}: BookingWizardChromeProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  useLayoutEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const scrollRoot = getScrollParent(sentinel);
    if (!scrollRoot) return;

    const updateStuck = () => {
      const rootTop = scrollRoot.getBoundingClientRect().top;
      const sentinelTop = sentinel.getBoundingClientRect().top;
      setIsStuck(sentinelTop < rootTop - 1);
    };

    updateStuck();
    scrollRoot.addEventListener("scroll", updateStuck, { passive: true });
    window.addEventListener("resize", updateStuck);

    return () => {
      scrollRoot.removeEventListener("scroll", updateStuck);
      window.removeEventListener("resize", updateStuck);
    };
  }, []);

  return (
    <>
      {errorBanner ? <div className="mb-3">{errorBanner}</div> : null}
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      <div
        className={[
          "sticky z-20 mb-6 transition-[padding] duration-150 ease-in-out",
          isStuck
            ? "-top-4 -mx-4 border-b border-zinc-200/80 px-4 pb-3 pt-7 shadow-[var(--admin-card-shadow)] backdrop-blur-md sm:-top-6 sm:-mx-6 sm:px-6 sm:pt-9 lg:-top-8 lg:-mx-8 lg:px-8 lg:pt-11 dark:border-zinc-800"
            : "top-0",
        ].join(" ")}
        style={
          isStuck ? { background: "var(--admin-gradient-header)" } : undefined
        }
      >
        <div className={isStuck ? "relative z-10 space-y-2" : "space-y-6"}>
          <WizardStepIndicator
            compact={isStuck}
            currentStep={step}
            maxReachableIndex={maxReachableIndex}
            onStepClick={onStepClick}
          />
          <WizardSelectionSummary
            compact={isStuck}
            port={port}
            line={line}
            vessel={vessel}
            dateCount={dateCount}
            positionLabel={positionLabel}
          />
        </div>
      </div>
    </>
  );
}
