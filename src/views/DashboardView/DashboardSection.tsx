"use client";

import Link from "next/link";
import { Anchor, Building2, CalendarDays, MapPin, Ship } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api-base";
import type { DockingStats } from "@/lib/docking";
import { getDockingStats } from "@/lib/docking";

const CARD_COLORS = ["#3478b5", "#0d9488", "#d97706", "#7c3aed", "#059669"];
/** RGBA para gradiente de cada card (mismo orden): azul, teal, ámbar, violeta, esmeralda */
const CARD_GRADIENTS = [
  "linear-gradient(160deg, rgba(52, 120, 181, 0.14) 0%, var(--background) 55%)",
  "linear-gradient(160deg, rgba(13, 148, 136, 0.14) 0%, var(--background) 55%)",
  "linear-gradient(160deg, rgba(217, 119, 6, 0.12) 0%, var(--background) 55%)",
  "linear-gradient(160deg, rgba(124, 58, 237, 0.14) 0%, var(--background) 55%)",
  "linear-gradient(160deg, rgba(5, 150, 105, 0.14) 0%, var(--background) 55%)",
];

const cards: {
  key: keyof DockingStats;
  label: string;
  href: string;
  Icon: LucideIcon;
}[] = [
  {
    key: "shipping_lines",
    label: "Navieras",
    href: "/shipping-lines",
    Icon: Building2,
  },
  { key: "ports", label: "Puertos", href: "/ports", Icon: MapPin },
  { key: "berths", label: "Muelles", href: "/berths", Icon: Anchor },
  { key: "ships", label: "Barcos", href: "/ships", Icon: Ship },
  { key: "scales", label: "Escalas", href: "/scales", Icon: CalendarDays },
];

export default function DashboardSection() {
  const [stats, setStats] = useState<DockingStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDockingStats()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
        <p className="text-sm font-medium text-red-700 dark:text-red-400">
          No se pudo cargar el resumen
        </p>
        <p className="mt-1 text-sm text-red-600/80 dark:text-red-500/80">
          ¿Está el backend en marcha en {API_BASE}?
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(({ key, label, href, Icon }, i) => (
        <Link key={key} href={href} className="cursor-pointer">
          <div
            className="group relative flex items-start justify-between gap-4 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--admin-card-shadow-hover)] hover:border-zinc-300/80 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
            style={{
              borderTopWidth: "3px",
              borderTopColor: CARD_COLORS[i],
              background: CARD_GRADIENTS[i],
            }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {label}
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                {stats ? stats[key] : "—"}
              </p>
              <span className="mt-2 inline-block text-xs font-medium text-[var(--admin-accent)] opacity-0 transition-opacity group-hover:opacity-100">
                Ver listado →
              </span>
            </div>
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-zinc-400 dark:text-zinc-500"
              style={{ backgroundColor: `${CARD_COLORS[i]}18` }}
              aria-hidden
            >
              <Icon className="h-5 w-5" style={{ color: CARD_COLORS[i] }} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
