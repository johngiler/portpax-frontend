"use client";

import { useState } from "react";
import { Check, ClipboardCopy, FileDown, Hash } from "lucide-react";

type BookingCodeRefProps = {
  code: string;
  /** Show "Código de reserva" label above the chip. */
  showLabel?: boolean;
  /** Optional confirmation PDF download inside the same bar. */
  pdfHref?: string | null;
  className?: string;
};

export default function BookingCodeRef({
  code,
  showLabel = true,
  pdfHref = null,
  className = "",
}: BookingCodeRefProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={className}>
      {showLabel ? (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          Código de reserva
        </p>
      ) : null}
      <div className="flex min-w-0 items-center gap-1 rounded-xl bg-[var(--admin-accent)]/8 px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2.5">
        <Hash
          className="h-4 w-4 shrink-0 text-[var(--admin-accent)]"
          strokeWidth={2}
          aria-hidden
        />
        <code className="min-w-0 flex-1 break-all text-sm font-semibold text-[var(--admin-accent)]">
          {code}
        </code>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--admin-accent)] transition-colors hover:bg-[var(--admin-accent)]/15"
          title={copied ? "Copiado" : "Copiar código de reserva"}
          aria-label={copied ? "Código copiado" : "Copiar código de reserva"}
        >
          {copied ? (
            <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
          ) : (
            <ClipboardCopy className="h-4 w-4" strokeWidth={2} aria-hidden />
          )}
        </button>
        {pdfHref ? (
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[var(--admin-accent)] transition-colors hover:bg-[var(--admin-accent)]/15"
            title="Descargar confirmación PDF"
            aria-label="Descargar confirmación PDF"
          >
            <FileDown className="h-4 w-4" strokeWidth={2} aria-hidden />
            <span className="hidden sm:inline">PDF</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}
