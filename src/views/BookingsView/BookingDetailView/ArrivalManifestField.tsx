"use client";

import { FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import ImageDropZone from "@/components/ui/ImageDropZone";
import ImageViewer from "@/components/ui/ImageViewer";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import { IMAGE_FILE_REJECT_MESSAGES } from "@/lib/imageFiles";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)(\?|#|$)/i;
const PDF_EXT = /\.pdf(\?|#|$)/i;

export function isManifestImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return IMAGE_EXT.test(url) || /\/media\/.*\.(jpe?g|png|webp|gif)/i.test(url);
}

export function isManifestPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return PDF_EXT.test(url) || url.toLowerCase().includes("application/pdf");
}

function isImageFile(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("image/") && !type.includes("svg")) return true;
  return IMAGE_EXT.test(file.name);
}

function isPdfFile(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  return type === "application/pdf" || /\.pdf$/i.test(file.name);
}

type ArrivalManifestFieldProps = {
  /** Saved file URL from detail retrieve / PATCH response. */
  savedUrl: string | null;
  pendingFile: File | null;
  onPendingChange: (file: File | null) => void;
  disabled?: boolean;
};

/**
 * Arrival manifesto: image preview (thumb + ImageViewer) for saved or pending
 * images; PDF as open link / filename. Images via ImageDropZone; PDF via
 * accept=".pdf" only.
 */
export default function ArrivalManifestField({
  savedUrl,
  pendingFile,
  onPendingChange,
  disabled = false,
}: ArrivalManifestFieldProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const pendingObjectUrl = useMemo(() => {
    if (!pendingFile || !isImageFile(pendingFile)) return null;
    return URL.createObjectURL(pendingFile);
  }, [pendingFile]);

  useEffect(() => {
    return () => {
      if (pendingObjectUrl) URL.revokeObjectURL(pendingObjectUrl);
    };
  }, [pendingObjectUrl]);

  const previewSrc = pendingObjectUrl
    ?? (savedUrl && isManifestImageUrl(savedUrl) && !pendingFile
      ? savedUrl
      : null);

  const showSavedPdf =
    !pendingFile && savedUrl != null && isManifestPdfUrl(savedUrl);
  const showPendingPdf = pendingFile != null && isPdfFile(pendingFile);
  const showSavedNonImage =
    !pendingFile &&
    savedUrl != null &&
    !isManifestImageUrl(savedUrl) &&
    !isManifestPdfUrl(savedUrl);

  function handleReject(reason: "oversized" | "invalid") {
    setRejectError(IMAGE_FILE_REJECT_MESSAGES[reason]);
  }

  function handlePdfPick(fileList: FileList | null) {
    setRejectError(null);
    const file = fileList?.[0] ?? null;
    if (!file) {
      onPendingChange(null);
      return;
    }
    if (!isPdfFile(file)) {
      setRejectError("Selecciona un PDF.");
      return;
    }
    onPendingChange(file);
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Manifiesto
      </p>
      <FormErrorAlert message={rejectError} className="mb-2" />

      {previewSrc ? (
        <div className="mb-3 flex flex-wrap items-start gap-3">
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className="group relative h-28 w-40 cursor-pointer overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] shadow-sm"
            aria-label="Ver manifiesto"
            title="Ver manifiesto"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt="Manifiesto"
              className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
            />
          </button>
          {pendingFile && !disabled ? (
            <ConfirmDeleteButton
              deleteLabel="el manifiesto pendiente"
              onDelete={() => onPendingChange(null)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/15"
              ariaLabel="Quitar manifiesto pendiente"
              title="Quitar manifiesto pendiente"
            />
          ) : null}
        </div>
      ) : null}

      {showSavedPdf || showSavedNonImage ? (
        <div className="mb-2">
          <a
            href={savedUrl!}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--admin-accent)] hover:underline"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Ver manifiesto adjunto
          </a>
        </div>
      ) : null}

      {showPendingPdf ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 truncate">{pendingFile!.name}</span>
          {!disabled ? (
            <ConfirmDeleteButton
              deleteLabel="el PDF pendiente"
              onDelete={() => onPendingChange(null)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/15"
              ariaLabel="Quitar PDF pendiente"
              title="Quitar PDF pendiente"
            />
          ) : null}
        </div>
      ) : null}

      {!disabled ? (
        <div className="flex flex-col gap-2 sm:max-w-sm">
          <ImageDropZone
            compact
            multiple={false}
            label={previewSrc || savedUrl ? "Cambiar imagen" : "Subir imagen"}
            hint=""
            className="[&_button]:mt-0"
            onFiles={(files) => {
              setRejectError(null);
              onPendingChange(files[0] ?? null);
            }}
            onReject={handleReject}
          />
          <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-[var(--admin-accent)]/55 hover:bg-[var(--admin-accent)]/5 hover:text-[var(--admin-accent)] dark:border-zinc-600 dark:text-zinc-300">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            {showPendingPdf || showSavedPdf ? "Cambiar PDF" : "Adjuntar PDF"}
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={(e) => {
                handlePdfPick(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      ) : null}

      {previewSrc ? (
        <ImageViewer
          images={[{ src: previewSrc, alt: "Manifiesto" }]}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </div>
  );
}
