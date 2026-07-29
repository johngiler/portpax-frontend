"use client";

import { FileText, Link2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import FilterActions from "@/components/layout/FilterActions";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import FilterSuggestField from "@/components/layout/FilterSuggestField";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import ViewSuccessBanner from "@/components/layout/ViewSuccessBanner";
import MainTable, {
  AccordionTableRow,
  MainTableBody,
  MainTableHeader,
  MainTableTd,
  MainTableTh,
} from "@/components/tables/MainTable";
import TableActionButtons from "@/components/tables/TableActionButtons";
import TablePagination from "@/components/tables/TablePagination";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/contexts/ConfirmContext";
import {
  useActivePortsCatalog,
  useActiveShippingLinesCatalog,
} from "@/hooks/swr/useCatalogs";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { suggestLtaAgreements } from "@/lib/filterSuggestions";
import { canBrowseCatalogs, canWriteApp } from "@/lib/navAccess";
import { revalidateLtaAgreements } from "@/lib/swr/mutateHelpers";
import {
  createLongTermAgreement,
  deleteLongTermAgreement,
  fetchLongTermAgreements,
  linkLongTermAgreementBookings,
  updateLongTermAgreement,
} from "@/services/bookings/ltaService";
import LtaFormModal, { type LtaFormMode, type LtaFormSubmitData } from "./LtaFormModal";
import LtaAgreementsViewSkeleton from "./LtaAgreementsViewSkeleton";
import LtaRowDetail from "./LtaRowDetail";
import type { LongTermAgreement } from "@/types/lta";
import { formatLtaWeekdays } from "@/types/lta";

const PAGE_SIZE = 20;
const COL_SPAN = 7;

const linkBtnClass =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors duration-200 hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-40";

export default function LtaAgreementsView() {
  const { user } = useAuth();
  const { requestConfirm } = useConfirm();
  const canWrite = canWriteApp(user?.role);
  const canBrowse = canBrowseCatalogs(user?.role);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [rows, setRows] = useState<LongTermAgreement[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);
  const [viewSuccess, setViewSuccess] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [bookingsRefreshKey, setBookingsRefreshKey] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<LtaFormMode>("create");
  const [editing, setEditing] = useState<LongTermAgreement | null>(null);
  const [saving, setSaving] = useState(false);

  const { ports } = useActivePortsCatalog(canBrowse);
  const { lines: shippingLines } = useActiveShippingLinesCatalog(canBrowse);

  const load = useCallback(async () => {
    setLoading(true);
    setViewError(null);
    try {
      const data = await fetchLongTermAgreements({
        page,
        pageSize: PAGE_SIZE,
        search: appliedSearch,
      });
      setRows(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setViewError(getApiErrorMessage(err, "No se pudieron cargar los acuerdos LTA."));
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(row: LongTermAgreement) {
    setModalMode("edit");
    setEditing(row);
    setModalOpen(true);
  }

  async function handleSave({ payload, options }: LtaFormSubmitData) {
    setSaving(true);
    try {
      if (modalMode === "edit" && editing) {
        await updateLongTermAgreement(editing.id, payload, options);
      } else {
        await createLongTermAgreement(payload, options);
      }
      setModalOpen(false);
      await revalidateLtaAgreements();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: LongTermAgreement) {
    setViewError(null);
    setViewSuccess(null);
    try {
      await deleteLongTermAgreement(row.id);
      await revalidateLtaAgreements();
      await load();
    } catch (err) {
      setViewError(getApiErrorMessage(err, "No se pudo eliminar el acuerdo."));
    }
  }

  async function runLinkBookings(row: LongTermAgreement) {
    setViewError(null);
    setViewSuccess(null);
    setLinkingId(row.id);
    try {
      const result = await linkLongTermAgreementBookings(row.id);
      if (result.detail && result.linked === 0) {
        setViewError(result.detail);
      } else if (result.linked === 0) {
        setViewSuccess(
          `No había reservas sin LTA que coincidan con «${row.code}».`,
        );
      } else {
        setViewSuccess(
          `Se vincularon ${result.linked} reserva${result.linked === 1 ? "" : "s"} a «${row.code}».`,
        );
        setBookingsRefreshKey((k) => k + 1);
      }
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudieron vincular las reservas al acuerdo."),
      );
    } finally {
      setLinkingId(null);
    }
  }

  function confirmLinkBookings(row: LongTermAgreement) {
    requestConfirm({
      title: "Vincular reservas",
      message:
        `Se buscarán reservas existentes de ${row.port_name} / ${row.shipping_line_name} ` +
        `sin acuerdo LTA que coincidan con «${row.code}» (barco, día, vigencia y posición). ` +
        `No se cambiará el estado de las reservas.`,
      confirmLabel: "Vincular",
      onConfirm: () => {
        void runLinkBookings(row);
      },
    });
  }

  if (loading && rows.length === 0 && !viewError) {
    return <LtaAgreementsViewSkeleton />;
  }

  return (
    <>
      <FilterSidebarContent>
        <FilterSuggestField
          label="Buscar"
          name="lta_search"
          value={search}
          onChange={setSearch}
          loadSuggestions={suggestLtaAgreements}
          placeholder="Código, nombre, puerto, naviera…"
        />
        <FilterActions
          onApply={() => {
            setPage(1);
            setAppliedSearch(search);
            setViewError(null);
            setViewSuccess(null);
          }}
          onClear={() => {
            setSearch("");
            setAppliedSearch("");
            setPage(1);
            setViewError(null);
            setViewSuccess(null);
          }}
          canClear={Boolean(search.trim()) || Boolean(appliedSearch)}
          canApply={search.trim() !== appliedSearch}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={FileText}
        title="Acuerdos LTA"
        description="Contratos de largo plazo: ventana de antelación y bloqueo estratégico de posiciones."
        actions={
          canWrite ? (
            <DefaultButton type="button" onClick={openCreate}>
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" strokeWidth={2} />
                Agregar acuerdo
              </span>
            </DefaultButton>
          ) : undefined
        }
      />

      {viewError ? (
        <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />
      ) : null}
      {viewSuccess ? (
        <ViewSuccessBanner
          message={viewSuccess}
          onDismiss={() => setViewSuccess(null)}
        />
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin acuerdos LTA"
          description="Crea el primer acuerdo para vincular naviera, puerto, días y posiciones."
          primaryAction={
            canWrite
              ? { label: "Agregar acuerdo", onClick: openCreate, icon: Plus }
              : undefined
          }
        />
      ) : (
        <>
          <MainTable>
            <table className="w-full min-w-[48rem]">
              <MainTableHeader>
                <MainTableTh>Código</MainTableTh>
                <MainTableTh>Puerto</MainTableTh>
                <MainTableTh>Naviera</MainTableTh>
                <MainTableTh>Días</MainTableTh>
                <MainTableTh>Ventana</MainTableTh>
                <MainTableTh>Estado</MainTableTh>
                <MainTableTh className="w-36">Acciones</MainTableTh>
              </MainTableHeader>
              <MainTableBody>
                {rows.map((row) => {
                  const isExpanded = expandedId === row.id;
                  return (
                    <AccordionTableRow
                      key={row.id}
                      colSpan={COL_SPAN}
                      showRowToggle={false}
                      open={isExpanded}
                      onOpenChange={(open) =>
                        setExpandedId(open ? row.id : null)
                      }
                      expandContent={
                        <LtaRowDetail
                          agreement={row}
                          active={isExpanded}
                          bookingsRefreshKey={bookingsRefreshKey}
                        />
                      }
                    >
                      <MainTableTd>
                        <button
                          type="button"
                          onClick={() =>
                            canWrite ? openEdit(row) : setExpandedId(isExpanded ? null : row.id)
                          }
                          className="text-left font-semibold text-[var(--admin-accent)] hover:underline"
                        >
                          {row.code}
                        </button>
                        <p className="text-xs text-zinc-500">{row.name}</p>
                      </MainTableTd>
                      <MainTableTd>{row.port_name}</MainTableTd>
                      <MainTableTd>{row.shipping_line_name}</MainTableTd>
                      <MainTableTd>
                        <span className="text-sm">{formatLtaWeekdays(row.weekdays)}</span>
                        {row.position_codes.length ? (
                          <p className="text-xs text-zinc-500">
                            {row.position_codes.join(", ")}
                          </p>
                        ) : null}
                      </MainTableTd>
                      <MainTableTd>
                        {row.advance_months_min}–{row.advance_months_max} meses
                      </MainTableTd>
                      <MainTableTd>
                        {row.is_active ? (
                          <span className="text-emerald-700 dark:text-emerald-400">Activo</span>
                        ) : (
                          <span className="text-zinc-400">Inactivo</span>
                        )}
                      </MainTableTd>
                      <MainTableTd>
                        <div className="flex items-center justify-start gap-1">
                          {canWrite ? (
                            <button
                              type="button"
                              onClick={() => confirmLinkBookings(row)}
                              disabled={linkingId === row.id || !row.is_active}
                              className={linkBtnClass}
                              aria-label="Vincular reservas existentes"
                              title="Vincular reservas existentes"
                            >
                              <Link2 className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                          ) : null}
                          <TableActionButtons
                            onView={() =>
                              setExpandedId(isExpanded ? null : row.id)
                            }
                            viewActive={isExpanded}
                            onEdit={canWrite ? () => openEdit(row) : undefined}
                            onDelete={
                              canWrite
                                ? () => void handleDelete(row)
                                : undefined
                            }
                            deleteLabel={`el acuerdo ${row.code}`}
                          />
                        </div>
                      </MainTableTd>
                    </AccordionTableRow>
                  );
                })}
              </MainTableBody>
            </table>
          </MainTable>
          <TablePagination
            page={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            label="acuerdos"
          />
        </>
      )}

      {canWrite ? (
        <LtaFormModal
          open={modalOpen}
          mode={modalMode}
          initial={editing}
          ports={ports}
          shippingLines={shippingLines}
          saving={saving}
          onClose={() => !saving && setModalOpen(false)}
          onSubmit={handleSave}
        />
      ) : null}
    </>
  );
}
