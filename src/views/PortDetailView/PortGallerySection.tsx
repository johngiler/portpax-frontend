"use client";

import { Images } from "lucide-react";
import { useMemo, useState } from "react";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import ImageDropZone from "@/components/ui/ImageDropZone";
import ImageViewer from "@/components/ui/ImageViewer";
import ViewSection from "@/components/layout/ViewSection";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { IMAGE_FILE_REJECT_MESSAGES } from "@/lib/imageFiles";
import { createPortImage, deletePortImage } from "@/services/catalogs/portImageService";
import type { PortImage } from "@/types/catalog";

type PortGallerySectionProps = {
  portId: number;
  images: PortImage[];
  onChange: () => Promise<void>;
  canWrite?: boolean;
};

export default function PortGallerySection({
  portId,
  images,
  onChange,
  canWrite = true,
}: PortGallerySectionProps) {
  const galleryImages = images ?? [];
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const viewerImages = useMemo(
    () => galleryImages.map((img) => ({ src: img.image, alt: img.caption, caption: img.caption })),
    [galleryImages],
  );

  function handleReject(reason: "oversized" | "invalid") {
    setError(IMAGE_FILE_REJECT_MESSAGES[reason]);
  }

  async function handleFiles(files: File[]) {
    setUploading(true);
    setError(null);
    try {
      const needsCover = galleryImages.length === 0;
      for (let i = 0; i < files.length; i += 1) {
        await createPortImage(portId, files[i], { isCover: needsCover && i === 0 });
      }
      await onChange();
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo subir la imagen."));
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
      setError(getApiErrorMessage(err, "No se pudo eliminar la imagen."));
    }
  }

  function openViewer(index: number) {
    setViewerIndex(index);
    setViewerOpen(true);
  }

  const hasImages = galleryImages.length > 0;

  return (
    <ViewSection
      icon={Images}
      title="Galería del puerto"
      description="Imágenes y material visual del puerto."
    >
      <FormErrorAlert message={error} className="mb-3" />

      {!hasImages && (
        <>
          {canWrite ? (
            <ImageDropZone
              className="mb-4"
              busy={uploading}
              onFiles={handleFiles}
              onReject={handleReject}
              hint="Arrastra varias imágenes o haz clic para seleccionar archivos"
            />
          ) : null}
          <p className="text-sm text-zinc-500">Sin imágenes en la galería.</p>
        </>
      )}

      {hasImages && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {galleryImages.map((img, index) => (
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
                {canWrite ? (
                  <ConfirmDeleteButton
                    deleteLabel="esta imagen de la galería"
                    onDelete={() => handleDelete(img.id)}
                    className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    ariaLabel="Eliminar imagen"
                  />
                ) : null}
              </figure>
            ))}
          </div>

          {canWrite ? (
            <ImageDropZone compact busy={uploading} onFiles={handleFiles} onReject={handleReject} hint="" />
          ) : null}
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
