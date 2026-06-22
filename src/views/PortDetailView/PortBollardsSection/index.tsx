"use client";

import { Anchor } from "lucide-react";
import { useState } from "react";
import SectionAddButton from "@/components/buttons/SectionAddButton";
import ViewSection from "@/components/layout/ViewSection";
import TableActionButtons from "@/components/tables/TableActionButtons";
import { ApiError } from "@/services/apiClient";
import {
  createPortBollard,
  deletePortBollard,
  updatePortBollard,
} from "@/services/catalogs/portBollardService";
import type { PortBollard, PortBollardPayload } from "@/types/catalog";
import { bollardTypeLabel } from "@/types/catalog";
import BollardFormModal, { type BollardFormMode } from "./BollardFormModal";

type PortBollardsSectionProps = {
  portId: number;
  bollards: PortBollard[];
  total: number;
  onChange: () => Promise<void>;
};

export default function PortBollardsSection({
  portId,
  bollards,
  total,
  onChange,
}: PortBollardsSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<BollardFormMode>("create");
  const [editing, setEditing] = useState<PortBollard | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(bollard: PortBollard) {
    setFormMode("edit");
    setEditing(bollard);
    setFormOpen(true);
  }

  async function handleSave(payload: PortBollardPayload) {
    setSaving(true);
    setError(null);
    try {
      if (formMode === "create") {
        await createPortBollard({ ...payload, port: portId });
      } else if (editing) {
        await updatePortBollard(editing.id, { ...payload, port: portId });
      }
      setFormOpen(false);
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la bita.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(bollard: PortBollard) {
    setError(null);
    try {
      await deletePortBollard(bollard.id);
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar la bita.");
    }
  }

  return (
    <>
      <ViewSection
        icon={Anchor}
        title="Inventario de bitas"
        description="Cantidad de bitas por capacidad y tipo."
        actions={<SectionAddButton label="Agregar bita" onClick={openCreate} />}
      >
        {error && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        {bollards.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin bitas registradas para este puerto.</p>
        ) : (
          <>
            <div className="mb-4 overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800">
              <table className="w-full min-w-[32rem] text-sm">
                <thead>
                  <tr className="border-b border-zinc-200/80 bg-zinc-50/80 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/50">
                    <th className="px-4 py-3">Capacidad</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Cantidad</th>
                    <th className="px-4 py-3">Notas</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {bollards.map((b) => (
                    <tr
                      key={b.id}
                      className={`border-b border-zinc-100 last:border-0 dark:border-zinc-800/80 ${!b.is_active ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium">{b.capacity_t} t</td>
                      <td className="px-4 py-3">
                        {b.label || bollardTypeLabel(b.bollard_type)}
                      </td>
                      <td className="px-4 py-3 font-mono">{b.quantity}</td>
                      <td className="px-4 py-3 text-zinc-500">{b.notes || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <TableActionButtons
                          onEdit={() => openEdit(b)}
                          onDelete={() => handleDelete(b)}
                          deleteLabel={`${b.quantity} bitas de ${b.capacity_t} t`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-zinc-500">Total activas: {total} bitas</p>
          </>
        )}
      </ViewSection>

      <BollardFormModal
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
