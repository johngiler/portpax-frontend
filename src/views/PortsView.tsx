"use client";

import { MapPin, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Port } from "@/lib/docking";
import { deletePort, getPorts } from "@/lib/docking";
import MainTable, {
  MainTableBody,
  MainTableEmpty,
  MainTableHeader,
  MainTableRow,
  MainTableTd,
  MainTableTh,
} from "@/components/tables/MainTable";
import PortFormModal from "@/components/modals/PortFormModal";
import TablePageSkeleton from "@/components/tables/TablePageSkeleton";
import TableActionButtons from "@/components/tables/TableActionButtons";
import TablePagination from "@/components/tables/TablePagination";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import PageHeader from "@/components/layout/PageHeader";
import { FormField } from "@/components/ui/FormField";

export default function PortsView() {
  const PAGE_SIZE = 20;
  const [ports, setPorts] = useState<Port[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Port | null>(null);
  const [filterSearch, setFilterSearch] = useState("");

  const fetchList = useCallback((p?: number) => {
    const pageToFetch = p ?? page;
    getPorts({ page: pageToFetch, page_size: PAGE_SIZE })
      .then((r) => {
        setPorts(r.results);
        setTotalCount(r.count);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [page]);

  useEffect(() => {
    setLoading(true);
    getPorts({ page, page_size: PAGE_SIZE })
      .then((r) => {
        setPorts(r.results);
        setTotalCount(r.count);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [page]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (item: Port) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleDelete = useCallback(
    (item: Port) => {
      deletePort(item.id).then(() => fetchList()).catch((e) => setError(e instanceof Error ? e.message : "Error"));
    },
    [fetchList]
  );

  const filteredPorts = useMemo(() => {
    if (!filterSearch.trim()) return ports;
    const q = filterSearch.trim().toLowerCase();
    return ports.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        (p.code ?? "").toLowerCase().includes(q)
    );
  }, [ports, filterSearch]);

  if (loading) {
    return <TablePageSkeleton columns={3} withButton />;
  }

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <MapPin className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
            Puertos
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
        <FormField
          label="Nombre o código"
          name="filter_search"
          value={filterSearch}
          onChange={setFilterSearch}
          placeholder="Buscar…"
        />
      </FilterSidebarContent>
      <div className="min-w-0 flex-1">
        <PageHeader>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              <MapPin className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
              Puertos
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {filteredPorts.length === ports.length
                ? `${totalCount} puerto${totalCount !== 1 ? "s" : ""}`
                : `${filteredPorts.length} de ${totalCount} puertos (filtro en página)`}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary-gradient flex cursor-pointer items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105 hover:shadow-[0_8px_22px_-14px_rgba(52,120,181,0.7)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nuevo puerto
          </button>
        </PageHeader>
        <MainTable>
          <table className="w-full min-w-[theme(spacing.96)]">
            <MainTableHeader>
              <MainTableTh>Nombre</MainTableTh>
              <MainTableTh>Código</MainTableTh>
              <MainTableTh className="w-28">Acciones</MainTableTh>
            </MainTableHeader>
            <MainTableBody>
              {filteredPorts.length === 0 ? (
                <MainTableEmpty colSpan={3}>
                  {ports.length === 0 ? "No hay puertos." : "Ningún puerto coincide con los filtros."}
                </MainTableEmpty>
              ) : (
                filteredPorts.map((p) => (
                  <MainTableRow key={p.id}>
                    <MainTableTd className="font-medium text-zinc-900 dark:text-zinc-50">
                      {p.name}
                    </MainTableTd>
                    <MainTableTd>{p.code || "—"}</MainTableTd>
                    <MainTableTd>
                      <TableActionButtons
                        onView={() => openEdit(p)}
                        onEdit={() => openEdit(p)}
                        onDelete={() => handleDelete(p)}
                        deleteLabel="este puerto"
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
          label="puertos"
        />
        <PortFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          edit={editing}
          onSuccess={fetchList}
        />
      </div>
    </>
  );
}
