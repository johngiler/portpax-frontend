"use client";

import { useMemo, useState } from "react";
import ImageViewer from "@/components/ui/ImageViewer";
import TableActionButtons from "@/components/tables/TableActionButtons";
import type { BerthDetail } from "@/types/catalog";
import { formatMeters } from "@/types/catalog";

type BerthCardProps = {
  berth: BerthDetail;
  onEdit: () => void;
  onDelete: () => void;
};

export default function BerthCard({ berth, onEdit, onDelete }: BerthCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const images = berth.images ?? [];

  const viewerImages = useMemo(
    () => images.map((img) => ({ src: img.image, alt: img.caption, caption: img.caption })),
    [images],
  );

  function openViewer(index: number) {
    setViewerIndex(index);
    setViewerOpen(true);
  }

  return (
    <article
      className={`overflow-hidden rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950/40 ${!berth.is_active ? "opacity-60" : ""}`}
    >
      <div className="group relative aspect-[16/9] bg-zinc-100 dark:bg-zinc-900">
        {berth.cover_image ? (
          <button
            type="button"
            onClick={() => {
              const coverIndex = images.findIndex((img) => img.image === berth.cover_image);
              openViewer(coverIndex >= 0 ? coverIndex : 0);
            }}
            className="h-full w-full cursor-pointer"
            aria-label="Ver imagen del muelle"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={berth.cover_image} alt="" className="h-full w-full object-cover" />
          </button>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Sin portada
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-lg bg-black/60 px-2 py-1 font-mono text-xs font-bold text-white">
          {berth.code}
        </span>
        {!berth.is_active && (
          <span className="absolute right-3 top-3 rounded-full bg-zinc-200/90 px-2 py-0.5 text-[10px] font-medium uppercase dark:bg-zinc-800/90">
            Inactivo
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            {berth.name || berth.code}
          </h3>
          <TableActionButtons
            onEdit={onEdit}
            onDelete={onDelete}
            deleteLabel={`el muelle ${berth.code}`}
          />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-zinc-400">Longitud</dt>
            <dd className="font-medium">{formatMeters(berth.length_m)}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">Ancho</dt>
            <dd className="font-medium">{formatMeters(berth.width_m)}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">Pasarela (L×A)</dt>
            <dd className="font-medium">
              {berth.walkway_length_m || berth.walkway_width_m
                ? `${formatMeters(berth.walkway_length_m)} × ${formatMeters(berth.walkway_width_m)}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">Calado</dt>
            <dd className="font-medium">{formatMeters(berth.min_draft_m)}</dd>
          </div>
        </dl>
      </div>

      {viewerImages.length > 0 ? (
        <ImageViewer
          images={viewerImages}
          open={viewerOpen}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </article>
  );
}
