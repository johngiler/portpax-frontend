"use client";

import { Warehouse } from "lucide-react";
import { useState } from "react";
import SectionAddButton from "@/components/buttons/SectionAddButton";
import ViewSection from "@/components/layout/ViewSection";
import { ApiError } from "@/services/apiClient";
import { createBerth, deleteBerth, updateBerth } from "@/services/catalogs/berthService";
import type { Berth, BerthDetail, BerthPayload } from "@/types/catalog";
import BerthCard from "./BerthCard";
import BerthFormModal, { type BerthFormMode } from "./BerthFormModal";

type PortBerthsSectionProps = {
  portId: number;
  berths: BerthDetail[];
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

  function openEdit(berth: BerthDetail) {
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

  async function handleDelete(berth: BerthDetail) {
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
        actions={<SectionAddButton label="Agregar muelle" onClick={openCreate} />}
      >
        {error && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        {berths.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin muelles registrados.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {berths.map((berth) => (
              <BerthCard
                key={berth.id}
                berth={berth}
                onEdit={() => openEdit(berth)}
                onDelete={() => handleDelete(berth)}
                onImagesChange={onChange}
              />
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
