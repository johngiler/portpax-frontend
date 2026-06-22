"use client";

import { MapPin, Plus } from "lucide-react";
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
  createPort,
  deletePort,
  fetchPorts,
  updatePort,
} from "@/services/catalogs/portService";
import type { Port } from "@/types/catalog";
import { portDisplayName, portStatusLabel } from "@/types/catalog";
import PortFormModal, { type PortFormMode, type PortFormSubmitPayload } from "./PortFormModal";
import PortDetailModal from "./PortDetailModal";
import PortsViewSkeleton from "./PortsViewSkeleton";

const PAGE_SIZE = 20;

export default function PortsView() {
  const [ports, setPorts] = useState<Port[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<PortFormMode>("create");
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [detailPort, setDetailPort] = useState<Port | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPorts = useCallback(async () => {
    setLoading(true);
    setViewError(null);
    try {
      const data = await fetchPorts({ page, search: appliedSearch });
      setPorts(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setViewError(
        err instanceof ApiError ? err.message : "No se pudieron cargar los puertos.",
      );
      setPorts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch]);

  useEffect(() => {
    loadPorts();
  }, [loadPorts]);

  function openCreate() {
    setModalMode("create");
    setEditingPort(null);
    setModalOpen(true);
  }

  function openEdit(port: Port) {
    setModalMode("edit");
    setEditingPort(port);
    setModalOpen(true);
  }

  function openDetail(port: Port) {
    setDetailPort(port);
    setDetailOpen(true);
  }

  async function handleSave({ payload, logoFile, removeLogo }: PortFormSubmitPayload) {
    setSaving(true);
    setViewError(null);
    const logoOptions = { logoFile, removeLogo };
    try {
      if (modalMode === "create") {
        await createPort(payload, logoOptions);
      } else if (editingPort) {
        await updatePort(editingPort.id, payload, logoOptions);
      }
      setModalOpen(false);
      await loadPorts();
    } catch (err) {
      setViewError(
        err instanceof ApiError ? err.message : "No se pudo guardar el puerto.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(port: Port) {
    setViewError(null);
    try {
      await deletePort(port.id);
      await loadPorts();
    } catch (err) {
      setViewError(
        err instanceof ApiError ? err.message : "No se pudo eliminar el puerto.",
      );
    }
  }

  function applyFilters() {
    setPage(1);
    setAppliedSearch(search);
  }

  if (loading && ports.length === 0 && !viewError) {
    return <PortsViewSkeleton />;
  }

  return (
    <>
      <FilterSidebarContent>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Filtros
        </p>
        <FormField
          label="Buscar"
          name="port_search"
          value={search}
          onChange={(v) => setSearch(String(v))}
          placeholder="Nombre, código, país…"
        />
        <DefaultButton type="button" onClick={applyFilters} className="w-full">
          Aplicar
        </DefaultButton>
      </FilterSidebarContent>

      <ViewPageHeader
        icon={MapPin}
        title="Puertos"
        description="Catálogo de puertos ITM — muelles y posiciones (docs/muelles_especificaciones)."
        actions={
          <DefaultButton type="button" onClick={openCreate}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nuevo puerto
            </span>
          </DefaultButton>
        }
      />

      {viewError && <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />}

      <MainTable>
        <table className="w-full min-w-[42rem]">
          <MainTableHeader>
            <MainTableTh className="w-16">Logo</MainTableTh>
            <MainTableTh>Puerto</MainTableTh>
            <MainTableTh>País</MainTableTh>
            <MainTableTh>Estado</MainTableTh>
            <MainTableTh>Posiciones</MainTableTh>
            <MainTableTh>Calado mín.</MainTableTh>
            <MainTableTh className="text-center">Acciones</MainTableTh>
          </MainTableHeader>
          <MainTableBody>
            {loading ? (
              <MainTableEmpty colSpan={7}>Cargando…</MainTableEmpty>
            ) : ports.length === 0 ? (
              <MainTableEmpty colSpan={7}>
                {appliedSearch
                  ? "Ningún puerto coincide con los filtros."
                  : "No hay puertos registrados."}
              </MainTableEmpty>
            ) : (
              ports.map((port) => (
                <MainTableRow key={port.id}>
                  <MainTableTd>
                    {port.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={port.logo}
                        alt=""
                        className="mx-auto h-10 w-10 rounded object-contain"
                      />
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </MainTableTd>
                  <MainTableTd>{portDisplayName(port)}</MainTableTd>
                  <MainTableTd>{port.country}</MainTableTd>
                  <MainTableTd>{portStatusLabel(port.status)}</MainTableTd>
                  <MainTableTd>
                    {port.position_codes.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => openDetail(port)}
                        className="cursor-pointer font-mono text-xs text-[var(--admin-accent)] hover:underline"
                      >
                        {port.position_codes.join(", ")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openDetail(port)}
                        className="cursor-pointer text-xs text-[var(--admin-accent)] hover:underline"
                      >
                        Gestionar
                      </button>
                    )}
                  </MainTableTd>
                  <MainTableTd>
                    {port.min_berth_draft_m != null ? `${port.min_berth_draft_m} m` : "—"}
                  </MainTableTd>
                  <MainTableTd className="text-center">
                    <TableActionButtons
                      onView={() => openDetail(port)}
                      onEdit={() => openEdit(port)}
                      onDelete={() => handleDelete(port)}
                      deleteLabel={`el puerto ${port.name}`}
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
          label="puertos"
        />
      </MainTable>

      <PortDetailModal
        open={detailOpen}
        port={detailPort}
        onClose={() => setDetailOpen(false)}
      />

      <PortFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editingPort}
        saving={saving}
        onClose={() => !saving && setModalOpen(false)}
        onSubmit={handleSave}
      />
    </>
  );
}
