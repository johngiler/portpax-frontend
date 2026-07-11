"use client";

import { MapPin, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import { FormField } from "@/components/ui/FormField";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { createPort, fetchPorts } from "@/services/catalogs/portService";
import type { Port } from "@/types/catalog";
import PortCard from "./PortCard";
import PortFormModal, { type PortFormSubmitPayload } from "./PortFormModal";
import PortsViewSkeleton from "./PortsViewSkeleton";

const BATCH_SIZE = 12;

export default function PortsView() {
  const [ports, setPorts] = useState<Port[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setViewError(null);
    try {
      const data = await fetchPorts({ page: 1, search: appliedSearch, pageSize: BATCH_SIZE });
      setPorts(data.results);
      setTotalCount(data.count);
      setPage(1);
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudieron cargar los puertos."),
      );
      setPorts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || ports.length >= totalCount) return;
    setLoadingMore(true);
    setViewError(null);
    try {
      const nextPage = page + 1;
      const data = await fetchPorts({
        page: nextPage,
        search: appliedSearch,
        pageSize: BATCH_SIZE,
      });
      setPorts((prev) => [...prev, ...data.results]);
      setPage(nextPage);
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudieron cargar más puertos."),
      );
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, ports.length, totalCount, page, appliedSearch]);

  async function handleSave({ payload, logoFile, removeLogo }: PortFormSubmitPayload) {
    setSaving(true);
    try {
      await createPort(payload, { logoFile, removeLogo });
      setModalOpen(false);
      await loadInitial();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function applyFilters() {
    setAppliedSearch(search);
  }

  const hasMore = ports.length < totalCount;

  if (loading && ports.length === 0 && !viewError) {
    return <PortsViewSkeleton />;
  }

  return (
    <>
      <FilterSidebarContent>
        <FormField
          label="Buscar"
          name="port_search"
          value={search}
          onChange={(v) => setSearch(String(v))}
          placeholder="Nombre, código, país…"
          compact
        />
        <DefaultButton type="button" onClick={applyFilters} className="w-full text-xs">
          Aplicar
        </DefaultButton>
      </FilterSidebarContent>

      <ViewPageHeader
        icon={MapPin}
        title="Puertos"
        description="Selecciona un puerto para ver su ficha, muelles, bitas y posiciones."
        actions={
          <DefaultButton type="button" onClick={() => setModalOpen(true)}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nuevo puerto
            </span>
          </DefaultButton>
        }
      />

      {viewError && <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />}

      {loading && ports.length === 0 ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : ports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <p className="text-sm text-zinc-500">
            {appliedSearch
              ? "Ningún puerto coincide con los filtros."
              : "No hay puertos registrados."}
          </p>
        </div>
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
    </>
  );
}
