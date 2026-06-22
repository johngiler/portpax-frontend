"use client";

import { Ship } from "lucide-react";
import { useState } from "react";
import SectionAddButton from "@/components/buttons/SectionAddButton";
import ViewSection from "@/components/layout/ViewSection";
import { ApiError } from "@/services/apiClient";
import { createVessel, deleteVessel, updateVessel } from "@/services/catalogs/vesselService";
import type { ShippingLineDetail, Vessel } from "@/types/cruise";
import type { VesselFormSubmitPayload } from "@/views/ShippingLineDetailView/VesselFormModal";
import VesselFormModal, { type VesselFormMode } from "@/views/ShippingLineDetailView/VesselFormModal";
import VesselCard from "./VesselCard";

type ShippingLineVesselsSectionProps = {
  line: ShippingLineDetail;
  onChange: () => Promise<void>;
};

export default function ShippingLineVesselsSection({
  line,
  onChange,
}: ShippingLineVesselsSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<VesselFormMode>("create");
  const [editing, setEditing] = useState<Vessel | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vessels = line.vessels ?? [];

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(vessel: Vessel) {
    setFormMode("edit");
    setEditing(vessel);
    setFormOpen(true);
  }

  async function handleSave({ payload, logoFile, removeLogo }: VesselFormSubmitPayload) {
    setSaving(true);
    setError(null);
    try {
      const body = { ...payload, shipping_line: line.id };
      if (formMode === "create") {
        await createVessel(body, { logoFile, removeLogo });
      } else if (editing) {
        await updateVessel(editing.id, body, { logoFile, removeLogo });
      }
      setFormOpen(false);
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el barco.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(vessel: Vessel) {
    setError(null);
    try {
      await deleteVessel(vessel.id);
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar el barco.");
    }
  }

  return (
    <>
      <ViewSection
        icon={Ship}
        title="Barcos"
        description="Flota asociada a esta naviera — LOA, capacidad y datos operativos."
        actions={<SectionAddButton label="Agregar barco" onClick={openCreate} />}
      >
        {error && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        {vessels.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin barcos registrados para esta naviera.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vessels.map((vessel) => (
              <VesselCard
                key={vessel.id}
                vessel={vessel}
                onEdit={() => openEdit(vessel)}
                onDelete={() => handleDelete(vessel)}
              />
            ))}
          </div>
        )}
      </ViewSection>

      <VesselFormModal
        open={formOpen}
        mode={formMode}
        initial={editing}
        lockedShippingLineId={line.id}
        lockedShippingLineName={line.name}
        saving={saving}
        onClose={() => !saving && setFormOpen(false)}
        onSubmit={handleSave}
      />
    </>
  );
}
