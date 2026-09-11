"use client";

import { useEffect, useRef } from "react";
import {
  PRESENCE_IDLE_MS,
  type PresenceStatus,
} from "@/types/presence";

type SendStatus = (status: PresenceStatus) => void;

/**
 * Track local active/idle and push status changes through the WebSocket.
 * Hidden tab → idle immediately; activity or visible tab → active.
 */
export function usePresenceActivity(enabled: boolean, sendStatus: SendStatus) {
  const statusRef = useRef<PresenceStatus>("active");
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendRef = useRef(sendStatus);
  sendRef.current = sendStatus;

  useEffect(() => {
    if (!enabled) return;

    function apply(next: PresenceStatus) {
      if (statusRef.current === next) return;
      statusRef.current = next;
      sendRef.current(next);
    }

    function clearIdleTimer() {
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
        idleTimer.current = null;
      }
    }

    function armIdleTimer() {
      clearIdleTimer();
      idleTimer.current = setTimeout(() => {
        if (typeof document !== "undefined" && document.hidden) {
          apply("idle");
          return;
        }
        apply("idle");
      }, PRESENCE_IDLE_MS);
    }

    function onActivity() {
      if (typeof document !== "undefined" && document.hidden) return;
      apply("active");
      armIdleTimer();
    }

    function onVisibility() {
      if (document.hidden) {
        clearIdleTimer();
        apply("idle");
        return;
      }
      apply("active");
      armIdleTimer();
    }

    apply("active");
    armIdleTimer();

    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];
    for (const name of activityEvents) {
      window.addEventListener(name, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearIdleTimer();
      for (const name of activityEvents) {
        window.removeEventListener(name, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);
}
