"use client";

import { CircleDollarSign, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PortFeeRule } from "@/lib/docking";
import { deletePortFeeRule, getPortFeeRules } from "@/lib/docking";
import MainTable, {
  AccordionTableRow,
  MainTableBody,
  MainTableEmpty,
  MainTableHeader,
  MainTableTd,
  MainTableTh,
} from "@/components/tables/MainTable";
import TableActionButtons from "@/components/tables/TableActionButtons";
import TablePageSkeleton from "@/components/tables/TablePageSkeleton";
import TablePagination from "@/components/tables/TablePagination";
import TariffFormModal from "@/components/modals/TariffFormModal";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import PageHeader from "@/components/layout/PageHeader";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PortFeeRule | null>(null);
  const [viewOnly, setViewOnly] = useState(false);

  const fetchList = useCallback((p?: number) => {
    const pageToFetch = p ?? page;
    getPortFeeRules({ page: pageToFetch, page_size: PAGE_SIZE })
      .then((r) => {
        setList(r.results);
        setTotalCount(r.count);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [page]);

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

  const openCreate = () => {
    setEditing(null);
    setViewOnly(false);
    setModalOpen(true);
  };
  const openEdit = (item: PortFeeRule) => {
    setEditing(item);
    setViewOnly(false);
    setModalOpen(true);
  };
  const openView = (item: PortFeeRule) => {
    setEditing(item);
    setViewOnly(true);
    setModalOpen(true);
  };
  const handleDelete = useCallback(
    (item: PortFeeRule) => {
      deletePortFeeRule(item.id).then(() => fetchList()).catch((e) => setError(e instanceof Error ? e.message : "Error"));
    },
    [fetchList]
  );

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
    return <TablePageSkeleton columns={5} withButton />;
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
        <PageHeader>
          <div>
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
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary-gradient flex cursor-pointer items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105 hover:shadow-[0_8px_22px_-14px_rgba(52,120,181,0.7)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nueva tarifa
          </button>
        </PageHeader>
        <MainTable>
          <table className="w-full min-w-[theme(spacing.96)]">
            <MainTableHeader>
              <MainTableTh>Puerto</MainTableTh>
              <MainTableTh>Tier</MainTableTh>
              <MainTableTh className="tabular-nums">USD / PAX</MainTableTh>
              <MainTableTh>Vigencia</MainTableTh>
              <MainTableTh className="w-28">Notas</MainTableTh>
              <MainTableTh className="w-28">Acciones</MainTableTh>
            </MainTableHeader>
            <MainTableBody>
              {filteredList.length === 0 ? (
                <MainTableEmpty colSpan={6}>
                  {list.length === 0
                    ? "No hay tarifas cargadas. Ejecuta en backend: python manage.py load_port_fees"
                    : "Ninguna tarifa coincide con los filtros."}
                </MainTableEmpty>
              ) : (
                filteredList.map((r) => (
                  <AccordionTableRow
                    key={r.id}
                    colSpan={6}
                    expandContent={
                      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Puerto y tier
                          </p>
                          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {r.port_name}
                          </p>
                          <p className="mt-0.5 text-sm text-[var(--admin-accent)]">
                            {r.fee_tier} — {FEE_TIER_LABELS[r.fee_tier] ?? r.fee_tier}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Tarifa y vigencia
                          </p>
                          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--admin-accent)]">
                            $ {Number(r.amount_per_pax_usd).toFixed(2)} / PAX
                          </p>
                          {r.minimum_charge_usd != null && r.minimum_charge_usd !== "" && (
                            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                              Mín. $ {Number(r.minimum_charge_usd).toFixed(2)}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {formatDate(r.valid_from)} → {formatDate(r.valid_to)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 sm:col-span-2 lg:col-span-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Notas
                          </p>
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {r.notes || "—"}
                          </p>
                        </div>
                      </div>
                    }
                  >
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
                    <MainTableTd>
                      <TableActionButtons
                        onView={() => openView(r)}
                        onEdit={() => openEdit(r)}
                        onDelete={() => handleDelete(r)}
                        deleteLabel="esta tarifa"
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
          label="tarifas"
        />
        <TariffFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          edit={editing}
          viewOnly={viewOnly}
          onSuccess={fetchList}
        />
      </div>
    </>
  );
}
