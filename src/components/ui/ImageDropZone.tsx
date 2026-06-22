"use client";

import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { filterImageFiles, hasOversizedImageFiles } from "@/lib/imageFiles";

type ImageDropZoneProps = {
  onFiles: (files: File[]) => void | Promise<void>;
  onReject?: (reason: "oversized" | "invalid") => void;
  disabled?: boolean;
  busy?: boolean;
  label?: string;
  hint?: string;
  compact?: boolean;
  multiple?: boolean;
  className?: string;
};

export default function ImageDropZone({
  onFiles,
  onReject,
  disabled = false,
  busy = false,
  label = "Agregar fotos",
  hint = "Arrastra imágenes aquí o haz clic para seleccionar",
  compact = false,
  multiple = true,
  className = "",
}: ImageDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const inactive = disabled || busy;

  async function processFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    if (hasOversizedImageFiles(fileList)) {
      onReject?.("oversized");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    let files = filterImageFiles(fileList);
    if (!files.length) {
      onReject?.("invalid");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (!multiple) files = files.slice(0, 1);
    await onFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!inactive) setDragOver(true);
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
    if (inactive) return;
    void processFiles(e.dataTransfer.files);
  }

  function openPicker() {
    if (!inactive) inputRef.current?.click();
  }

  const stateClass = dragOver
    ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/10"
    : "border-[var(--admin-accent)]/35 bg-[var(--admin-accent)]/[0.03] hover:border-[var(--admin-accent)]/55 hover:bg-[var(--admin-accent)]/5";

  if (compact) {
    return (
      <div className={className}>
        <button
          type="button"
          disabled={inactive}
          onClick={openPicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${stateClass} ${dragOver ? "text-[var(--admin-accent)]" : "text-[var(--admin-accent)]"}`}
        >
          <ImagePlus className="h-3.5 w-3.5" />
          {busy ? "Subiendo…" : label}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="sr-only"
          onChange={(e) => void processFiles(e.target.files)}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={inactive ? -1 : 0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${inactive ? "cursor-not-allowed opacity-50" : stateClass}`}
      >
        <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
          <ImagePlus className="h-5 w-5" />
        </span>
        <span className="text-sm font-medium text-[var(--admin-accent)]">
          {busy ? "Subiendo…" : label}
        </span>
        {hint ? <span className="mt-1 max-w-xs text-xs text-zinc-500">{hint}</span> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        onChange={(e) => void processFiles(e.target.files)}
      />
    </div>
  );
}
