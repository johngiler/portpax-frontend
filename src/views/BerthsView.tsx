"use client";

import { Anchor, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Berth } from "@/lib/docking";
import { deleteBerth, getBerths, getPorts } from "@/lib/docking";
import MainTable, {
  MainTableBody,
  MainTableEmpty,
  MainTableHeader,
  MainTableRow,
  MainTableTd,
  MainTableTh,
} from "@/components/tables/MainTable";
import BerthFormModal from "@/components/modals/BerthFormModal";
import TablePageSkeleton from "@/components/tables/TablePageSkeleton";
import TableActionButtons from "@/components/tables/TableActionButtons";
import TablePagination from "@/components/tables/TablePagination";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";

export default function BerthsView() {
  const PAGE_SIZE = 20;
  const [list, setList] = useState<Berth[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [ports, setPorts] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Berth | null>(null);
  const [filterPort, setFilterPort] = useState<number | "">("");
  const [filterName, setFilterName] = useState("");

  const fetchList = useCallback((p?: number) => {
    const pageToFetch = p ?? page;
    getBerths({ page: pageToFetch, page_size: PAGE_SIZE })
      .then((r) => {
        setList(r.results);
        setTotalCount(r.count);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [page]);

  useEffect(() => {
    setLoading(true);
    getBerths({ page, page_size: PAGE_SIZE })
      .then((r) => {
        setList(r.results);
        setTotalCount(r.count);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    getPorts({ page_size: 100 })
      .then((r) => setPorts(r.results.map((x) => ({ id: x.id, name: x.name }))))
      .catch(() => setPorts([]));
  }, []);

  const portOptions = [{ value: 0, label: "Todos" }, ...ports.map((p) => ({ value: p.id, label: p.name }))];
  const filteredList = useMemo(() => {
    let out = list;
    if (filterPort !== "" && filterPort !== 0) {
      out = out.filter((b) => b.port === filterPort);
    }
    if (filterName.trim()) {
      const q = filterName.trim().toLowerCase();
      out = out.filter((b) => b.name?.toLowerCase().includes(q));
    }
    return out;
  }, [list, filterPort, filterName]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (item: Berth) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleDelete = useCallback(
    (item: Berth) => {
      deleteBerth(item.id).then(() => fetchList()).catch((e) => setError(e instanceof Error ? e.message : "Error"));
    },
    [fetchList]
  );

  if (loading) {
    return <TablePageSkeleton columns={4} withButton />;
  }

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <Anchor className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
            Muelles
          </h1>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <FilterSidebarContent>
        <FormFieldSelect
          label="Puerto"
          name="filter_port"
          value={filterPort === "" ? 0 : filterPort}
          onChange={(v) => setFilterPort(v === 0 ? "" : (v as number))}
          options={portOptions}
          optionLabel="Todos"
          emptyValue={0 as unknown as number}
        />
        <FormField
          label="Nombre"
          name="filter_name"
          value={filterName}
          onChange={setFilterName}
          placeholder="Buscar por nombre…"
        />
      </FilterSidebarContent>
      <div>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              <Anchor className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
              Muelles
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {filteredList.length === list.length
                ? `${totalCount} muelle${totalCount !== 1 ? "s" : ""}`
                : `${filteredList.length} de ${totalCount} muelles (filtro en página)`}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary-gradient flex cursor-pointer items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105 hover:shadow-[0_8px_22px_-14px_rgba(52,120,181,0.7)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nuevo muelle
          </button>
        </div>
        <MainTable>
          <table className="w-full min-w-[theme(spacing.96)]">
            <MainTableHeader>
              <MainTableTh>Nombre</MainTableTh>
              <MainTableTh>Puerto</MainTableTh>
              <MainTableTh>Cap. PAX</MainTableTh>
              <MainTableTh className="w-28">Acciones</MainTableTh>
            </MainTableHeader>
            <MainTableBody>
              {filteredList.length === 0 ? (
                <MainTableEmpty colSpan={4}>
                  {list.length === 0 ? "No hay muelles." : "Ningún muelle coincide con los filtros."}
                </MainTableEmpty>
              ) : (
                filteredList.map((b) => (
                  <MainTableRow key={b.id}>
                    <MainTableTd className="font-medium text-zinc-900 dark:text-zinc-50">
                      {b.name}
                    </MainTableTd>
                    <MainTableTd>{b.port_name}</MainTableTd>
                    <MainTableTd className="tabular-nums">{b.capacity_pax ?? "—"}</MainTableTd>
                    <MainTableTd>
                      <TableActionButtons
                        onView={() => openEdit(b)}
                        onEdit={() => openEdit(b)}
                        onDelete={() => handleDelete(b)}
                        deleteLabel="este muelle"
                      />
                    </MainTableTd>
                  </MainTableRow>
                ))
              )}
            </MainTableBody>
          </table>
        </MainTable>
        <TablePagination
          page={page}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          label="muelles"
        />
        <BerthFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          edit={editing}
          onSuccess={fetchList}
        />
      </div>
    </>
  );
}
