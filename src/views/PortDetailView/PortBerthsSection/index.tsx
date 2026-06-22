"use client";

import { Plus, Warehouse } from "lucide-react";
import { useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import ViewSection from "@/components/layout/ViewSection";
import TableActionButtons from "@/components/tables/TableActionButtons";
import { ApiError } from "@/services/apiClient";
import { createBerth, deleteBerth, updateBerth } from "@/services/catalogs/berthService";
import type { Berth, BerthPayload } from "@/types/catalog";
import { formatMeters } from "@/types/catalog";
import BerthFormModal, { type BerthFormMode } from "./BerthFormModal";

type PortBerthsSectionProps = {
  portId: number;
  berths: Berth[];
  onChange: () => Promise<void>;
};

export default function PortBerthsSection({ portId, berths, onChange }: PortBerthsSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<BerthFormMode>("create");
  const [editing, setEditing] = useState<Berth | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(berth: Berth) {
    setFormMode("edit");
    setEditing(berth);
    setFormOpen(true);
  }

  async function handleSave(payload: BerthPayload) {
    setSaving(true);
    setError(null);
    try {
      if (formMode === "create") {
        await createBerth({ ...payload, port: portId });
      } else if (editing) {
        await updateBerth(editing.id, { ...payload, port: portId });
      }
      setFormOpen(false);
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el muelle.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(berth: Berth) {
    setError(null);
    try {
      await deleteBerth(berth.id);
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar el muelle.");
    }
  }

  return (
    <>
      <ViewSection
        icon={Warehouse}
        title="Muelles"
        description="Muelles registrados con dimensiones y calado."
      >
        {error && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="mb-4 flex justify-end">
          <DefaultButton type="button" onClick={openCreate}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Agregar muelle
            </span>
          </DefaultButton>
        </div>

        {berths.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin muelles registrados.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {berths.map((berth) => (
              <article
                key={berth.id}
                className={`rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40 ${!berth.is_active ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-semibold text-[var(--admin-accent)]">
                      {berth.code}
                    </p>
                    <h3 className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">
                      {berth.name || berth.code}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {!berth.is_active && (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-medium uppercase dark:bg-zinc-800">
                        Inactivo
                      </span>
                    )}
                    <TableActionButtons
                      onEdit={() => openEdit(berth)}
                      onDelete={() => handleDelete(berth)}
                      deleteLabel={`el muelle ${berth.code}`}
                    />
                  </div>
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
              </article>
            ))}
          </div>
        )}
      </ViewSection>

      <BerthFormModal
        open={formOpen}
        mode={formMode}
        portId={portId}
        initial={editing}
        saving={saving}
        onClose={() => !saving && setFormOpen(false)}
        onSubmit={handleSave}
      />
    </>
  );
}
