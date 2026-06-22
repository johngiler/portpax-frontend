"use client";

import { Images, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import ImageDropZone from "@/components/ui/ImageDropZone";
import ImageViewer from "@/components/ui/ImageViewer";
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const viewerImages = useMemo(
    () => images.map((img) => ({ src: img.image, alt: img.caption, caption: img.caption })),
    [images],
  );

  async function handleFiles(files: File[]) {
    setUploading(true);
    setError(null);
    try {
      const needsCover = images.length === 0;
      for (let i = 0; i < files.length; i += 1) {
        await createPortImage(portId, files[i], { isCover: needsCover && i === 0 });
      }
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
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

  function openViewer(index: number) {
    setViewerIndex(index);
    setViewerOpen(true);
  }

  const hasImages = images.length > 0;

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

      {!hasImages && (
        <>
          <ImageDropZone
            className="mb-4"
            busy={uploading}
            onFiles={handleFiles}
            hint="Arrastra varias imágenes o haz clic para seleccionar archivos"
          />
          <p className="text-sm text-zinc-500">Sin imágenes en la galería.</p>
        </>
      )}

      {hasImages && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {images.map((img, index) => (
              <figure
                key={img.id}
                className="group relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800"
              >
                <button
                  type="button"
                  onClick={() => openViewer(index)}
                  className="block w-full cursor-pointer"
                  aria-label={img.caption ? `Ver: ${img.caption}` : "Ver imagen"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image} alt={img.caption} className="aspect-[4/3] w-full object-cover" />
                </button>
                {img.is_cover && (
                  <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
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

          <ImageDropZone compact busy={uploading} onFiles={handleFiles} hint="" />
        </>
      )}

      <ImageViewer
        images={viewerImages}
        open={viewerOpen}
        initialIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />
    </ViewSection>
  );
}
