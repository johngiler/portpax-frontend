"use client";

import { ClipboardPaste, Upload, type LucideIcon } from "lucide-react";
import { useRef, useState } from "react";

const DEFAULT_ACCEPT =
  ".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function isAcceptedExcel(file: File, accept: string): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xlsm")) return true;
  if (accept.includes("sheet") && file.type.includes("sheet")) return true;
  return false;
}

export type ImportOptionDropCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  onFile: (file: File) => void;
  disabled?: boolean;
  accept?: string;
  dropHint?: string;
  /** Shown inside the card; opens paste flow without triggering file pick. */
  onPasteClick?: () => void;
  pasteLabel?: string;
};

/**
 * Import option card: click/DnD for file, optional paste action inside the same card.
 */
export default function ImportOptionDropCard({
  title,
  description,
  icon: Icon,
  onFile,
  disabled = false,
  accept = DEFAULT_ACCEPT,
  dropHint = "Arrastra el Excel aquí o haz clic",
  onPasteClick,
  pasteLabel = "O escribir / pegar celdas…",
}: ImportOptionDropCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function takeFile(fileList: FileList | null) {
    if (disabled || !fileList?.length) return;
    const file = fileList[0];
    if (!isAcceptedExcel(file, accept)) return;
    onFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (disabled) return;
    takeFile(e.dataTransfer.files);
  }

  const borderClass = dragOver
    ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/10"
    : "border-[var(--admin-border)] bg-gradient-to-b from-white to-[var(--admin-surface-muted)] hover:border-[var(--admin-accent)]/40 dark:from-zinc-900 dark:to-zinc-800";

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex w-full flex-col overflow-hidden rounded-xl border transition-colors ${borderClass} ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          takeFile(e.target.files);
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--admin-accent)]/5 disabled:pointer-events-none"
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </span>
          <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </span>
          <span className="mt-1.5 block text-[11px] font-medium text-[var(--admin-accent)]">
            {dragOver ? "Suelta el archivo…" : dropHint}
          </span>
        </span>
        <Upload
          className="mt-1 h-4 w-4 shrink-0 text-zinc-400"
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {onPasteClick ? (
        <div className="border-t border-[var(--admin-border)]/70 px-4 py-2 dark:border-zinc-700/70">
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onPasteClick();
            }}
            className="inline-flex w-full cursor-pointer items-center gap-1.5 rounded-md px-1 py-1 text-left text-xs font-medium text-[var(--admin-accent)] transition-colors hover:bg-[var(--admin-accent)]/10 disabled:pointer-events-none disabled:opacity-50"
          >
            <ClipboardPaste className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {pasteLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
