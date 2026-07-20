"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";

export type StatusMessageTone = "error" | "success";

/** Where the message is shown — keeps visual density consistent per context. */
export type StatusMessageScope = "view" | "section" | "modal";

type StatusMessageProps = {
  tone: StatusMessageTone;
  message: string | null | undefined;
  onDismiss?: () => void;
  scope?: StatusMessageScope;
  className?: string;
};

const TONE_CLASS: Record<StatusMessageTone, string> = {
  error:
    "border-red-200/90 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-200",
  success:
    "border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200",
};

const ICON_CLASS: Record<StatusMessageTone, string> = {
  error: "text-red-600 dark:text-red-400",
  success: "text-emerald-600 dark:text-emerald-400",
};

const SCOPE_CLASS: Record<StatusMessageScope, string> = {
  view: "mb-6 px-4 py-3",
  section: "mb-4 px-3.5 py-2.5",
  modal: "mb-4 px-3.5 py-2.5",
};

/**
 * Contextual success/error feedback.
 * Use at the same scope as the action: view header, section body, or modal body — never behind a modal.
 */
export default function StatusMessage({
  tone,
  message,
  onDismiss,
  scope = "section",
  className = "",
}: StatusMessageProps) {
  if (!message) return null;

  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border text-sm ${TONE_CLASS[tone]} ${SCOPE_CLASS[scope]} ${className}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${ICON_CLASS[tone]}`}
        strokeWidth={2}
        aria-hidden
      />
      <p className="min-w-0 flex-1 font-medium leading-snug">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className={`-mr-1 -mt-0.5 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors ${
            tone === "error"
              ? "text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40"
              : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
          }`}
          aria-label="Cerrar"
          title="Cerrar"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}
