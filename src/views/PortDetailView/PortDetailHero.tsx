"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, Ship, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import CountryLabel from "@/components/ui/CountryLabel";
import type { PortDetail } from "@/types/catalog";
import { formatLargestVessel, portDisplayName, portStatusLabel } from "@/types/catalog";

type PortDetailHeroProps = {
  port: PortDetail;
  onEdit: () => void;
  onDelete: () => void;
};

const LOGO_SIZE_MIN = 48;

export default function PortDetailHero({ port, onEdit, onDelete }: PortDetailHeroProps) {
  const largestVessel = formatLargestVessel(port);
  const textRef = useRef<HTMLDivElement>(null);
  const [logoSize, setLogoSize] = useState(LOGO_SIZE_MIN);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const syncLogoSize = () => {
      const height = el.getBoundingClientRect().height;
      setLogoSize(Math.max(Math.round(height), LOGO_SIZE_MIN));
    };

    syncLogoSize();
    const observer = new ResizeObserver(syncLogoSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [port.id, port.name, port.commercial_name, port.status, port.position_count, port.bollard_total, largestVessel]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-[var(--admin-accent)]/10 via-white to-zinc-50 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:from-[var(--admin-accent)]/20 dark:via-zinc-900 dark:to-zinc-950">
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
        <div className="flex min-w-0 items-start gap-5">
          <Link
            href="/ports"
            className="mt-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-200/80 bg-white/80 text-zinc-600 transition-colors hover:text-[var(--admin-accent)] dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300"
            aria-label="Volver a puertos"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex min-w-0 items-stretch gap-4">
            <div
              className="flex shrink-0 items-center justify-center self-stretch overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
              style={{ width: logoSize, height: logoSize }}
            >
              {port.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={port.logo} alt="" className="h-full w-full object-contain p-1.5" />
              ) : (
                <span
                  className="font-bold text-[var(--admin-accent)]/40"
                  style={{ fontSize: Math.max(logoSize * 0.38, 14) }}
                >
                  {port.name.charAt(0)}
                </span>
              )}
            </div>
            <div ref={textRef} className="min-w-0 flex flex-col">
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-semibold uppercase tracking-widest text-[var(--admin-accent)]">
                <CountryLabel country={port.country} />
                {port.region ? <span>· {port.region}</span> : null}
              </p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {portDisplayName(port)}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--admin-accent)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--admin-accent)]">
                  {portStatusLabel(port.status)}
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {port.position_count} posiciones
                </span>
                {port.bollard_total > 0 && (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {port.bollard_total} bitas
                  </span>
                )}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                <Ship className="h-4 w-4 shrink-0 text-[var(--admin-accent)]" strokeWidth={1.75} />
                <span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Mayor barco atracado:{" "}
                  </span>
                  {largestVessel ?? "Sin registros"}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 self-start sm:justify-end">
          <DefaultButton type="button" onClick={onEdit}>
            <span className="inline-flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Editar
            </span>
          </DefaultButton>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
