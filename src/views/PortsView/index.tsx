"use client";

import { LucideWaves, MapPin, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import FilterActions from "@/components/layout/FilterActions";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import FilterSuggestField from "@/components/layout/FilterSuggestField";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { useAuth } from "@/contexts/AuthContext";
import { usePortsInfinite } from "@/hooks/swr/usePortsInfinite";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { setDataActivityHandler } from "@/lib/dataActivityStore";
import { suggestPorts } from "@/lib/filterSuggestions";
import { canWriteApp } from "@/lib/navAccess";
import { revalidatePortsLists } from "@/lib/swr/mutateHelpers";
import { createPort } from "@/services/catalogs/portService";
import PortCard from "./PortCard";
import PortFormModal, { type PortFormSubmitPayload } from "./PortFormModal";
import PortsProximityModal from "./PortsProximityModal";
import PortsEmptyState from "./PortsEmptyState";
import PortsHistoryModal from "./PortsHistoryModal";
import PortsViewSkeleton from "./PortsViewSkeleton";

const BATCH_SIZE = 12;

export default function PortsView() {
  const { user } = useAuth();
  const canWrite = canWriteApp(user?.role);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [viewError, setViewError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [proximityOpen, setProximityOpen] = useState(false);

  const {
    ports,
    totalCount,
    hasMore,
    isLoading,
    loadingMore,
    error,
    loadMore,
    refresh,
  } = usePortsInfinite(appliedSearch, BATCH_SIZE);

  useEffect(() => {
    if (error) {
      setViewError(
        getApiErrorMessage(error, "No se pudieron cargar los puertos."),
      );
    }
  }, [error]);

  useEffect(() => {
    setDataActivityHandler(() => {
      setHistoryOpen(true);
    });
    return () => setDataActivityHandler(null);
  }, []);

  async function handleSave({ payload, logoFile, removeLogo }: PortFormSubmitPayload) {
    setSaving(true);
    try {
      await createPort(payload, { logoFile, removeLogo });
      setModalOpen(false);
      await revalidatePortsLists();
      await refresh();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function applyFilters() {
    setAppliedSearch(search);
    setViewError(null);
  }

  function clearFilters() {
    setSearch("");
    setAppliedSearch("");
    setViewError(null);
  }

  const canClearFilters = Boolean(search.trim()) || Boolean(appliedSearch);
  const canApplyFilters = search.trim() !== appliedSearch;
  const hasActiveFilters = Boolean(appliedSearch);

  if (isLoading && ports.length === 0 && !viewError) {
    return <PortsViewSkeleton />;
  }

  return (
    <>
      <FilterSidebarContent>
        <FilterSuggestField
          label="Buscar"
          name="port_search"
          value={search}
          onChange={setSearch}
          loadSuggestions={suggestPorts}
          placeholder="Nombre, código, país…"
        />
        <FilterActions
          onApply={applyFilters}
          onClear={clearFilters}
          canClear={canClearFilters}
          canApply={canApplyFilters}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={MapPin}
        title="Puertos"
        description="Selecciona un puerto para ver su ficha, muelles, bitas y posiciones."
        actions={
          <div className="flex items-center gap-3">
            <DefaultButton type="button" onClick={() => setProximityOpen(true)}>
              <span className="inline-flex items-center gap-2">
                <LucideWaves className="h-4 w-4" strokeWidth={2} />
                Proximidad
              </span>
            </DefaultButton>
            {canWrite ? (
              <DefaultButton type="button" onClick={() => setModalOpen(true)}>
                <span className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  Nuevo puerto
                </span>
              </DefaultButton>
            ) : undefined}
          </div>
        }
      />

      {viewError && (
        <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />
      )}

      {isLoading && ports.length === 0 ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : ports.length === 0 ? (
        <PortsEmptyState
          variant={hasActiveFilters ? "filtered" : "empty"}
          onCreate={canWrite ? () => setModalOpen(true) : undefined}
          onClearFilters={clearFilters}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ports.map((port) => (
              <PortCard key={port.id} port={port} />
            ))}
          </div>
          <InfiniteScrollFooter
            hasMore={hasMore}
            loading={loadingMore}
            onLoadMore={loadMore}
            loadedCount={ports.length}
            totalCount={totalCount}
            itemLabel="puertos"
          />
        </>
      )}

      <PortFormModal
        open={modalOpen}
        mode="create"
        saving={saving}
        onClose={() => !saving && setModalOpen(false)}
        onSubmit={handleSave}
      />

      <PortsHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      <PortsProximityModal open={proximityOpen} onClose={() => setProximityOpen(false)} />
    </>
  );
}
