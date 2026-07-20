"use client";

import { useState } from "react";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import EntityThumb from "@/components/ui/EntityThumb";
import ImageDropZone from "@/components/ui/ImageDropZone";
import { IMAGE_FILE_REJECT_MESSAGES } from "@/lib/imageFiles";

type ProfileAvatarFieldProps = {
  /** Name used for the letter initial when there is no photo. */
  label: string;
  previewUrl: string | null;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export default function ProfileAvatarField({
  label,
  previewUrl,
  disabled,
  onFileChange,
  onRemove,
  canRemove,
}: ProfileAvatarFieldProps) {
  const [rejectError, setRejectError] = useState<string | null>(null);

  return (
    <div className="mb-5 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <EntityThumb
        src={previewUrl}
        label={label}
        size="xl"
        className="shadow-sm"
      />
      <div className="flex w-full max-w-xs flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Foto de perfil
        </span>
        <ImageDropZone
          compact
          multiple={false}
          disabled={disabled}
          label={previewUrl ? "Cambiar foto" : "Subir foto"}
          hint=""
          className="[&_button]:mt-0"
          onFiles={(files) => {
            setRejectError(null);
            onFileChange(files[0] ?? null);
          }}
          onReject={(reason) => {
            setRejectError(IMAGE_FILE_REJECT_MESSAGES[reason]);
          }}
        />
        {rejectError ? (
          <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
            {rejectError}
          </p>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            JPG, PNG o WebP. Luego pulsa Guardar cambios.
          </p>
        )}
        {canRemove && (
          <ConfirmDeleteButton
            deleteLabel="la foto de perfil"
            onDelete={onRemove}
            disabled={disabled}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/15"
            ariaLabel="Quitar foto"
            title="Quitar foto"
          />
        )}
      </div>
    </div>
  );
}
