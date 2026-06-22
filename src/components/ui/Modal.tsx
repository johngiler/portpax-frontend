"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/modalScrollLock";

const MODAL_EXIT_MS = 250;

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Clase para el panel (ej. max-w-md) */
  panelClassName?: string;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  panelClassName = "max-w-2xl",
}: ModalProps) {
  const [isExiting, setIsExiting] = useState(false);
  const wasOpenRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const finishExit = useCallback(() => {
    clearExitTimer();
    setIsExiting(false);
  }, [clearExitTimer]);

  useLayoutEffect(() => {
    if (open) {
      clearExitTimer();
      setIsExiting(false);
      wasOpenRef.current = true;
      return;
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      setIsExiting(true);
    }
  }, [open, clearExitTimer]);

  useEffect(() => {
    if (!isExiting || open) return;
    clearExitTimer();
    exitTimerRef.current = window.setTimeout(finishExit, MODAL_EXIT_MS);
    return clearExitTimer;
  }, [isExiting, open, finishExit, clearExitTimer]);

  const visible = open || isExiting;
  const isAnimatingOut = isExiting && !open;

  const requestClose = useCallback(() => {
    if (!open || isExiting) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose();
  }, [open, isExiting, onClose]);

  useEffect(() => {
    if (!visible) return;
    lockBodyScroll();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      unlockBodyScroll();
    };
  }, [visible, requestClose]);

  if (!visible) return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-6 ${isAnimatingOut ? "pointer-events-none" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`absolute inset-0 cursor-pointer bg-slate-950/55 backdrop-blur-[2px] ${isAnimatingOut ? "modal-backdrop-exit" : "modal-backdrop-enter"}`}
        onClick={requestClose}
        aria-hidden
      />
      <div
        className={`relative w-full max-h-[90vh] flex flex-col ${panelClassName} overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[var(--admin-card-shadow-hover)] dark:border-zinc-700/70 dark:bg-zinc-900 ${isAnimatingOut ? "modal-panel-exit" : "modal-panel-enter"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-[var(--admin-accent)]/8 via-transparent to-[var(--admin-accent)]/10" />
        <div className="relative flex shrink-0 items-center justify-between border-b border-zinc-200/70 p-4 dark:border-zinc-700/70">
          <h2
            id="modal-title"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors duration-200 hover:bg-black/5 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 pt-5">
          {children}
        </div>
        {footer != null && (
          <div className="flex shrink-0 justify-end gap-3 border-t border-zinc-200/70 bg-zinc-50/80 p-4 dark:border-zinc-700/70 dark:bg-zinc-900">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}
