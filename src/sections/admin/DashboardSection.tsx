"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DockingStats } from "@/lib/docking";
import { getDockingStats } from "@/lib/docking";

const CARD_COLORS = [
  "#3478b5", // Navieras - azul
  "#0d9488", // Puertos - teal
  "#d97706", // Muelles - ámbar
  "#7c3aed", // Barcos - violeta
  "#059669", // Escalas - esmeralda
];

const cards: { key: keyof DockingStats; label: string; href: string }[] = [
  { key: "shipping_lines", label: "Navieras", href: "/shipping-lines" },
  { key: "ports", label: "Puertos", href: "/ports" },
  { key: "berths", label: "Muelles", href: "/berths" },
  { key: "ships", label: "Barcos", href: "/ships" },
  { key: "scales", label: "Escalas", href: "/scales" },
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
          ¿Está el backend en marcha en {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}?
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(({ key, label, href }, i) => (
        <Link key={key} href={href} className="cursor-pointer">
          <div
            className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--admin-card-shadow-hover)] hover:border-zinc-300/80 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
            style={{
              borderTopWidth: "3px",
              borderTopColor: CARD_COLORS[i],
            }}
          >
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
        </Link>
      ))}
    </div>
  );
}
