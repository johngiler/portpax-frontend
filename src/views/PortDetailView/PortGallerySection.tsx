"use client";

import { ImagePlus, Images, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import ViewSection from "@/components/layout/ViewSection";
import { ApiError } from "@/services/apiClient";
import { createPortImage, deletePortImage } from "@/services/catalogs/portImageService";
import type { PortImage } from "@/types/catalog";

type PortGallerySectionProps = {
  portId: number;
  images: PortImage[];
  onChange: () => Promise<void>;
};

export default function PortGallerySection({ portId, images, onChange }: PortGallerySectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        await createPortImage(portId, file, { isCover: images.length === 0 });
      }
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await deletePortImage(id);
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar la imagen.");
    }
  }

  return (
    <ViewSection
      icon={Images}
      title="Galería del puerto"
      description="Imágenes y material visual del puerto."
    >
      {error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="mb-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[var(--admin-accent)]/40 px-4 py-2 text-sm font-medium text-[var(--admin-accent)] transition-colors hover:bg-[var(--admin-accent)]/5 disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4" />
          {uploading ? "Subiendo…" : "Agregar fotos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {images.length === 0 ? (
        <p className="text-sm text-zinc-500">Sin imágenes en la galería.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <figure
              key={img.id}
              className="group relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image} alt={img.caption} className="aspect-[4/3] w-full object-cover" />
              {img.is_cover && (
                <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                  Portada
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Eliminar imagen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </figure>
          ))}
        </div>
      )}
    </ViewSection>
  );
}
