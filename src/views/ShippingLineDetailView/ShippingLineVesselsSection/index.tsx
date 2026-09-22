"use client";

import { Ship } from "lucide-react";
import { useMemo, useState } from "react";
import SectionAddButton from "@/components/buttons/SectionAddButton";
import ViewSection from "@/components/layout/ViewSection";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { createVessel, deleteVessel, updateVessel } from "@/services/catalogs/vesselService";
import type { ShippingLineDetail, Vessel } from "@/types/cruise";
import type { VesselFormSubmitPayload } from "@/views/ShippingLineDetailView/VesselFormModal";
import VesselFormModal, { type VesselFormMode } from "@/views/ShippingLineDetailView/VesselFormModal";
import VesselCard from "./VesselCard";

type ShippingLineVesselsSectionProps = {
  line: ShippingLineDetail;
  onChange: () => Promise<void>;
  canWrite?: boolean;
};

export default function ShippingLineVesselsSection({
  line,
  onChange,
  canWrite = true,
}: ShippingLineVesselsSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<VesselFormMode>("create");
  const [editing, setEditing] = useState<Vessel | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withoutArrivals, setWithoutArrivals] = useState(false);

  const vessels = useMemo(() => {
    const all = line.vessels ?? [];
    if (!withoutArrivals) return all;
    return all.filter((v) => !(v.arrived_ports && v.arrived_ports.length > 0));
  }, [line.vessels, withoutArrivals]);

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
      throw err;
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
      setError(getApiErrorMessage(err, "No se pudo eliminar el barco."));
    }
  }

  return (
    <>
      <ViewSection
        icon={Ship}
        title="Barcos"
        description="Flota asociada a esta naviera — LOA, capacidad y datos operativos."
        actions={
          canWrite ? (
            <SectionAddButton label="Agregar barco" onClick={openCreate} />
          ) : undefined
        }
      >
        <FormErrorAlert message={error} className="mb-3" />

        <label className="mb-3 flex cursor-pointer items-center gap-2 text-xs text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={withoutArrivals}
            onChange={(e) => setWithoutArrivals(e.target.checked)}
            className="rounded border-zinc-300"
          />
          Sin arribos?
        </label>

        {vessels.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {withoutArrivals
              ? "Ningún barco sin arribos registrados."
              : "Sin barcos registrados para esta naviera."}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vessels.map((vessel) => (
              <VesselCard
                key={vessel.id}
                vessel={vessel}
                canWrite={canWrite}
                onEdit={() => openEdit(vessel)}
                onDelete={() => handleDelete(vessel)}
              />
            ))}
          </div>
        )}
      </ViewSection>

      {canWrite ? (
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
      ) : null}
    </>
  );
}
