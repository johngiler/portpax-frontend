"use client";

import { RefreshCw, Sparkles, X } from "lucide-react";
import { useAppUpdate } from "@/contexts/AppUpdateContext";

/**
 * Bottom-left update toast for authenticated shell only.
 * Dismiss: X, Actualizar (reload), or browser reload.
 */
export default function AppUpdateBanner() {
  const { updateAvailable, dismissUpdate, reloadForUpdate } = useAppUpdate();

  if (!updateAvailable) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-4 z-[80] max-w-[min(100vw-2rem,22rem)] sm:bottom-6 sm:left-6"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--admin-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] shadow-[0_18px_50px_-20px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="relative px-4 pb-4 pt-3.5">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,var(--admin-accent),transparent)]" />
          <div className="mb-3 flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--admin-accent)_16%,transparent)] text-[var(--admin-accent)]">
              <Sparkles className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
                Actualización disponible
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--admin-muted)]">
                Hay una versión nueva de PortPax. Recargá para aplicarla.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissUpdate}
              className="rounded-lg p-1.5 text-[var(--admin-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-[var(--foreground)]"
              aria-label="Cerrar aviso de actualización"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={reloadForUpdate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--admin-accent)] px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-105 active:scale-[0.99]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
}
