"use client";

import { FileDown } from "lucide-react";

type ConfirmationPdfButtonProps = {
  href: string;
  /** Compact icon+text for list rows. */
  compact?: boolean;
  /** Icon-only control (mobile list). */
  iconOnly?: boolean;
  className?: string;
};

export default function ConfirmationPdfButton({
  href,
  compact = false,
  iconOnly = false,
  className = "",
}: ConfirmationPdfButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={[
        "inline-flex cursor-pointer items-center font-semibold text-[var(--admin-accent)] transition-colors hover:underline",
        iconOnly
          ? "h-8 w-8 items-center justify-center rounded-lg border border-[var(--admin-accent)]/25 bg-[var(--admin-accent)]/8"
          : compact
            ? "gap-1.5 rounded-lg border border-[var(--admin-accent)]/25 bg-[var(--admin-accent)]/8 px-2 py-1 text-[11px]"
            : "gap-1.5 text-sm",
        className,
      ].join(" ")}
      title="Descargar confirmación PDF"
      aria-label="Descargar confirmación PDF"
    >
      <FileDown
        className={iconOnly || compact ? "h-3.5 w-3.5" : "h-4 w-4"}
        strokeWidth={2}
        aria-hidden
      />
      {iconOnly ? null : compact ? "PDF" : "Descargar confirmación PDF"}
    </a>
  );
}
