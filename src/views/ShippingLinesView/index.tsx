"use client";

import { useCallback, useEffect, useState } from "react";
import { Anchor, Plus } from "lucide-react";
import DefaultButton from "@/components/buttons/DefaultButton";
import FilterActions from "@/components/layout/FilterActions";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { createShippingLine, fetchShippingLines } from "@/services/catalogs/shippingLineService";
import { fetchShippingLineGroups } from "@/services/catalogs/shippingLineGroupService";
import type { ShippingLineFormSubmitPayload } from "./ShippingLineFormModal";
import ShippingLineCard from "./ShippingLineCard";
import ShippingLineFormModal from "./ShippingLineFormModal";
import ShippingLinesEmptyState from "./ShippingLinesEmptyState";
import ShippingLinesViewSkeleton from "./ShippingLinesViewSkeleton";

const BATCH_SIZE = 12;

export default function ShippingLinesView() {
  const [lines, setLines] = useState<Awaited<ReturnType<typeof fetchShippingLines>>["results"]>(
    [],
  );
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState(0);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedGroupFilter, setAppliedGroupFilter] = useState(0);
  const [groupOptions, setGroupOptions] = useState<{ value: number; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchShippingLineGroups()
      .then((groups) =>
        setGroupOptions(groups.map((group) => ({ value: group.id, label: group.name }))),
      )
      .catch(() => setGroupOptions([]));
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setViewError(null);
    try {
      const data = await fetchShippingLines({
        page: 1,
        search: appliedSearch,
        group: appliedGroupFilter > 0 ? appliedGroupFilter : undefined,
        pageSize: BATCH_SIZE,
      });
      setLines(data.results);
      setTotalCount(data.count);
      setPage(1);
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudieron cargar las navieras."),
      );
      setLines([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, appliedGroupFilter]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || lines.length >= totalCount) return;
    setLoadingMore(true);
    setViewError(null);
    try {
      const nextPage = page + 1;
      const data = await fetchShippingLines({
        page: nextPage,
        search: appliedSearch,
        group: appliedGroupFilter > 0 ? appliedGroupFilter : undefined,
        pageSize: BATCH_SIZE,
      });
      setLines((prev) => [...prev, ...data.results]);
      setPage(nextPage);
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudieron cargar más navieras."),
      );
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, lines.length, totalCount, page, appliedSearch, appliedGroupFilter]);

  async function handleSave({ payload, logoFile, removeLogo }: ShippingLineFormSubmitPayload) {
    setSaving(true);
    try {
      await createShippingLine(payload, { logoFile, removeLogo });
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
    setAppliedGroupFilter(groupFilter);
  }

  function clearFilters() {
    setSearch("");
    setGroupFilter(0);
    setAppliedSearch("");
    setAppliedGroupFilter(0);
  }

  const hasActiveFilters = Boolean(appliedSearch) || appliedGroupFilter > 0;
  const canClearFilters =
    hasActiveFilters || Boolean(search.trim()) || groupFilter > 0;

  const hasMore = lines.length < totalCount;

  if (loading && lines.length === 0 && !viewError) {
    return <ShippingLinesViewSkeleton />;
  }

  return (
    <>
      <FilterSidebarContent>
        <FormField
          label="Buscar"
          name="line_search"
          value={search}
          onChange={(value) => setSearch(String(value))}
          placeholder="Marca, código…"
          compact
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
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={Anchor}
        title="Navieras"
        description="Selecciona una naviera para ver su ficha y la flota de barcos asociada."
        actions={
          <DefaultButton type="button" onClick={() => setModalOpen(true)}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nueva naviera
            </span>
          </DefaultButton>
        }
      />

      {viewError && <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />}

      {loading && lines.length === 0 ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : lines.length === 0 ? (
        <ShippingLinesEmptyState
          filtered={hasActiveFilters}
          onCreate={() => setModalOpen(true)}
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
    </>
  );
}
