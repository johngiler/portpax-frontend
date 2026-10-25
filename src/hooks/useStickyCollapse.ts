"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

/** Matches `MainWithFilterMargin` padding so stuck heroes do not overflow-x. */
export const STICKY_COLLAPSE_TOP = "-top-2.5 sm:-top-6 lg:-top-8";
export const STICKY_COLLAPSE_BLEED = "-mx-2.5 sm:-mx-6 lg:-mx-8";

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

export function useStickyCollapse(
  sentinelRef: RefObject<HTMLElement | null>,
  resetKey?: string | number,
): boolean {
  const [isStuck, setIsStuck] = useState(false);

  useLayoutEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const scrollRoot = getScrollParent(sentinel);
    if (!scrollRoot) return;

    const updateStuck = () => {
      const delta =
        scrollRoot.getBoundingClientRect().top -
        sentinel.getBoundingClientRect().top;
      // Hysteresis: collapsing the hero must not flip stuck on/off every frame.
      setIsStuck((prev) => (prev ? delta > 2 : delta > 12));
    };

    updateStuck();
    scrollRoot.addEventListener("scroll", updateStuck, { passive: true });
    window.addEventListener("resize", updateStuck);
    return () => {
      scrollRoot.removeEventListener("scroll", updateStuck);
      window.removeEventListener("resize", updateStuck);
    };
  }, [sentinelRef, resetKey]);

  return isStuck;
}
