"use client";

import { Settings } from "lucide-react";

export default function ConfigPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          <Settings className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
          Configuración
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Ajustes generales de la aplicación. Aquí podrás configurar preferencias, integraciones y más.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Las opciones de configuración se añadirán aquí en próximas actualizaciones.
        </p>
      </div>
    </div>
  );
}
