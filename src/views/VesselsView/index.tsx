"use client";

import { Plus, Ship } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
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
import { FormField } from "@/components/ui/FormField";
import { ApiError } from "@/services/apiClient";
import {
  createVessel,
  deleteVessel,
  fetchVessels,
  updateVessel,
} from "@/services/catalogs/vesselService";
import type { Vessel, VesselPayload } from "@/types/cruise";
import VesselFormModal, { type VesselFormMode } from "./VesselFormModal";
import VesselsViewSkeleton from "./VesselsViewSkeleton";

const PAGE_SIZE = 20;

export default function VesselsView() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<VesselFormMode>("create");
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [saving, setSaving] = useState(false);

  const loadVessels = useCallback(async () => {
    setLoading(true);
    setViewError(null);
    try {
      const data = await fetchVessels({ page, search: appliedSearch });
      setVessels(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setViewError(
        err instanceof ApiError ? err.message : "No se pudieron cargar los barcos.",
      );
      setVessels([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch]);

  useEffect(() => {
    loadVessels();
  }, [loadVessels]);

  function openCreate() {
    setModalMode("create");
    setEditingVessel(null);
    setModalOpen(true);
  }

  function openEdit(vessel: Vessel) {
    setModalMode("edit");
    setEditingVessel(vessel);
    setModalOpen(true);
  }

  async function handleSave(payload: VesselPayload) {
    setSaving(true);
    setViewError(null);
    try {
      if (modalMode === "create") {
        await createVessel(payload);
      } else if (editingVessel) {
        await updateVessel(editingVessel.id, payload);
      }
      setModalOpen(false);
      await loadVessels();
    } catch (err) {
      setViewError(err instanceof ApiError ? err.message : "No se pudo guardar el barco.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(vessel: Vessel) {
    setViewError(null);
    try {
      await deleteVessel(vessel.id);
      await loadVessels();
    } catch (err) {
      setViewError(err instanceof ApiError ? err.message : "No se pudo eliminar el barco.");
    }
  }

  function applyFilters() {
    setPage(1);
    setAppliedSearch(search);
  }

  if (loading && vessels.length === 0 && !viewError) {
    return <VesselsViewSkeleton />;
  }

  return (
    <>
      <FilterSidebarContent>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Filtros
        </p>
        <FormField
          label="Buscar"
          name="vessel_search"
          value={search}
          onChange={(v) => setSearch(String(v))}
          placeholder="Barco, naviera, clase…"
        />
        <DefaultButton type="button" onClick={applyFilters} className="w-full">
          Aplicar
        </DefaultButton>
      </FilterSidebarContent>

      <ViewPageHeader
        icon={Ship}
        title="Barcos"
        description="Catálogo de cruceros — especificaciones técnicas y capacidad."
        actions={
          <DefaultButton type="button" onClick={openCreate}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nuevo barco
            </span>
          </DefaultButton>
        }
      />

      {viewError && <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />}

      <MainTable>
        <table className="w-full min-w-[52rem]">
          <MainTableHeader>
            <MainTableTh>Barco</MainTableTh>
            <MainTableTh>Naviera</MainTableTh>
            <MainTableTh>LOA</MainTableTh>
            <MainTableTh>Calado</MainTableTh>
            <MainTableTh>Pax</MainTableTh>
            <MainTableTh>Segmento</MainTableTh>
            <MainTableTh className="text-center">Acciones</MainTableTh>
          </MainTableHeader>
          <MainTableBody>
            {loading ? (
              <MainTableEmpty colSpan={7}>Cargando…</MainTableEmpty>
            ) : vessels.length === 0 ? (
              <MainTableEmpty colSpan={7}>
                {appliedSearch
                  ? "Ningún barco coincide con los filtros."
                  : "No hay barcos registrados."}
              </MainTableEmpty>
            ) : (
              vessels.map((vessel) => (
                <MainTableRow key={vessel.id}>
                  <MainTableTd className="font-medium">{vessel.name}</MainTableTd>
                  <MainTableTd>{vessel.shipping_line_name}</MainTableTd>
                  <MainTableTd>
                    {vessel.loa_m != null ? `${vessel.loa_m} m` : "—"}
                  </MainTableTd>
                  <MainTableTd>
                    {vessel.draft_m != null ? `${vessel.draft_m} m` : "—"}
                  </MainTableTd>
                  <MainTableTd>{vessel.pax_capacity ?? "—"}</MainTableTd>
                  <MainTableTd>{vessel.segment || "—"}</MainTableTd>
                  <MainTableTd className="text-center">
                    <TableActionButtons
                      onEdit={() => openEdit(vessel)}
                      onDelete={() => handleDelete(vessel)}
                      deleteLabel={`el barco ${vessel.name}`}
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
          label="barcos"
        />
      </MainTable>

      <VesselFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editingVessel}
        saving={saving}
        onClose={() => !saving && setModalOpen(false)}
        onSubmit={handleSave}
      />
    </>
  );
}
