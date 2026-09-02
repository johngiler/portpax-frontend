"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewFilteredBanner from "@/components/layout/ViewFilteredBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import FilterActions from "@/components/layout/FilterActions";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  setDataExportHandler,
  type DataExportFormat,
} from "@/lib/dataExportStore";
import { exportStructuredReport } from "@/services/bookings/bookingService";
import { fetchPorts } from "@/services/catalogs/portService";
import { portDisplayName } from "@/types/catalog";
import {
  buildReportsActiveFilterChips,
  reportsHasActiveFilters,
} from "./reportsActiveFilterChips";
import ReportsEmptyState from "./ReportsEmptyState";
import {
  defaultReportDateFrom,
  defaultReportDateTo,
} from "./reportsFilterDefaults";
import {
  defaultReportsFilters,
  parseReportsFilters,
  REPORT_PAX_BASIS_OPTIONS,
  serializeReportsFilters,
  type ReportPaxBasis,
  type ReportTab,
  type ReportsWorkspaceFilters,
} from "./reportsFilterQuery";
import PortCarrierMatrixSection from "./PortCarrierMatrixSection";
import PortsTotalsMatrixSection from "./PortsTotalsMatrixSection";
import PortTrendsSection from "./PortTrendsSection";
import ReportGuideModal, { ReportGuideToggle } from "./ReportGuideModal";
import PaxConceptsGuideButton from "@/components/booking/PaxConceptsGuide";
import ReportsViewSkeleton from "./ReportsViewSkeleton";
import {
  ReportMatrixContentSkeleton,
  ReportTrendsContentSkeleton,
} from "./ReportsContentSkeleton";
import {
  useReportInfinite,
  type ReportFilters,
} from "@/hooks/swr/useReportData";
import { useActivePortsCatalog } from "@/hooks/swr/useCatalogs";

function toApplied(filters: ReportsWorkspaceFilters): ReportFilters {
  return {
    tab: filters.tab,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    portFilter: filters.port,
    withoutLta: filters.withoutLta,
    paxBasis: filters.paxBasis,
  };
}

export default function ReportsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initial = useMemo(
    () => parseReportsFilters(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once from URL
    [],
  );

  const [tab, setTab] = useState<ReportTab>(initial.tab);
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [portFilter, setPortFilter] = useState(initial.port);
  const [withoutLta, setWithoutLta] = useState(initial.withoutLta);
  const [paxBasis, setPaxBasis] = useState<ReportPaxBasis>(initial.paxBasis);
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>(() =>
    toApplied(initial),
  );
  const [error, setError] = useState<string | null>(null);
  const [reportGuideOpen, setReportGuideOpen] = useState(false);

  const { ports, isLoading: portsLoading } = useActivePortsCatalog();
  const ready = !portsLoading;

  const {
    payload,
    isLoading,
    loadingMore,
    error: reportError,
    hasMore,
    loadMore,
    loadedCount,
    totalCount,
  } = useReportInfinite(appliedFilters, ready);

  const portsTotals =
    payload?.tab === "ports_totals" ? payload.data : null;
  const portCarrier =
    payload?.tab === "port_carrier" ? payload.data : null;
  const portTrends = payload?.tab === "port_trends" ? payload.data : null;

  useEffect(() => {
    if (reportError) {
      setError(
        getApiErrorMessage(reportError, "No se pudo cargar el reporte."),
      );
    }
  }, [reportError]);

  const syncUrl = useCallback(
    (filters: ReportsWorkspaceFilters) => {
      const qs = serializeReportsFilters(filters).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const draftFilters = useMemo(
    (): ReportsWorkspaceFilters => ({
      tab,
      dateFrom,
      dateTo,
      port: portFilter,
      withoutLta,
      paxBasis,
    }),
    [tab, dateFrom, dateTo, portFilter, withoutLta, paxBasis],
  );

  const portOptions = useMemo(
    () => ports.map((p) => ({ value: p.id, label: p.name, logoUrl: p.logo })),
    [ports],
  );

  const portsById = useMemo(
    () => new Map(ports.map((p) => [p.id, portDisplayName(p)])),
    [ports],
  );

  const hasActiveFilters = reportsHasActiveFilters({
    portFilter: appliedFilters.portFilter,
    dateFrom: appliedFilters.dateFrom,
    dateTo: appliedFilters.dateTo,
    withoutLta: appliedFilters.withoutLta,
    paxBasis: appliedFilters.paxBasis,
  });

  const activeFilterChips = useMemo(
    () =>
      buildReportsActiveFilterChips({
        portLabel:
          appliedFilters.portFilter > 0
            ? portsById.get(appliedFilters.portFilter) ?? null
            : null,
        dateFrom: appliedFilters.dateFrom,
        dateTo: appliedFilters.dateTo,
        withoutLta: appliedFilters.withoutLta,
        paxBasis: appliedFilters.paxBasis,
      }),
    [appliedFilters, portsById],
  );

  const loadPortOptions = useCallback(async (input: string) => {
    const res = await fetchPorts({
      search: input.trim() || undefined,
      pageSize: 30,
    });
    return res.results.map((p) => ({
      value: p.id,
      label: portDisplayName(p),
      logoUrl: p.logo,
    }));
  }, []);

  const defaultDateFrom = defaultReportDateFrom();
  const defaultDateTo = defaultReportDateTo(defaultDateFrom);

  function handleDateFromChange(value: string) {
    setDateFrom(value);
    setDateTo(defaultReportDateTo(value));
  }

  const canClearFilters =
    dateFrom !== defaultDateFrom ||
    dateTo !== defaultDateTo ||
    portFilter > 0 ||
    withoutLta ||
    paxBasis !== "planned";

  const canApplyFilters =
    dateFrom !== appliedFilters.dateFrom ||
    dateTo !== appliedFilters.dateTo ||
    portFilter !== appliedFilters.portFilter ||
    withoutLta !== appliedFilters.withoutLta ||
    paxBasis !== appliedFilters.paxBasis ||
    tab !== appliedFilters.tab;

  function clearFilters() {
    const clean = defaultReportsFilters();
    const next = { ...clean, tab };
    setDateFrom(next.dateFrom);
    setDateTo(next.dateTo);
    setPortFilter(0);
    setWithoutLta(false);
    setPaxBasis("planned");
    setError(null);
    const applied = toApplied(next);
    setAppliedFilters(applied);
    syncUrl(next);
  }

  function applyFilters() {
    setError(null);
    const next = draftFilters;
    setAppliedFilters(toApplied(next));
    syncUrl(next);
  }

  function handleTabChange(value: ReportTab) {
    setTab(value);
    setError(null);
  }

  const handleExport = useCallback(
    async (_format: DataExportFormat) => {
      setError(null);
      try {
        const {
          tab: appliedTab,
          dateFrom: appliedDateFrom,
          dateTo: appliedDateTo,
          portFilter: appliedPortFilter,
          withoutLta: appliedWithoutLta,
          paxBasis: appliedPaxBasis,
        } = appliedFilters;

        if (appliedTab === "ports_totals") {
          await exportStructuredReport({
            report_type: "ports_totals_matrix",
            date_from: appliedDateFrom,
            date_to: appliedDateTo,
            without_lta: appliedWithoutLta,
            pax_basis: appliedPaxBasis,
            exportFormat: "xlsx",
          });
          return;
        }
        if (appliedTab === "port_carrier") {
          if (!appliedPortFilter) {
            setError("Selecciona un puerto para exportar.");
            return;
          }
          await exportStructuredReport({
            report_type: "port_carrier_matrix",
            date_from: appliedDateFrom,
            date_to: appliedDateTo,
            port: appliedPortFilter,
            without_lta: appliedWithoutLta,
            pax_basis: appliedPaxBasis,
            exportFormat: "xlsx",
          });
          return;
        }
        if (!appliedPortFilter) {
          setError("Selecciona un puerto para exportar.");
          return;
        }
        await exportStructuredReport({
          report_type: "port_trends",
          date_from: appliedDateFrom,
          date_to: appliedDateTo,
          port: appliedPortFilter,
          without_lta: appliedWithoutLta,
          pax_basis: appliedPaxBasis,
          exportFormat: "xlsx",
        });
      } catch (err) {
        setError(getApiErrorMessage(err, "No se pudo exportar el reporte."));
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    setDataExportHandler(handleExport);
    return () => setDataExportHandler(null);
  }, [handleExport]);

  if (!ready) return <ReportsViewSkeleton />;

  const showPortFilter = tab !== "ports_totals";
  const portRequired = tab === "port_carrier" || tab === "port_trends";
  const loading = isLoading;

  return (
    <>
      <FilterSidebarContent>
        <FormFieldSelect<ReportTab>
          label="Reporte"
          name="report_tab"
          value={tab}
          onChange={handleTabChange}
          options={[
            { value: "ports_totals", label: "Totals puertos" },
            { value: "port_carrier", label: "Totals por puerto" },
            { value: "port_trends", label: "Trends por puerto" },
          ]}
          compact
          labelEnd={
            <ReportGuideToggle onOpen={() => setReportGuideOpen(true)} />
          }
        />
        <ReportGuideModal
          open={reportGuideOpen}
          onClose={() => setReportGuideOpen(false)}
        />
        {showPortFilter ? (
          <FormFieldSelect<number>
            label="Puerto"
            name="report_port"
            value={portFilter}
            onChange={(v) => setPortFilter(Number(v))}
            options={portOptions}
            loadOptions={loadPortOptions}
            optionLabel={
              portRequired
                ? "Selecciona un puerto"
                : "Todos los puertos"
            }
            emptyValue={0}
            compact
            showLogo
            logoKind="port"
          />
        ) : null}
        <FormFieldSelect<ReportPaxBasis>
          label="Base PAX"
          name="report_pax_basis"
          value={paxBasis}
          onChange={setPaxBasis}
          options={REPORT_PAX_BASIS_OPTIONS}
          compact
          labelEnd={<PaxConceptsGuideButton includeReportsBasis />}
        />
        <FormField
          label="Desde"
          name="report_date_from"
          type="date"
          value={dateFrom}
          onChange={(value) => handleDateFromChange(String(value))}
          compact
        />
        <FormField
          label="Hasta"
          name="report_date_to"
          type="date"
          value={dateTo}
          onChange={(value) => setDateTo(String(value))}
          compact
        />
        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={withoutLta}
            onChange={(e) => setWithoutLta(e.target.checked)}
            className="rounded border-zinc-300"
          />
          Sin LTA / CL / LTD
        </label>
        <FilterActions
          onApply={applyFilters}
          onClear={clearFilters}
          canClear={canClearFilters}
          canApply={canApplyFilters}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={BarChart3}
        title="Reportes"
        description="Matrices operativas de calls y PAX por puerto y naviera."
      />

      {hasActiveFilters ? (
        <ViewFilteredBanner onClear={clearFilters} chips={activeFilterChips} />
      ) : null}

      {error ? (
        <ViewErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}

      {loading ? (
        appliedFilters.tab === "port_trends" ? (
          <ReportTrendsContentSkeleton />
        ) : (
          <ReportMatrixContentSkeleton
            sectionCount={appliedFilters.tab === "ports_totals" ? 2 : 1}
          />
        )
      ) : appliedFilters.tab === "ports_totals" && portsTotals ? (
        <PortsTotalsMatrixSection
          data={portsTotals}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          loadedCount={loadedCount}
          totalCount={totalCount}
        />
      ) : appliedFilters.tab === "port_carrier" && !appliedFilters.portFilter ? (
        <ReportsEmptyState variant="missing_port_carrier" />
      ) : appliedFilters.tab === "port_carrier" && portCarrier ? (
        <PortCarrierMatrixSection
          data={portCarrier}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          loadedCount={loadedCount}
          totalCount={totalCount}
        />
      ) : appliedFilters.tab === "port_trends" && !appliedFilters.portFilter ? (
        <ReportsEmptyState variant="missing_port_trends" />
      ) : appliedFilters.tab === "port_trends" && portTrends ? (
        <PortTrendsSection
          data={portTrends}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          loadedCount={loadedCount}
          totalCount={totalCount}
        />
      ) : null}
    </>
  );
}
