"use client";

import { Plus, Ship as ShipIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Ship } from "@/lib/docking";
import { deleteShip, getShips, getShippingLines } from "@/lib/docking";
import MainTable, {
  AccordionTableRow,
  MainTableBody,
  MainTableEmpty,
  MainTableHeader,
  MainTableTd,
  MainTableTh,
} from "@/components/tables/MainTable";
import ShipFormModal from "@/components/modals/ShipFormModal";
import TablePageSkeleton from "@/components/tables/TablePageSkeleton";
import TableActionButtons from "@/components/tables/TableActionButtons";
import TablePagination from "@/components/tables/TablePagination";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import PageHeader from "@/components/layout/PageHeader";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";

export default function ShipsView() {
  const PAGE_SIZE = 20;
  const [ships, setShips] = useState<Ship[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [lines, setLines] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ship | null>(null);
  const [filterNaviera, setFilterNaviera] = useState<number | "">("");
  const [filterName, setFilterName] = useState("");

  const fetchList = useCallback((p?: number) => {
    const pageToFetch = p ?? page;
    getShips({ page: pageToFetch, page_size: PAGE_SIZE })
      .then((r) => {
        setShips(r.results);
        setTotalCount(r.count);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [page]);

  useEffect(() => {
    setLoading(true);
    getShips({ page, page_size: PAGE_SIZE })
      .then((r) => {
        setShips(r.results);
        setTotalCount(r.count);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    getShippingLines({ page_size: 100 })
      .then((r) => setLines(r.results.map((l) => ({ id: l.id, name: l.name }))))
      .catch(() => setLines([]));
  }, []);

  const filteredShips = useMemo(() => {
    let out = ships;
    if (filterNaviera !== "" && filterNaviera !== 0) {
      out = out.filter((s) => s.shipping_line === filterNaviera);
    }
    if (filterName.trim()) {
      const q = filterName.trim().toLowerCase();
      out = out.filter((s) => s.name?.toLowerCase().includes(q));
    }
    return out;
  }, [ships, filterNaviera, filterName]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (item: Ship) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleDelete = useCallback(
    (item: Ship) => {
      deleteShip(item.id).then(() => fetchList()).catch((e) => setError(e instanceof Error ? e.message : "Error"));
    },
    [fetchList]
  );

  if (loading) {
    return <TablePageSkeleton columns={5} withButton />;
  }

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <ShipIcon className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
            Barcos
          </h1>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const lineOptions = [{ value: 0, label: "Todas" }, ...lines.map((l) => ({ value: l.id, label: l.name }))];

  return (
    <>
      <FilterSidebarContent>
        <FormFieldSelect
          label="Naviera"
          name="filter_naviera"
          value={filterNaviera === "" ? 0 : filterNaviera}
          onChange={(v) => setFilterNaviera(v === 0 ? "" : (v as number))}
          options={lineOptions}
          optionLabel="Todas"
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
      <div className="min-w-0 flex-1">
        <PageHeader>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              <ShipIcon className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
              Barcos
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {filteredShips.length === ships.length
                ? `${totalCount} barco${totalCount !== 1 ? "s" : ""}`
                : `${filteredShips.length} de ${totalCount} barcos (filtro en página)`}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary-gradient flex cursor-pointer items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105 hover:shadow-[0_8px_22px_-14px_rgba(52,120,181,0.7)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nuevo barco
          </button>
        </PageHeader>
        <MainTable>
          <table className="w-full min-w-[theme(spacing.96)]">
            <MainTableHeader>
              <MainTableTh>Nombre</MainTableTh>
              <MainTableTh>Naviera</MainTableTh>
              <MainTableTh>IMO</MainTableTh>
              <MainTableTh>PAX</MainTableTh>
              <MainTableTh className="w-28">Acciones</MainTableTh>
            </MainTableHeader>
            <MainTableBody>
              {filteredShips.length === 0 ? (
                <MainTableEmpty colSpan={5}>
                  {ships.length === 0 ? "No hay barcos." : "Ningún barco coincide con los filtros."}
                </MainTableEmpty>
              ) : (
                filteredShips.map((s) => (
                  <AccordionTableRow
                    key={s.id}
                    colSpan={5}
                    expandContent={
                      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Identificación
                          </p>
                          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {s.name}
                          </p>
                          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                            Código: {s.code || "—"}
                          </p>
                          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                            IMO: {s.imo || "—"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Naviera
                          </p>
                          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                            {s.shipping_line_name || "—"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Capacidad PAX
                          </p>
                          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--admin-accent)]">
                            {s.capacity_pax ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Dimensiones
                          </p>
                          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                            Eslora: {s.length_m != null ? `${s.length_m} m` : "—"}
                          </p>
                          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                            Calado: {s.draft_m != null ? `${s.draft_m} m` : "—"}
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <MainTableTd className="font-medium text-zinc-900 dark:text-zinc-50">
                      {s.name}
                    </MainTableTd>
                    <MainTableTd>{s.shipping_line_name}</MainTableTd>
                    <MainTableTd>{s.imo || "—"}</MainTableTd>
                    <MainTableTd className="tabular-nums">{s.capacity_pax ?? "—"}</MainTableTd>
                    <MainTableTd>
                      <TableActionButtons
                        onView={() => openEdit(s)}
                        onEdit={() => openEdit(s)}
                        onDelete={() => handleDelete(s)}
                        deleteLabel="este barco"
                      />
                    </MainTableTd>
                  </AccordionTableRow>
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
          label="barcos"
        />
        <ShipFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          edit={editing}
          onSuccess={fetchList}
        />
      </div>
    </>
  );
}
