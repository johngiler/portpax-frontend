"use client";

import { Plus, Ship as ShipIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Ship } from "@/lib/docking";
import { deleteShip, getShips, getShippingLines } from "@/lib/docking";
import AdminTable, {
  AdminTableBody,
  AdminTableEmpty,
  AdminTableHeader,
  AdminTableRow,
  AdminTableTd,
  AdminTableTh,
} from "@/components/admin/AdminTable";
import ShipFormModal from "@/components/admin/ShipFormModal";
import TablePageSkeleton from "@/components/admin/TablePageSkeleton";
import TableActionButtons from "@/components/admin/TableActionButtons";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";

export default function ShipsPage() {
  const [ships, setShips] = useState<Ship[]>([]);
  const [lines, setLines] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ship | null>(null);
  const [filterNaviera, setFilterNaviera] = useState<number | "">("");
  const [filterName, setFilterName] = useState("");

  const fetchList = useCallback(() => {
    getShips()
      .then(setShips)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  useEffect(() => {
    getShips()
      .then(setShips)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getShippingLines()
      .then((list) => setLines(list.map((l) => ({ id: l.id, name: l.name }))))
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
      deleteShip(item.id).then(fetchList).catch((e) => setError(e instanceof Error ? e.message : "Error"));
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
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              <ShipIcon className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
              Barcos
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {filteredShips.length === ships.length
                ? `${ships.length} barco${ships.length !== 1 ? "s" : ""}`
                : `${filteredShips.length} de ${ships.length} barcos`}
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
        </div>
        <AdminTable>
          <table className="w-full min-w-[theme(spacing.96)]">
            <AdminTableHeader>
              <AdminTableTh>Nombre</AdminTableTh>
              <AdminTableTh>Naviera</AdminTableTh>
              <AdminTableTh>IMO</AdminTableTh>
              <AdminTableTh>PAX</AdminTableTh>
              <AdminTableTh className="w-28">Acciones</AdminTableTh>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredShips.length === 0 ? (
                <AdminTableEmpty colSpan={5}>
                  {ships.length === 0 ? "No hay barcos." : "Ningún barco coincide con los filtros."}
                </AdminTableEmpty>
              ) : (
                filteredShips.map((s) => (
                  <AdminTableRow key={s.id}>
                    <AdminTableTd className="font-medium text-zinc-900 dark:text-zinc-50">
                      {s.name}
                    </AdminTableTd>
                    <AdminTableTd>{s.shipping_line_name}</AdminTableTd>
                    <AdminTableTd>{s.imo || "—"}</AdminTableTd>
                    <AdminTableTd className="tabular-nums">{s.capacity_pax ?? "—"}</AdminTableTd>
                    <AdminTableTd>
                      <TableActionButtons
                        onView={() => openEdit(s)}
                        onEdit={() => openEdit(s)}
                        onDelete={() => handleDelete(s)}
                        deleteLabel="este barco"
                      />
                    </AdminTableTd>
                  </AdminTableRow>
                ))
              )}
            </AdminTableBody>
          </table>
        </AdminTable>
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
