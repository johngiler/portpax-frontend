"use client";

import { Info } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import type { PortDetail } from "@/types/catalog";
import { formatCoord, formatMeters } from "@/types/catalog";

type PortDetailsSectionProps = {
  port: PortDetail;
};

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-950/50">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

export default function PortDetailsSection({ port }: PortDetailsSectionProps) {
  const coords =
    port.latitude && port.longitude
      ? `${formatCoord(port.latitude)}, ${formatCoord(port.longitude)}`
      : "—";

  return (
    <ViewSection
      icon={Info}
      title="Detalles del puerto"
      description="Información general y especificaciones técnicas."
      className="border-[var(--admin-accent)]/15 shadow-md"
    >
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <DetailItem
          label="Localización"
          value={[port.name, port.region, port.country].filter(Boolean).join(", ")}
        />
        <DetailItem label="Coordenadas" value={coords} />
        <DetailItem label="Posiciones" value={String(port.position_count)} />
        <DetailItem label="Fondeos" value={String(port.anchorage_slot_count)} />
        <DetailItem label="Calado mín. línea de atraque" value={formatMeters(port.min_berth_draft_m)} />
        <DetailItem
          label="Defensas (total)"
          value={port.fender_count != null ? String(port.fender_count) : "—"}
        />
        <DetailItem
          label="Bitas (total)"
          value={port.bollard_total > 0 ? String(port.bollard_total) : "—"}
        />
        <DetailItem label="Código interno" value={port.code} />
      </dl>
      {port.notes && (
        <p className="mt-5 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          {port.notes}
        </p>
      )}
    </ViewSection>
  );
}
