"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Scale } from "@/lib/docking";
import { getScales } from "@/lib/docking";
import AdminTable, {
  AdminTableBody,
  AdminTableEmpty,
  AdminTableHeader,
  AdminTableRow,
  AdminTableTd,
  AdminTableTh,
} from "@/components/admin/AdminTable";
import TablePageSkeleton from "@/components/admin/TablePageSkeleton";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import { FormField } from "@/components/ui/FormField";

export default function ScalesPage() {
  const [list, setList] = useState<Scale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPort, setFilterPort] = useState("");
  const [filterShip, setFilterShip] = useState("");

  useEffect(() => {
    getScales()
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  const filteredList = useMemo(() => {
    let out = list;
    if (filterPort.trim()) {
      const q = filterPort.trim().toLowerCase();
      out = out.filter((s) => s.port_name?.toLowerCase().includes(q));
    }
    if (filterShip.trim()) {
      const q = filterShip.trim().toLowerCase();
      out = out.filter((s) => s.ship_name?.toLowerCase().includes(q));
    }
    return out;
  }, [list, filterPort, filterShip]);

  if (loading) {
    return <TablePageSkeleton columns={5} withButton={false} />;
  }

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <CalendarDays className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
            Escalas
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
          label="Puerto"
          name="filter_port"
          value={filterPort}
          onChange={setFilterPort}
          placeholder="Filtrar por puerto…"
        />
        <FormField
          label="Barco"
          name="filter_ship"
          value={filterShip}
          onChange={setFilterShip}
          placeholder="Filtrar por barco…"
        />
      </FilterSidebarContent>
      <div className="min-w-0 flex-1">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <CalendarDays className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
            Escalas
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {filteredList.length === list.length
              ? `${list.length} escala${list.length !== 1 ? "s" : ""}`
              : `${filteredList.length} de ${list.length} escalas`}
          </p>
        </div>
        <AdminTable>
          <table className="w-full min-w-[theme(spacing.96)]">
            <AdminTableHeader>
              <AdminTableTh>Barco</AdminTableTh>
              <AdminTableTh>Puerto</AdminTableTh>
              <AdminTableTh>Muelle</AdminTableTh>
              <AdminTableTh>Fecha</AdminTableTh>
              <AdminTableTh>PAX</AdminTableTh>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredList.length === 0 ? (
                <AdminTableEmpty colSpan={5}>
                  {list.length === 0 ? "No hay escalas." : "Ninguna escala coincide con los filtros."}
                </AdminTableEmpty>
              ) : (
                filteredList.map((s) => (
                  <AdminTableRow key={s.id}>
                    <AdminTableTd className="font-medium text-zinc-900 dark:text-zinc-50">
                      {s.ship_name}
                    </AdminTableTd>
                    <AdminTableTd>{s.port_name}</AdminTableTd>
                    <AdminTableTd>{s.berth_name ?? "—"}</AdminTableTd>
                    <AdminTableTd>{s.date}</AdminTableTd>
                    <AdminTableTd className="tabular-nums">{s.pax_count ?? "—"}</AdminTableTd>
                  </AdminTableRow>
                ))
              )}
            </AdminTableBody>
          </table>
        </AdminTable>
      </div>
    </>
  );
}
