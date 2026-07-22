"use client";

import { Info } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type InfoTooltipProps = {
  content: string;
  /** Accessible name for the trigger (e.g. role label). */
  label: string;
  className?: string;
};

/**
 * “i” info control: hover shows content; click pins/unpins.
 * Panel is portaled to document.body so layout transforms do not offset it.
 */
export default function InfoTooltip({
  content,
  label,
  className = "",
}: InfoTooltipProps) {
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const open = hovered || pinned;

  function clearHideTimer() {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }

  function showHover() {
    clearHideTimer();
    setHovered(true);
  }

  function scheduleHideHover() {
    clearHideTimer();
    hideTimer.current = setTimeout(() => setHovered(false), 150);
  }

  useEffect(() => {
    setMounted(true);
    return () => clearHideTimer();
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setCoords(null);
      return;
    }

    function update() {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const panelWidth = panelRef.current?.offsetWidth ?? 288;
      const gap = 6;
      const margin = 8;

      let left = rect.left + rect.width / 2;
      left = Math.min(
        Math.max(left, margin + panelWidth / 2),
        window.innerWidth - margin - panelWidth / 2,
      );

      let top = rect.bottom + gap;
      const panelHeight = panelRef.current?.offsetHeight ?? 120;
      if (top + panelHeight + margin > window.innerHeight) {
        top = Math.max(margin, rect.top - gap - panelHeight);
      }

      setCoords({ top, left });
    }

    update();
    // Recalculate after paint once panel size is known
    const raf = requestAnimationFrame(update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, content, label]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setPinned(false);
      setHovered(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPinned(false);
        setHovered(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const panel =
    mounted &&
    open &&
    coords &&
    createPortal(
      <div
        ref={panelRef}
        id={panelId}
        role="tooltip"
        onMouseEnter={showHover}
        onMouseLeave={scheduleHideHover}
        style={{ top: coords.top, left: coords.left }}
        className="pointer-events-auto fixed z-[100] w-64 -translate-x-1/2 rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 text-left text-xs leading-relaxed text-zinc-600 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 sm:w-72"
      >
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        {content}
      </div>,
      document.body,
    );

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Información: ${label}`}
        aria-expanded={open}
        aria-controls={panelId}
        onMouseEnter={showHover}
        onMouseLeave={scheduleHideHover}
        onFocus={showHover}
        onBlur={scheduleHideHover}
        onClick={(e) => {
          e.stopPropagation();
          setPinned((prev) => !prev);
        }}
        className={`inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full transition-colors ${
          open
            ? "bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]"
            : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        }`}
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
      </button>
      {panel}
    </span>
  );
}
