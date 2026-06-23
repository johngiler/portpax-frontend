"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import MainTable, {
  MainTableBody,
  MainTableEmpty,
  MainTableHeader,
  MainTableRow,
  MainTableTd,
  MainTableTh,
} from "@/components/tables/MainTable";
import TableActionButtons from "@/components/tables/TableActionButtons";
import Modal from "@/components/ui/Modal";
import { ApiError } from "@/services/apiClient";
import {
  createPosition,
  deletePosition,
  fetchPositions,
  updatePosition,
} from "@/services/catalogs/positionService";
import type { Port, Position, PositionPayload } from "@/types/catalog";
import { portDisplayName, positionTypeLabel } from "@/types/catalog";
import { positionDisplayCode } from "@/lib/positionCode";
import PositionFormModal, { type PositionFormMode } from "@/views/PositionsView/PositionFormModal";

type PortDetailModalProps = {
  open: boolean;
  port: Port | null;
  onClose: () => void;
};

export default function PortDetailModal({ open, port, onClose }: PortDetailModalProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<PositionFormMode>("create");
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPositions = useCallback(async () => {
    if (!port) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPositions({ port: port.id, pageSize: 100 });
      setPositions(data.results);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudieron cargar las posiciones.",
      );
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [port]);

  useEffect(() => {
    if (open && port) loadPositions();
    if (!open) {
      setPositions([]);
      setError(null);
      setFormOpen(false);
    }
  }, [open, port, loadPositions]);

  function openCreate() {
    setFormMode("create");
    setEditingPosition(null);
    setFormOpen(true);
  }

  function openEdit(position: Position) {
    setFormMode("edit");
    setEditingPosition(position);
    setFormOpen(true);
  }

  async function handleSave(payload: PositionPayload) {
    if (!port) return;
    setSaving(true);
    try {
      if (formMode === "create") {
        await createPosition(payload);
      } else if (editingPosition) {
        await updatePosition(editingPosition.id, payload);
      }
      setFormOpen(false);
      await loadPositions();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(position: Position) {
    setError(null);
    try {
      await deletePosition(position.id);
      await loadPositions();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar la posición.");
    }
  }

  if (!port) return null;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={portDisplayName(port)}
        panelClassName="max-w-3xl"
      >
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Posiciones operativas del puerto (P1, P2, fondeos, etc.).
        </p>

        {error && (
          <p className="mb-4 text-sm font-medium text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="mb-3 flex justify-end">
          <DefaultButton type="button" onClick={openCreate}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nueva posición
            </span>
          </DefaultButton>
        </div>

        <MainTable>
          <table className="w-full min-w-[36rem]">
            <MainTableHeader>
              <MainTableTh>Código</MainTableTh>
              <MainTableTh>Tipo</MainTableTh>
              <MainTableTh>Muelle</MainTableTh>
              <MainTableTh>Eslora</MainTableTh>
              <MainTableTh>Calado</MainTableTh>
              <MainTableTh>Bitas</MainTableTh>
              <MainTableTh>Defensas</MainTableTh>
              <MainTableTh>Estado</MainTableTh>
              <MainTableTh className="text-center">Acciones</MainTableTh>
            </MainTableHeader>
            <MainTableBody>
              {loading ? (
                <MainTableEmpty colSpan={8}>Cargando…</MainTableEmpty>
              ) : positions.length === 0 ? (
                <MainTableEmpty colSpan={8}>Sin posiciones registradas.</MainTableEmpty>
              ) : (
                positions.map((position) => (
                  <MainTableRow key={position.id}>
                    <MainTableTd className="font-mono font-medium">
                      <div>{positionDisplayCode(position)}</div>
                      {position.is_combined && position.component_positions.length > 0 && (
                        <div className="mt-0.5 text-[11px] font-normal text-zinc-500">
                          {position.component_positions.map((p) => p.code).join(" + ")}
                        </div>
                      )}
                    </MainTableTd>
                    <MainTableTd>{positionTypeLabel(position.position_type)}</MainTableTd>
                    <MainTableTd>{position.berth_code || "—"}</MainTableTd>
                    <MainTableTd>
                      {position.max_loa_m != null ? `${position.max_loa_m} m` : "—"}
                    </MainTableTd>
                    <MainTableTd>
                      {position.min_draft_m != null ? `${position.min_draft_m} m` : "—"}
                    </MainTableTd>
                    <MainTableTd>{position.bollard_count ?? "—"}</MainTableTd>
                    <MainTableTd>{position.fender_count ?? "—"}</MainTableTd>
                    <MainTableTd>{position.is_active ? "Activa" : "Inactiva"}</MainTableTd>
                    <MainTableTd className="text-center">
                      <TableActionButtons
                        onEdit={() => openEdit(position)}
                        onDelete={() => handleDelete(position)}
                        deleteLabel={`la posición ${positionDisplayCode(position)}`}
                      />
                    </MainTableTd>
                  </MainTableRow>
                ))
              )}
            </MainTableBody>
          </table>
        </MainTable>
      </Modal>

      <PositionFormModal
        open={formOpen}
        mode={formMode}
        lockedPortId={port.id}
        lockedPortCode={port.code}
        initial={editingPosition}
        saving={saving}
        onClose={() => !saving && setFormOpen(false)}
        onSubmit={handleSave}
      />
    </>
  );
}
