"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Scale } from "@/lib/docking";
import { getScales } from "@/lib/docking";
import MainTable, {
  MainTableBody,
  MainTableEmpty,
  MainTableHeader,
  MainTableRow,
  MainTableTd,
  MainTableTh,
} from "@/components/tables/MainTable";
import TablePageSkeleton from "@/components/tables/TablePageSkeleton";
import TablePagination from "@/components/tables/TablePagination";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import { FormField } from "@/components/ui/FormField";

export default function ScalesView() {
  const PAGE_SIZE = 20;
  const [list, setList] = useState<Scale[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPort, setFilterPort] = useState("");
  const [filterShip, setFilterShip] = useState("");

  useEffect(() => {
    setLoading(true);
    getScales({ page, page_size: PAGE_SIZE })
      .then((r) => {
        setList(r.results);
        setTotalCount(r.count);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [page]);

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
              ? `${totalCount} escala${totalCount !== 1 ? "s" : ""}`
              : `${filteredList.length} de ${totalCount} escalas (filtro en página)`}
          </p>
        </div>
        <MainTable>
          <table className="w-full min-w-[theme(spacing.96)]">
            <MainTableHeader>
              <MainTableTh>Barco</MainTableTh>
              <MainTableTh>Puerto</MainTableTh>
              <MainTableTh>Muelle</MainTableTh>
              <MainTableTh>Fecha</MainTableTh>
              <MainTableTh>PAX</MainTableTh>
            </MainTableHeader>
            <MainTableBody>
              {filteredList.length === 0 ? (
                <MainTableEmpty colSpan={5}>
                  {list.length === 0 ? "No hay escalas." : "Ninguna escala coincide con los filtros."}
                </MainTableEmpty>
              ) : (
                filteredList.map((s) => (
                  <MainTableRow key={s.id}>
                    <MainTableTd className="font-medium text-zinc-900 dark:text-zinc-50">
                      {s.ship_name}
                    </MainTableTd>
                    <MainTableTd>{s.port_name}</MainTableTd>
                    <MainTableTd>{s.berth_name ?? "—"}</MainTableTd>
                    <MainTableTd>{s.date}</MainTableTd>
                    <MainTableTd className="tabular-nums">{s.pax_count ?? "—"}</MainTableTd>
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
          label="escalas"
        />
      </div>
    </>
  );
}
