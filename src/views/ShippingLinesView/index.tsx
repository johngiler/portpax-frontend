"use client";

import { Anchor, Plus } from "lucide-react";
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
  createShippingLine,
  deleteShippingLine,
  fetchShippingLines,
  updateShippingLine,
} from "@/services/catalogs/shippingLineService";
import type { ShippingLine, ShippingLinePayload } from "@/types/cruise";
import ShippingLineFormModal, { type ShippingLineFormMode } from "./ShippingLineFormModal";
import ShippingLinesViewSkeleton from "./ShippingLinesViewSkeleton";

const PAGE_SIZE = 20;

export default function ShippingLinesView() {
  const [lines, setLines] = useState<ShippingLine[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ShippingLineFormMode>("create");
  const [editingLine, setEditingLine] = useState<ShippingLine | null>(null);
  const [saving, setSaving] = useState(false);

  const loadLines = useCallback(async () => {
    setLoading(true);
    setViewError(null);
    try {
      const data = await fetchShippingLines({ page, search: appliedSearch });
      setLines(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setViewError(
        err instanceof ApiError ? err.message : "No se pudieron cargar las navieras.",
      );
      setLines([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch]);

  useEffect(() => {
    loadLines();
  }, [loadLines]);

  function openCreate() {
    setModalMode("create");
    setEditingLine(null);
    setModalOpen(true);
  }

  function openEdit(line: ShippingLine) {
    setModalMode("edit");
    setEditingLine(line);
    setModalOpen(true);
  }

  async function handleSave(payload: ShippingLinePayload) {
    setSaving(true);
    setViewError(null);
    try {
      if (modalMode === "create") {
        await createShippingLine(payload);
      } else if (editingLine) {
        await updateShippingLine(editingLine.id, payload);
      }
      setModalOpen(false);
      await loadLines();
    } catch (err) {
      setViewError(
        err instanceof ApiError ? err.message : "No se pudo guardar la naviera.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(line: ShippingLine) {
    setViewError(null);
    try {
      await deleteShippingLine(line.id);
      await loadLines();
    } catch (err) {
      setViewError(
        err instanceof ApiError ? err.message : "No se pudo eliminar la naviera.",
      );
    }
  }

  function applyFilters() {
    setPage(1);
    setAppliedSearch(search);
  }

  if (loading && lines.length === 0 && !viewError) {
    return <ShippingLinesViewSkeleton />;
  }

  return (
    <>
      <FilterSidebarContent>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Filtros
        </p>
        <FormField
          label="Buscar"
          name="line_search"
          value={search}
          onChange={(v) => setSearch(String(v))}
          placeholder="Marca, grupo, código…"
        />
        <DefaultButton type="button" onClick={applyFilters} className="w-full">
          Aplicar
        </DefaultButton>
      </FilterSidebarContent>

      <ViewPageHeader
        icon={Anchor}
        title="Navieras"
        description="Marcas operativas y grupo corporativo — Base_Datos_Cruceros."
        actions={
          <DefaultButton type="button" onClick={openCreate}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nueva naviera
            </span>
          </DefaultButton>
        }
      />

      {viewError && <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />}

      <MainTable>
        <table className="w-full min-w-[44rem]">
          <MainTableHeader>
            <MainTableTh>Código</MainTableTh>
            <MainTableTh>Naviera</MainTableTh>
            <MainTableTh>Grupo</MainTableTh>
            <MainTableTh>Estado</MainTableTh>
            <MainTableTh className="text-center">Acciones</MainTableTh>
          </MainTableHeader>
          <MainTableBody>
            {loading ? (
              <MainTableEmpty colSpan={5}>Cargando…</MainTableEmpty>
            ) : lines.length === 0 ? (
              <MainTableEmpty colSpan={5}>
                {appliedSearch
                  ? "Ninguna naviera coincide con los filtros."
                  : "No hay navieras registradas."}
              </MainTableEmpty>
            ) : (
              lines.map((line) => (
                <MainTableRow key={line.id}>
                  <MainTableTd className="font-mono text-xs">{line.code}</MainTableTd>
                  <MainTableTd>{line.name}</MainTableTd>
                  <MainTableTd>{line.group_name}</MainTableTd>
                  <MainTableTd>{line.is_active ? "Activa" : "Inactiva"}</MainTableTd>
                  <MainTableTd className="text-center">
                    <TableActionButtons
                      onEdit={() => openEdit(line)}
                      onDelete={() => handleDelete(line)}
                      deleteLabel={`la naviera ${line.name}`}
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
          label="navieras"
        />
      </MainTable>

      <ShippingLineFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editingLine}
        saving={saving}
        onClose={() => !saving && setModalOpen(false)}
        onSubmit={handleSave}
      />
    </>
  );
}
