"use client";

import { useEffect } from "react";
import { COMPACT_LAYOUT_BREAKPOINT_PX } from "@/lib/inAppNav";

function isAppShell(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone) return true;
  const ua = window.navigator.userAgent || "";
  if (/\bwv\b/.test(ua) || /; wv\)/.test(ua)) return true;
  if (/iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua)) return true;
  return window.innerWidth < COMPACT_LAYOUT_BREAKPOINT_PX;
}

function allowPinch(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("[data-allow-pinch]"));
}

/**
 * Blocks pinch / double-tap page zoom in the PWA and native WebView.
 * iOS ignores `user-scalable=no` in Safari; gesture + touch-action cover that.
 */
export default function LockAppZoom() {
  useEffect(() => {
    if (!isAppShell()) return;

    document.documentElement.classList.add("app-no-zoom");

    const preventGesture = (event: Event) => {
      if (allowPinch(event.target)) return;
      event.preventDefault();
    };
    const preventPinchMove = (event: TouchEvent) => {
      if (event.touches.length < 2) return;
      if (allowPinch(event.target)) return;
      event.preventDefault();
    };

    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("gestureend", preventGesture, { passive: false });
    document.addEventListener("touchmove", preventPinchMove, { passive: false });

    return () => {
      document.documentElement.classList.remove("app-no-zoom");
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchmove", preventPinchMove);
    };
  }, []);

  return null;
}
