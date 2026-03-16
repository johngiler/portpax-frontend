"use client";

import { Building2, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ShippingLine } from "@/lib/docking";
import { deleteShippingLine, getShippingLines } from "@/lib/docking";
import MainTable, {
  MainTableBody,
  MainTableEmpty,
  MainTableHeader,
  MainTableRow,
  MainTableTd,
  MainTableTh,
} from "@/components/tables/MainTable";
import ShippingLineFormModal from "@/components/modals/ShippingLineFormModal";
import TablePageSkeleton from "@/components/tables/TablePageSkeleton";
import TableActionButtons from "@/components/tables/TableActionButtons";
import TablePagination from "@/components/tables/TablePagination";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import PageHeader from "@/components/layout/PageHeader";
import { FormField } from "@/components/ui/FormField";

export default function ShippingLinesView() {
  const PAGE_SIZE = 20;
  const [list, setList] = useState<ShippingLine[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingLine | null>(null);
  const [filterSearch, setFilterSearch] = useState("");

  const fetchList = useCallback((p?: number) => {
    const pageToFetch = p ?? page;
    getShippingLines({ page: pageToFetch, page_size: PAGE_SIZE })
      .then((r) => {
        setList(r.results);
        setTotalCount(r.count);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [page]);

  useEffect(() => {
    setLoading(true);
    getShippingLines({ page, page_size: PAGE_SIZE })
      .then((r) => {
        setList(r.results);
        setTotalCount(r.count);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [page]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (item: ShippingLine) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleDelete = useCallback(
    (item: ShippingLine) => {
      deleteShippingLine(item.id).then(() => fetchList()).catch((e) => setError(e instanceof Error ? e.message : "Error"));
    },
    [fetchList]
  );

  const filteredList = useMemo(() => {
    if (!filterSearch.trim()) return list;
    const q = filterSearch.trim().toLowerCase();
    return list.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        (l.code ?? "").toLowerCase().includes(q)
    );
  }, [list, filterSearch]);

  if (loading) {
    return <TablePageSkeleton columns={3} withButton />;
  }

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <Building2 className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
            Navieras
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
              <Building2 className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
              Navieras
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {filteredList.length === list.length
                ? `${totalCount} naviera${totalCount !== 1 ? "s" : ""}`
                : `${filteredList.length} de ${totalCount} navieras (filtro en página)`}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary-gradient flex cursor-pointer items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105 hover:shadow-[0_8px_22px_-14px_rgba(52,120,181,0.7)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nueva naviera
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
              {filteredList.length === 0 ? (
                <MainTableEmpty colSpan={3}>
                  {list.length === 0 ? "No hay navieras." : "Ninguna naviera coincide con los filtros."}
                </MainTableEmpty>
              ) : (
                filteredList.map((item) => (
                  <MainTableRow key={item.id}>
                    <MainTableTd className="font-medium text-zinc-900 dark:text-zinc-50">
                      {item.name}
                    </MainTableTd>
                    <MainTableTd>{item.code || "—"}</MainTableTd>
                    <MainTableTd>
                      <TableActionButtons
                        onView={() => openEdit(item)}
                        onEdit={() => openEdit(item)}
                        onDelete={() => handleDelete(item)}
                        deleteLabel="esta naviera"
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
          label="navieras"
        />
        <ShippingLineFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          edit={editing}
          onSuccess={fetchList}
        />
      </div>
    </>
  );
}
