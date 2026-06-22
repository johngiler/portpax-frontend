"use client";

import CatalogLogoField from "@/components/ui/CatalogLogoField";

type PortLogoFieldProps = {
  previewUrl: string | null;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
  canRemove: boolean;
  compact?: boolean;
};

export default function PortLogoField({
  previewUrl,
  disabled,
  onFileChange,
  onRemove,
  canRemove,
  compact = false,
}: PortLogoFieldProps) {
  return (
    <CatalogLogoField
      label="Logo del puerto"
      deleteLabel="el logo del puerto"
      hint="Se muestra en la rejilla y cabecera del puerto."
      compact={compact}
      previewUrl={previewUrl}
      disabled={disabled}
      onFileChange={onFileChange}
      onRemove={onRemove}
      canRemove={canRemove}
    />
  );
}
