"use client";

import type { LucideIcon } from "lucide-react";

type ComingSoonViewProps = {
  title: string;
  description: string;
  phase: number;
  icon: LucideIcon;
};

export default function ComingSoonView({
  title,
  description,
  phase,
  icon: Icon,
}: ComingSoonViewProps) {
  const totalPhases = 6;
  const phases = Array.from({ length: totalPhases }, (_, i) => i + 1);

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 shadow-[var(--admin-card-shadow)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90">
      {/* Fondo sutil: malla/grid y gradiente */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--admin-accent) 1px, transparent 1px),
            linear-gradient(to bottom, var(--admin-accent) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="pointer-events-none absolute -top-1/2 left-1/2 h-[80vh] w-[80vw] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-20"
        style={{
          background: `radial-gradient(ellipse at center, var(--admin-accent) 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-8 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--admin-accent)]/30 bg-[var(--admin-accent)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--admin-accent)]">
          Fase {phase}
        </span>
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50 shadow-lg dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-900">
          <Icon
            className="h-10 w-10 text-[var(--admin-accent)]"
            strokeWidth={1.5}
          />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-md text-lg text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
        <div className="mt-10 flex items-center gap-2 rounded-full bg-zinc-100 px-5 py-2.5 dark:bg-zinc-800/80">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--admin-accent)] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--admin-accent)]" />
          </span>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Próximamente
          </span>
        </div>
      </div>

      {/* Timeline de fases */}
      <div className="relative z-10 mt-16 flex w-full max-w-xl items-center justify-center gap-2 px-6">
        {phases.map((p) => (
          <div
            key={p}
            className={`flex flex-1 items-center gap-1 ${
              p === 1 ? "flex-initial" : ""
            }`}
          >
            {p > 1 && (
              <div
                className={`h-0.5 flex-1 min-w-[12px] rounded-full ${
                  p <= phase
                    ? "bg-[var(--admin-accent)]/50"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            )}
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                p < phase
                  ? "bg-[var(--admin-accent)] text-white"
                  : p === phase
                    ? "border-2 border-[var(--admin-accent)] bg-white text-[var(--admin-accent)] dark:bg-zinc-900"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
              }`}
              title={p === 1 ? "Docking / Muellaje" : `Fase ${p}`}
            >
              {p === 1 ? "✓" : p}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
