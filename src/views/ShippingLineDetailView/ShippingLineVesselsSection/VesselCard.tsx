"use client";

import { useState } from "react";
import { Ship } from "lucide-react";
import TableActionButtons from "@/components/tables/TableActionButtons";
import ImageViewer from "@/components/ui/ImageViewer";
import type { Vessel } from "@/types/cruise";

type VesselCardProps = {
  vessel: Vessel;
  onEdit: () => void;
  onDelete: () => void;
};

export default function VesselCard({ vessel, onEdit, onDelete }: VesselCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <article
      className={[
        "overflow-hidden rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950/40",
        !vessel.is_active ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--admin-accent)]/8 via-zinc-50 to-zinc-100 dark:from-[var(--admin-accent)]/15 dark:via-zinc-900 dark:to-zinc-950">
        {vessel.logo ? (
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className="absolute inset-0 h-full w-full cursor-pointer"
            aria-label={`Ver imagen de ${vessel.name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={vessel.logo}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
        ) : (
          <Ship className="h-10 w-10 text-[var(--admin-accent)]/60" strokeWidth={1.5} />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {vessel.name}
            </h3>
            {vessel.vessel_class ? (
              <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                {vessel.vessel_class}
              </p>
            ) : null}
          </div>
          <TableActionButtons
            onEdit={onEdit}
            onDelete={onDelete}
            deleteLabel={`el barco ${vessel.name}`}
          />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-zinc-400">LOA</dt>
            <dd className="font-medium text-zinc-700 dark:text-zinc-200">
              {vessel.loa_m ? `${vessel.loa_m} m` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">PAX</dt>
            <dd className="font-medium text-zinc-700 dark:text-zinc-200">
              {vessel.pax_capacity ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">Segmento</dt>
            <dd className="truncate font-medium text-zinc-700 dark:text-zinc-200">
              {vessel.segment || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">Estado</dt>
            <dd className="font-medium text-zinc-700 dark:text-zinc-200">
              {vessel.is_active ? "Activo" : "Inactivo"}
            </dd>
          </div>
        </dl>
      </div>

      {vessel.logo ? (
        <ImageViewer
          images={[{ src: vessel.logo, alt: vessel.name, caption: vessel.name }]}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </article>
  );
}
