"use client";

import { Warehouse } from "lucide-react";
import { useState } from "react";
import SectionAddButton from "@/components/buttons/SectionAddButton";
import ViewSection from "@/components/layout/ViewSection";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { syncCoverImage } from "@/lib/syncCoverImage";
import { createBerth, deleteBerth, updateBerth } from "@/services/catalogs/berthService";
import { createBerthImage, deleteBerthImage } from "@/services/catalogs/berthImageService";
import type { BerthDetail } from "@/types/catalog";
import BerthCard from "./BerthCard";
import BerthFormModal, {
  type BerthFormMode,
  type BerthFormSubmitPayload,
} from "./BerthFormModal";

type PortBerthsSectionProps = {
  portId: number;
  berths: BerthDetail[];
  onChange: () => Promise<void>;
};

export default function PortBerthsSection({ portId, berths, onChange }: PortBerthsSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<BerthFormMode>("create");
  const [editing, setEditing] = useState<BerthDetail | null>(null);
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

  async function handleSave({ payload, imageFile, removeImage }: BerthFormSubmitPayload) {
    setSaving(true);
    try {
      const body = { ...payload, port: portId };
      if (formMode === "create") {
        const created = await createBerth(body);
        await syncCoverImage({
          entityId: created.id,
          images: [],
          imageFile,
          removeImage,
          createImage: createBerthImage,
          deleteImage: deleteBerthImage,
        });
      } else if (editing) {
        await updateBerth(editing.id, body);
        await syncCoverImage({
          entityId: editing.id,
          images: editing.images ?? [],
          coverUrl: editing.cover_image,
          imageFile,
          removeImage,
          createImage: createBerthImage,
          deleteImage: deleteBerthImage,
        });
      }
      setFormOpen(false);
      await onChange();
    } catch (err) {
      throw err;
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
      setError(getApiErrorMessage(err, "No se pudo eliminar el muelle."));
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
        <FormErrorAlert message={error} className="mb-3" />

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
