"use client";

import { Shield } from "lucide-react";
import { useMemo, useState } from "react";
import SectionAddButton from "@/components/buttons/SectionAddButton";
import ViewSection from "@/components/layout/ViewSection";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import TableActionButtons from "@/components/tables/TableActionButtons";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  createPortFender,
  deletePortFender,
  updatePortFender,
} from "@/services/catalogs/portFenderService";
import type { PortFender, PortFenderPayload } from "@/types/catalog";
import { DEFAULT_FENDER_TYPE_OPTIONS } from "@/types/catalog";
import FenderFormModal, { type FenderFormMode } from "./FenderFormModal";
import type { FenderTypeOption } from "./FenderTypeSelect";

type PortFendersSectionProps = {
  portId: number;
  fenders: PortFender[];
  total: number;
  onChange: () => Promise<void>;
  canWrite?: boolean;
};

function buildTypeOptions(fenders: PortFender[]): FenderTypeOption[] {
  const labels = [...DEFAULT_FENDER_TYPE_OPTIONS, ...fenders.map((f) => f.fender_type)];
  const unique = [...new Set(labels.map((label) => label.trim()).filter(Boolean))];
  unique.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "accent" }));
  return unique.map((label) => ({ value: label, label }));
}

export default function PortFendersSection({
  portId,
  fenders,
  total,
  onChange,
  canWrite = true,
}: PortFendersSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FenderFormMode>("create");
  const [editing, setEditing] = useState<PortFender | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typeOptions = useMemo(() => buildTypeOptions(fenders), [fenders]);

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(fender: PortFender) {
    setFormMode("edit");
    setEditing(fender);
    setFormOpen(true);
  }

  async function handleSave(payload: PortFenderPayload) {
    setSaving(true);
    try {
      if (formMode === "create") {
        await createPortFender({ ...payload, port: portId });
      } else if (editing) {
        await updatePortFender(editing.id, { ...payload, port: portId });
      }
      setFormOpen(false);
      await onChange();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(fender: PortFender) {
    setError(null);
    try {
      await deletePortFender(fender.id);
      await onChange();
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo eliminar la defensa."));
    }
  }

  return (
    <>
      <ViewSection
        icon={Shield}
        title="Inventario de defensas"
        description="Cantidad de defensas por tipo."
        actions={
          canWrite ? (
            <SectionAddButton label="Agregar defensa" onClick={openCreate} />
          ) : undefined
        }
      >
        <FormErrorAlert message={error} className="mb-3" />

        {fenders.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin defensas registradas para este puerto.</p>
        ) : (
          <>
            <div className="mb-4 overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800">
              <table className="w-full min-w-[28rem] text-sm">
                <thead>
                  <tr className="border-b border-zinc-200/80 bg-zinc-50/80 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/50">
                    <th className="px-4 py-3">Cantidad</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Notas</th>
                    {canWrite ? (
                      <th className="px-4 py-3 text-center">Acciones</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {fenders.map((fender) => (
                    <tr
                      key={fender.id}
                      className={`border-b border-zinc-100 last:border-0 dark:border-zinc-800/80 ${!fender.is_active ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3 font-mono">{fender.quantity}</td>
                      <td className="px-4 py-3 font-medium">{fender.fender_type}</td>
                      <td className="px-4 py-3 text-zinc-500">{fender.notes || "—"}</td>
                      {canWrite ? (
                        <td className="px-4 py-3 text-center">
                          <TableActionButtons
                            onEdit={() => openEdit(fender)}
                            onDelete={() => handleDelete(fender)}
                            deleteLabel={`${fender.quantity} defensas ${fender.fender_type}`}
                          />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-zinc-500">Total activas: {total} defensas</p>
          </>
        )}
      </ViewSection>

      {canWrite ? (
        <FenderFormModal
          open={formOpen}
          mode={formMode}
          portId={portId}
          typeOptions={typeOptions}
          initial={editing}
          saving={saving}
          onClose={() => !saving && setFormOpen(false)}
          onSubmit={handleSave}
        />
      ) : null}
    </>
  );
}
