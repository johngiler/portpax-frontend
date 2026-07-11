"use client";

import { LayoutGrid, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import FilterActions from "@/components/layout/FilterActions";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import MainTable, {
  MainTableBody,
  MainTableEmpty,
  MainTableHeader,
  MainTableRow,
  MainTableTd,
  MainTableTh,
} from "@/components/tables/MainTable";
import TableActionButtons from "@/components/tables/TableActionButtons";
import TablePagination from "@/components/tables/TablePagination";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { positionDisplayCode } from "@/lib/positionCode";
import { syncCoverImage } from "@/lib/syncCoverImage";
import { fetchPorts } from "@/services/catalogs/portService";
import {
  createPosition,
  deletePosition,
  fetchPositions,
  updatePosition,
} from "@/services/catalogs/positionService";
import { createPositionImage, deletePositionImage } from "@/services/catalogs/positionImageService";
import type { Position } from "@/types/catalog";
import { portDisplayName, positionTypeLabel } from "@/types/catalog";
import PositionFormModal, {
  type PositionFormMode,
  type PositionFormSubmitPayload,
} from "./PositionFormModal";
import PositionsViewSkeleton from "./PositionsViewSkeleton";

const PAGE_SIZE = 20;

export default function PositionsView() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [portFilter, setPortFilter] = useState(0);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedPortFilter, setAppliedPortFilter] = useState(0);
  const [portOptions, setPortOptions] = useState<{ value: number; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<PositionFormMode>("create");
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPorts({ pageSize: 100 })
      .then((data) =>
        setPortOptions(
          data.results.map((p) => ({ value: p.id, label: portDisplayName(p) })),
        ),
      )
      .catch(() => setPortOptions([]));
  }, []);

  const loadPositions = useCallback(async () => {
    setLoading(true);
    setViewError(null);
    try {
      const data = await fetchPositions({
        page,
        search: appliedSearch,
        port: appliedPortFilter > 0 ? appliedPortFilter : undefined,
      });
      setPositions(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudieron cargar las posiciones."),
      );
      setPositions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, appliedPortFilter]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  function openCreate() {
    setModalMode("create");
    setEditingPosition(null);
    setModalOpen(true);
  }

  function openEdit(position: Position) {
    setModalMode("edit");
    setEditingPosition(position);
    setModalOpen(true);
  }

  async function handleSave({ payload, imageFile, removeImage }: PositionFormSubmitPayload) {
    setSaving(true);
    try {
      if (modalMode === "create") {
        const created = await createPosition(payload);
        await syncCoverImage({
          entityId: created.id,
          images: [],
          imageFile,
          removeImage,
          createImage: createPositionImage,
          deleteImage: deletePositionImage,
        });
      } else if (editingPosition) {
        await updatePosition(editingPosition.id, payload);
        await syncCoverImage({
          entityId: editingPosition.id,
          images: [],
          imageFile,
          removeImage,
          createImage: createPositionImage,
          deleteImage: deletePositionImage,
        });
      }
      setModalOpen(false);
      await loadPositions();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(position: Position) {
    setViewError(null);
    try {
      await deletePosition(position.id);
      await loadPositions();
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudo eliminar la posición."),
      );
    }
  }

  function applyFilters() {
    setPage(1);
    setAppliedSearch(search);
    setAppliedPortFilter(portFilter);
  }

  function clearFilters() {
    setSearch("");
    setPortFilter(0);
    setAppliedSearch("");
    setAppliedPortFilter(0);
    setPage(1);
  }

  const canClearFilters =
    Boolean(search.trim()) ||
    portFilter > 0 ||
    Boolean(appliedSearch) ||
    appliedPortFilter > 0;

  if (loading && positions.length === 0 && !viewError) {
    return <PositionsViewSkeleton />;
  }

  return (
    <>
      <FilterSidebarContent>
        <FormField
          label="Buscar"
          name="position_search"
          value={search}
          onChange={(v) => setSearch(String(v))}
          placeholder="Código, puerto, muelle…"
          compact
        />
        <FormFieldSelect<number>
          label="Puerto"
          name="position_port_filter"
          value={portFilter}
          onChange={setPortFilter}
          options={portOptions}
          optionLabel="Todos los puertos"
          emptyValue={0}
          compact
        />
        <FilterActions
          onApply={applyFilters}
          onClear={clearFilters}
          canClear={canClearFilters}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={LayoutGrid}
        title="Posiciones"
        description="Slots operativos por puerto — P1, P2, fondeos (atraque y booking)."
        actions={
          <DefaultButton type="button" onClick={openCreate}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nueva posición
            </span>
          </DefaultButton>
        }
      />

      {viewError && <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />}

      <MainTable>
        <table className="w-full min-w-[52rem]">
          <MainTableHeader>
            <MainTableTh>Código</MainTableTh>
            <MainTableTh>Puerto</MainTableTh>
            <MainTableTh>Tipo</MainTableTh>
            <MainTableTh>Muelle</MainTableTh>
            <MainTableTh>Eslora</MainTableTh>
            <MainTableTh>Calado</MainTableTh>
            <MainTableTh>Estado</MainTableTh>
            <MainTableTh className="text-center">Acciones</MainTableTh>
          </MainTableHeader>
          <MainTableBody>
            {loading ? (
              <MainTableEmpty colSpan={8}>Cargando…</MainTableEmpty>
            ) : positions.length === 0 ? (
              <MainTableEmpty colSpan={8}>
                {appliedSearch || appliedPortFilter
                  ? "Ninguna posición coincide con los filtros."
                  : "No hay posiciones registradas."}
              </MainTableEmpty>
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
                  <MainTableTd>{position.port_name}</MainTableTd>
                  <MainTableTd>{positionTypeLabel(position.position_type)}</MainTableTd>
                  <MainTableTd>{position.berth_code || "—"}</MainTableTd>
                  <MainTableTd>
                    {position.max_loa_m != null ? `${position.max_loa_m} m` : "—"}
                  </MainTableTd>
                  <MainTableTd>
                    {position.min_draft_m != null ? `${position.min_draft_m} m` : "—"}
                  </MainTableTd>
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
        <TablePagination
          page={page}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          label="posiciones"
        />
      </MainTable>

      <PositionFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editingPosition}
        saving={saving}
        onClose={() => !saving && setModalOpen(false)}
        onSubmit={handleSave}
      />
    </>
  );
}
