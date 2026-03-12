"use client";

import { Building2, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ShippingLine } from "@/lib/docking";
import { deleteShippingLine, getShippingLines } from "@/lib/docking";
import AdminTable, {
  AdminTableBody,
  AdminTableEmpty,
  AdminTableHeader,
  AdminTableRow,
  AdminTableTd,
  AdminTableTh,
} from "@/components/admin/AdminTable";
import ShippingLineFormModal from "@/components/admin/ShippingLineFormModal";
import TablePageSkeleton from "@/components/admin/TablePageSkeleton";
import TableActionButtons from "@/components/admin/TableActionButtons";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import { FormField } from "@/components/ui/FormField";

export default function ShippingLinesPage() {
  const [list, setList] = useState<ShippingLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingLine | null>(null);
  const [filterSearch, setFilterSearch] = useState("");

  const fetchList = useCallback(() => {
    getShippingLines()
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  useEffect(() => {
    getShippingLines()
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

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
      deleteShippingLine(item.id).then(fetchList).catch((e) => setError(e instanceof Error ? e.message : "Error"));
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
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              <Building2 className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
              Navieras
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {filteredList.length === list.length
                ? `${list.length} naviera${list.length !== 1 ? "s" : ""}`
                : `${filteredList.length} de ${list.length} navieras`}
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
        </div>
        <AdminTable>
          <table className="w-full min-w-[theme(spacing.96)]">
            <AdminTableHeader>
              <AdminTableTh>Nombre</AdminTableTh>
              <AdminTableTh>Código</AdminTableTh>
              <AdminTableTh className="w-28">Acciones</AdminTableTh>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredList.length === 0 ? (
                <AdminTableEmpty colSpan={3}>
                  {list.length === 0 ? "No hay navieras." : "Ninguna naviera coincide con los filtros."}
                </AdminTableEmpty>
              ) : (
                filteredList.map((item) => (
                  <AdminTableRow key={item.id}>
                    <AdminTableTd className="font-medium text-zinc-900 dark:text-zinc-50">
                      {item.name}
                    </AdminTableTd>
                    <AdminTableTd>{item.code || "—"}</AdminTableTd>
                    <AdminTableTd>
                      <TableActionButtons
                        onView={() => openEdit(item)}
                        onEdit={() => openEdit(item)}
                        onDelete={() => handleDelete(item)}
                        deleteLabel="esta naviera"
                      />
                    </AdminTableTd>
                  </AdminTableRow>
                ))
              )}
            </AdminTableBody>
          </table>
        </AdminTable>
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
