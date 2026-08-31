"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Anchor, Plus } from "lucide-react";
import DefaultButton from "@/components/buttons/DefaultButton";
import FilterActions from "@/components/layout/FilterActions";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import FilterSuggestField from "@/components/layout/FilterSuggestField";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import { FormFieldSelect } from "@/components/ui/FormField";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { useAuth } from "@/contexts/AuthContext";
import { useShippingLineGroupsCatalog } from "@/hooks/swr/useCatalogs";
import { useShippingLinesInfinite } from "@/hooks/swr/useShippingLinesInfinite";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { setDataActivityHandler } from "@/lib/dataActivityStore";
import {
  setDataExportHandler,
  type DataExportFormat,
} from "@/lib/dataExportStore";
import { setDataImportHandler } from "@/lib/dataImportStore";
import { suggestShippingLines } from "@/lib/filterSuggestions";
import { canWriteApp } from "@/lib/navAccess";
import { revalidateShippingLinesLists } from "@/lib/swr/mutateHelpers";
import {
  exportShippingLinesCatalog,
  importShippingLinesCatalog,
  type ShippingLineImportResult,
} from "@/services/catalogs/shippingLineImportExportService";
import { createShippingLine } from "@/services/catalogs/shippingLineService";
import type { ShippingLineFormSubmitPayload } from "./ShippingLineFormModal";
import ShippingLineCard from "./ShippingLineCard";
import ShippingLineFormModal from "./ShippingLineFormModal";
import ShippingLineGroupsModal from "./ShippingLineGroupsModal";
import ShippingLinesEmptyState from "./ShippingLinesEmptyState";
import ShippingLinesHistoryModal from "./ShippingLinesHistoryModal";
import ShippingLinesImportLoadingModal from "./Import/ShippingLinesImportLoadingModal";
import ShippingLinesImportModal from "./Import/ShippingLinesImportModal";
import ShippingLinesImportResultModal from "./Import/ShippingLinesImportResultModal";
import ShippingLinesViewSkeleton from "./ShippingLinesViewSkeleton";

const BATCH_SIZE = 12;

export default function ShippingLinesView() {
  const { user } = useAuth();
  const canWrite = canWriteApp(user?.role);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState(0);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedGroupFilter, setAppliedGroupFilter] = useState(0);
  const [viewError, setViewError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [groupsModalOpen, setGroupsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [importOptionsOpen, setImportOptionsOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFileName, setImportFileName] = useState<string | undefined>();
  const [importResult, setImportResult] =
    useState<ShippingLineImportResult | null>(null);
  const [importResultOpen, setImportResultOpen] = useState(false);

  const { groups } = useShippingLineGroupsCatalog();
  const groupOptions = useMemo(
    () => groups.map((group) => ({ value: group.id, label: group.name })),
    [groups],
  );

  const {
    lines,
    totalCount,
    hasMore,
    isLoading,
    loadingMore,
    error,
    loadMore,
    refresh,
  } = useShippingLinesInfinite(appliedSearch, appliedGroupFilter, BATCH_SIZE);

  useEffect(() => {
    if (error) {
      setViewError(
        getApiErrorMessage(error, "No se pudieron cargar las navieras."),
      );
    }
  }, [error]);

  useEffect(() => {
    setDataActivityHandler(() => {
      setHistoryOpen(true);
    });
    return () => setDataActivityHandler(null);
  }, []);

  const handleExport = useCallback(
    async (format: DataExportFormat) => {
      try {
        setViewError(null);
        await exportShippingLinesCatalog({
          search: appliedSearch,
          group: appliedGroupFilter > 0 ? appliedGroupFilter : undefined,
          exportFormat: format,
        });
      } catch (err) {
        setViewError(getApiErrorMessage(err, "No se pudo exportar."));
      }
    },
    [appliedSearch, appliedGroupFilter],
  );

  useEffect(() => {
    setDataExportHandler(handleExport);
    return () => setDataExportHandler(null);
  }, [handleExport]);

  useEffect(() => {
    if (!canWrite) {
      setDataImportHandler(null);
      return;
    }
    setDataImportHandler(() => {
      setImportOptionsOpen(true);
    });
    return () => setDataImportHandler(null);
  }, [canWrite]);

  async function handleImportFile(file: File) {
    setImportLoading(true);
    setImportFileName(file.name);
    setViewError(null);
    try {
      const result = await importShippingLinesCatalog(file);
      setImportResult(result);
      setImportResultOpen(true);
      await revalidateShippingLinesLists();
      await refresh();
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudo importar el catálogo de navieras."),
      );
    } finally {
      setImportLoading(false);
      setImportFileName(undefined);
    }
  }

  async function handleSave({
    payload,
    logoFile,
    removeLogo,
  }: ShippingLineFormSubmitPayload) {
    setSaving(true);
    try {
      await createShippingLine(payload, { logoFile, removeLogo });
      setModalOpen(false);
      await revalidateShippingLinesLists();
      await refresh();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function applyFilters() {
    setAppliedSearch(search);
    setAppliedGroupFilter(groupFilter);
    setViewError(null);
  }

  function clearFilters() {
    setSearch("");
    setGroupFilter(0);
    setAppliedSearch("");
    setAppliedGroupFilter(0);
    setViewError(null);
  }

  const hasActiveFilters = Boolean(appliedSearch) || appliedGroupFilter > 0;
  const canClearFilters =
    hasActiveFilters || Boolean(search.trim()) || groupFilter > 0;
  const canApplyFilters =
    search.trim() !== appliedSearch || groupFilter !== appliedGroupFilter;

  if (isLoading && lines.length === 0 && !viewError) {
    return <ShippingLinesViewSkeleton />;
  }

  return (
    <>
      <FilterSidebarContent>
        <FilterSuggestField
          label="Buscar"
          name="line_search"
          value={search}
          onChange={setSearch}
          loadSuggestions={suggestShippingLines}
          placeholder="Naviera o barco…"
        />
        <FormFieldSelect<number>
          label="Grupo corporativo"
          name="line_group_filter"
          value={groupFilter}
          onChange={setGroupFilter}
          options={groupOptions}
          optionLabel="Todos los grupos"
          emptyValue={0}
          compact
        />
        <FilterActions
          onApply={applyFilters}
          onClear={clearFilters}
          canClear={canClearFilters}
          canApply={canApplyFilters}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={Anchor}
        title="Navieras"
        description="Selecciona una naviera para ver su ficha y la flota de barcos asociada."
        actions={
          canWrite ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setGroupsModalOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Grupos
              </button>
              <DefaultButton type="button" onClick={() => setModalOpen(true)}>
                <span className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  Nueva naviera
                </span>
              </DefaultButton>
            </div>
          ) : undefined
        }
      />

      {viewError && (
        <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />
      )}

      {isLoading && lines.length === 0 ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : lines.length === 0 ? (
        <ShippingLinesEmptyState
          variant={hasActiveFilters ? "filtered" : "empty"}
          onCreate={canWrite ? () => setModalOpen(true) : undefined}
          onClearFilters={clearFilters}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {lines.map((line) => (
              <ShippingLineCard key={line.id} line={line} />
            ))}
          </div>
          <InfiniteScrollFooter
            hasMore={hasMore}
            loading={loadingMore}
            onLoadMore={loadMore}
            loadedCount={lines.length}
            totalCount={totalCount}
            itemLabel="navieras"
          />
        </>
      )}

      <ShippingLineFormModal
        open={modalOpen}
        mode="create"
        saving={saving}
        onClose={() => !saving && setModalOpen(false)}
        onSubmit={handleSave}
      />

      <ShippingLineGroupsModal
        open={groupsModalOpen}
        onClose={() => setGroupsModalOpen(false)}
      />

      <ShippingLinesHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      <ShippingLinesImportModal
        open={importOptionsOpen}
        onClose={() => !importLoading && setImportOptionsOpen(false)}
        disabled={importLoading}
        onImportFile={(file) => {
          void handleImportFile(file);
        }}
      />

      <ShippingLinesImportLoadingModal
        open={importLoading}
        fileName={importFileName}
      />

      <ShippingLinesImportResultModal
        open={importResultOpen}
        result={importResult}
        onClose={() => setImportResultOpen(false)}
      />
    </>
  );
}
