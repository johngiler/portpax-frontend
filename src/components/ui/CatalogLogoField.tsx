"use client";

import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import ImageDropZone from "@/components/ui/ImageDropZone";

type CatalogLogoFieldProps = {
  label: string;
  deleteLabel: string;
  hint?: string;
  previewUrl: string | null;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
  canRemove: boolean;
  compact?: boolean;
};

export default function CatalogLogoField({
  label,
  deleteLabel,
  hint,
  previewUrl,
  disabled,
  onFileChange,
  onRemove,
  canRemove,
  compact = false,
}: CatalogLogoFieldProps) {
  const boxClass = compact
    ? "mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
    : "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]";

  const uploadLabel = previewUrl ? "Cambiar imagen" : "Subir imagen";

  return (
    <div className={compact ? "text-center" : "mb-4 sm:col-span-2"}>
      <span
        className={`mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-200 ${compact ? "text-center" : ""}`}
      >
        {label}
      </span>
      <div
        className={
          compact ? "flex flex-col items-center gap-3" : "flex flex-wrap items-center gap-4"
        }
      >
        <div className={boxClass}>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className={`object-contain ${compact ? "h-full w-full p-3" : "h-full w-full p-1"}`}
            />
          ) : (
            <span className="text-xs text-zinc-400">Sin imagen</span>
          )}
        </div>
        <div className={`flex w-full flex-col gap-2 ${compact ? "items-stretch" : "max-w-xs"}`}>
          <ImageDropZone
            compact
            multiple={false}
            disabled={disabled}
            label={uploadLabel}
            hint=""
            className={compact ? "w-full [&_button]:mt-0" : "[&_button]:mt-0"}
            onFiles={(files) => onFileChange(files[0] ?? null)}
          />
          {canRemove && (
            <ConfirmDeleteButton
              deleteLabel={deleteLabel}
              onDelete={onRemove}
              disabled={disabled}
              className={`cursor-pointer text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400 ${compact ? "text-center" : "text-left"}`}
              ariaLabel="Quitar imagen"
              title="Quitar imagen"
            >
              Quitar imagen
            </ConfirmDeleteButton>
          )}
        </div>
      </div>
      {hint && !compact && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
