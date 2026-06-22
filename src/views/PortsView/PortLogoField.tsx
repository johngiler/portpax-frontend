"use client";

type PortLogoFieldProps = {
  previewUrl: string | null;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export default function PortLogoField({
  previewUrl,
  disabled,
  onFileChange,
  onRemove,
  canRemove,
}: PortLogoFieldProps) {
  return (
    <div className="mb-4 sm:col-span-2">
      <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Logo del puerto
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <span className="text-xs text-zinc-400">Sin logo</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="cursor-pointer text-sm font-medium text-[var(--admin-accent)] hover:underline">
            {previewUrl ? "Cambiar imagen" : "Subir imagen"}
            <input
              type="file"
              accept="image/*"
              disabled={disabled}
              className="sr-only"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
          {canRemove && (
            <button
              type="button"
              disabled={disabled}
              onClick={onRemove}
              className="cursor-pointer text-left text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
            >
              Quitar logo
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-zinc-500">Una sola imagen — logo o thumbnail del puerto.</p>
    </div>
  );
}
