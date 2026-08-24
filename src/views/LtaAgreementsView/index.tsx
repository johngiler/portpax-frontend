"use client";

import { FileText, Plus } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  useActivePortsCatalog,
  useActiveShippingLinesCatalog,
} from "@/hooks/swr/useCatalogs";
import { useLtaAgreementsPage } from "@/hooks/swr/useLtaAgreementsPage";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { setDataActivityHandler } from "@/lib/dataActivityStore";
import { suggestLtaAgreements } from "@/lib/filterSuggestions";
import { formatCompactCount } from "@/lib/formatCompactCount";
import { canBrowseCatalogs, canWriteApp } from "@/lib/navAccess";
import { revalidateLtaAgreements } from "@/lib/swr/mutateHelpers";
import {
  createLongTermAgreement,
  deleteLongTermAgreement,
  updateLongTermAgreement,
} from "@/services/bookings/ltaService";
import LtaFormModal, { type LtaFormMode, type LtaFormSubmitData } from "./LtaFormModal";
import LtaAgreementsViewSkeleton from "./LtaAgreementsViewSkeleton";
import LtaHistoryModal from "./LtaHistoryModal";
import LtaRowDetail from "./LtaRowDetail";
import type { LongTermAgreement } from "@/types/lta";
import { formatLtaWeekdays } from "@/types/lta";

const PAGE_SIZE = 20;
const COL_SPAN = 8;

export default function LtaAgreementsView() {
  const { user } = useAuth();
  const canWrite = canWriteApp(user?.role);
  const canBrowse = canBrowseCatalogs(user?.role);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [viewError, setViewError] = useState<string | null>(null);
  const [viewSuccess, setViewSuccess] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<LtaFormMode>("create");
  const [editing, setEditing] = useState<LongTermAgreement | null>(null);
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { ports } = useActivePortsCatalog(canBrowse);
  const { lines: shippingLines } = useActiveShippingLinesCatalog(canBrowse);

  const { rows, totalCount, isLoading, error, mutate } = useLtaAgreementsPage(
    page,
    appliedSearch,
    canBrowse,
    PAGE_SIZE,
  );

  useEffect(() => {
    if (error) {
      setViewError(
        getApiErrorMessage(error, "No se pudieron cargar los acuerdos LTA."),
      );
    }
  }, [error]);

  useEffect(() => {
    setExpandedId(null);
  }, [page, appliedSearch]);

  useEffect(() => {
    setDataActivityHandler(() => {
      setHistoryOpen(true);
    });
    return () => setDataActivityHandler(null);
  }, []);

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
      await mutate();
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
      await mutate();
    } catch (err) {
      setViewError(getApiErrorMessage(err, "No se pudo eliminar el acuerdo."));
    }
  }

  if (isLoading) {
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
          title={
            appliedSearch.trim()
              ? "Sin acuerdos con esta búsqueda"
              : "Sin acuerdos LTA"
          }
          description={
            appliedSearch.trim()
              ? "Ajusta la búsqueda o crea un nuevo acuerdo."
              : "Crea el primer acuerdo con naviera, puerto, días y posiciones."
          }
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
                <MainTableTh>
                  <span title="Reservas con este acuerdo asignado automáticamente">
                    Reservas
                  </span>
                </MainTableTh>
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
                        <LtaRowDetail agreement={row} active={isExpanded} />
                      }
                    >
                      <MainTableTd>
                        <button
                          type="button"
                          onClick={() =>
                            canWrite
                              ? openEdit(row)
                              : setExpandedId(isExpanded ? null : row.id)
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
                        {row.interval_days != null && row.cadence_anchor
                          ? `Cada ${row.interval_days} d`
                          : `${row.advance_months_min}–${row.advance_months_max} m`}
                      </MainTableTd>
                      <MainTableTd>
                        <span
                          className={
                            (row.linked_bookings_count ?? 0) > 0
                              ? "font-medium tabular-nums text-zinc-800 dark:text-zinc-100"
                              : "tabular-nums text-zinc-400"
                          }
                          title={`${(row.linked_bookings_count ?? 0).toLocaleString("es")} reserva${
                            (row.linked_bookings_count ?? 0) === 1 ? "" : "s"
                          } con este acuerdo`}
                        >
                          {formatCompactCount(row.linked_bookings_count ?? 0)}
                        </span>
                      </MainTableTd>
                      <MainTableTd>
                        {row.is_active ? (
                          <span className="text-emerald-700 dark:text-emerald-400">Activo</span>
                        ) : (
                          <span className="text-zinc-400">Inactivo</span>
                        )}
                      </MainTableTd>
                      <MainTableTd>
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

      <LtaHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}
