"use client";

import { LayoutGrid, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import SectionAddButton from "@/components/buttons/SectionAddButton";
import ImageDropZone from "@/components/ui/ImageDropZone";
import ImageViewer from "@/components/ui/ImageViewer";
import ViewSection from "@/components/layout/ViewSection";
import { ApiError } from "@/services/apiClient";
import {
  createPosition,
  deletePosition,
  updatePosition,
} from "@/services/catalogs/positionService";
import { createPositionImage, deletePositionImage } from "@/services/catalogs/positionImageService";
import type { PortDetail, PositionDetail, PositionPayload } from "@/types/catalog";
import { formatMeters, positionTypeLabel } from "@/types/catalog";
import PositionFormModal, {
  type PositionFormMode,
} from "@/views/PositionsView/PositionFormModal";

type PortPositionsSectionProps = {
  port: PortDetail;
  onChange: () => Promise<void>;
};

function PositionCard({
  position,
  onEdit,
  onDelete,
  onImagesChange,
}: {
  position: PositionDetail;
  onEdit: () => void;
  onDelete: () => void;
  onImagesChange: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const viewerImages = useMemo(
    () => position.images.map((img) => ({ src: img.image, alt: img.caption, caption: img.caption })),
    [position.images],
  );

  function openViewer(index: number) {
    setViewerIndex(index);
    setViewerOpen(true);
  }

  async function handleUpload(files: File[]) {
    setUploading(true);
    try {
      const needsCover = !position.cover_image && position.images.length === 0;
      for (let i = 0; i < files.length; i += 1) {
        await createPositionImage(position.id, files[i], {
          isCover: needsCover && i === 0,
        });
      }
      await onImagesChange();
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(id: number) {
    await deletePositionImage(id);
    await onImagesChange();
  }

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="relative aspect-[16/9] bg-zinc-100 dark:bg-zinc-900">
        {position.cover_image ? (
          <button
            type="button"
            onClick={() => {
              const coverIndex = position.images.findIndex((img) => img.image === position.cover_image);
              openViewer(coverIndex >= 0 ? coverIndex : 0);
            }}
            className="h-full w-full cursor-pointer"
            aria-label="Ver imágenes de la posición"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={position.cover_image} alt="" className="h-full w-full object-cover" />
          </button>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Sin portada
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-lg bg-black/60 px-2 py-1 font-mono text-xs font-bold text-white">
          {position.code}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              {positionTypeLabel(position.position_type)}
              {position.berth_code ? ` · ${position.berth_code}` : ""}
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div>
                <dt className="text-zinc-400">Eslora máx.</dt>
                <dd className="font-medium">{formatMeters(position.max_loa_m)}</dd>
              </div>
              <div>
                <dt className="text-zinc-400">Calado</dt>
                <dd className="font-medium">{formatMeters(position.min_draft_m)}</dd>
              </div>
            </dl>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="cursor-pointer rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-[var(--admin-accent)] dark:hover:bg-zinc-800"
              aria-label="Editar posición"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="cursor-pointer rounded-md p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
              aria-label="Eliminar posición"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {position.images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {position.images.map((img, index) => (
              <div key={img.id} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => openViewer(index)}
                  className="cursor-pointer"
                  aria-label="Ver imagen"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image} alt="" className="h-14 w-20 rounded-md object-cover" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-red-600 text-[10px] text-white"
                  aria-label="Eliminar"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <ImageDropZone compact busy={uploading} onFiles={handleUpload} hint="" />
      </div>

      <ImageViewer
        images={viewerImages}
        open={viewerOpen}
        initialIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />
    </article>
  );
}

export default function PortPositionsSection({ port, onChange }: PortPositionsSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<PositionFormMode>("create");
  const [editing, setEditing] = useState<PositionDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(position: PositionDetail) {
    setFormMode("edit");
    setEditing(position);
    setFormOpen(true);
  }

  async function handleSave(payload: PositionPayload) {
    setSaving(true);
    setError(null);
    try {
      if (formMode === "create") {
        await createPosition(payload);
      } else if (editing) {
        await updatePosition(editing.id, payload);
      }
      setFormOpen(false);
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la posición.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(position: PositionDetail) {
    if (!window.confirm(`¿Eliminar la posición ${position.code}?`)) return;
    setError(null);
    try {
      await deletePosition(position.id);
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar la posición.");
    }
  }

  return (
    <>
      <ViewSection
        icon={LayoutGrid}
        title="Posiciones"
        description="Posiciones de atraque y fondeo con sus características."
        actions={<SectionAddButton label="Agregar posición" onClick={openCreate} />}
      >
        {error && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {port.positions.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin posiciones registradas.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {port.positions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                onEdit={() => openEdit(position)}
                onDelete={() => handleDelete(position)}
                onImagesChange={onChange}
              />
            ))}
          </div>
        )}
      </ViewSection>

      <PositionFormModal
        open={formOpen}
        mode={formMode}
        lockedPortId={port.id}
        initial={editing}
        saving={saving}
        onClose={() => !saving && setFormOpen(false)}
        onSubmit={handleSave}
      />
    </>
  );
}
