"use client";

import { CircleDollarSign } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PortFeeRule } from "@/lib/docking";
import { getPortFeeRules } from "@/lib/docking";
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
import { FormField, FormFieldSelect } from "@/components/ui/FormField";

const FEE_TIER_LABELS: Record<string, string> = {
  RCL: "Royal Caribbean / Celebrity",
  NCL: "Norwegian / Oceania / Regent",
  MSC: "MSC",
  CCL: "Carnival / Costa",
  VV: "Virgin Voyages",
  Others: "Otros",
};

function formatDate(s: string | null) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleDateString("es", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return s;
  }
}

export default function TariffsView() {
  const PAGE_SIZE = 25;
  const [list, setList] = useState<PortFeeRule[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPort, setFilterPort] = useState("");
  const [filterTier, setFilterTier] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    getPortFeeRules({ page, page_size: PAGE_SIZE })
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
      out = out.filter((r) => r.port_name?.toLowerCase().includes(q));
    }
    if (filterTier) {
      out = out.filter((r) => r.fee_tier === filterTier);
    }
    return out;
  }, [list, filterPort, filterTier]);

  const tierOptions = [
    { value: "", label: "Todos" },
    ...Object.entries(FEE_TIER_LABELS).map(([value, label]) => ({ value, label })),
  ];

  if (loading) {
    return <TablePageSkeleton columns={5} withButton={false} />;
  }

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <CircleDollarSign className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
            Tarifas portuarias
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
          placeholder="Nombre del puerto…"
        />
        <FormFieldSelect
          label="Tier naviera"
          name="filter_tier"
          value={filterTier}
          onChange={setFilterTier}
          options={tierOptions}
          optionLabel="Todos"
          emptyValue=""
        />
      </FilterSidebarContent>
      <div>
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <CircleDollarSign className="h-7 w-7 text-[var(--admin-accent)]" strokeWidth={1.5} />
            Tarifas portuarias
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {filteredList.length === list.length
              ? `${totalCount} tarifa${totalCount !== 1 ? "s" : ""} (USD por pasajero)`
              : `${filteredList.length} de ${totalCount} (filtro en página)`}
          </p>
        </div>
        <MainTable>
          <table className="w-full min-w-[theme(spacing.96)]">
            <MainTableHeader>
              <MainTableTh>Puerto</MainTableTh>
              <MainTableTh>Tier</MainTableTh>
              <MainTableTh className="tabular-nums">USD / PAX</MainTableTh>
              <MainTableTh>Vigencia</MainTableTh>
              <MainTableTh>Notas</MainTableTh>
            </MainTableHeader>
            <MainTableBody>
              {filteredList.length === 0 ? (
                <MainTableEmpty colSpan={5}>
                  {list.length === 0
                    ? "No hay tarifas cargadas. Ejecuta en backend: python manage.py load_port_fees"
                    : "Ninguna tarifa coincide con los filtros."}
                </MainTableEmpty>
              ) : (
                filteredList.map((r) => (
                  <MainTableRow key={r.id}>
                    <MainTableTd className="font-medium text-zinc-900 dark:text-zinc-50">
                      {r.port_name}
                    </MainTableTd>
                    <MainTableTd>
                      <span className="font-mono text-[var(--admin-accent)]">{r.fee_tier}</span>
                      <span className="ml-1.5 text-zinc-500 dark:text-zinc-400">
                        ({FEE_TIER_LABELS[r.fee_tier] ?? r.fee_tier})
                      </span>
                    </MainTableTd>
                    <MainTableTd className="tabular-nums font-medium">
                      $ {Number(r.amount_per_pax_usd).toFixed(2)}
                    </MainTableTd>
                    <MainTableTd className="text-zinc-600 dark:text-zinc-400">
                      {formatDate(r.valid_from)} → {formatDate(r.valid_to)}
                    </MainTableTd>
                    <MainTableTd className="max-w-[theme(spacing.64)] truncate text-sm text-zinc-500 dark:text-zinc-400" title={r.notes || undefined}>
                      {r.notes || "—"}
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
          label="tarifas"
        />
      </div>
    </>
  );
}
