"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewFilteredBanner from "@/components/layout/ViewFilteredBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import FilterActions from "@/components/layout/FilterActions";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { addYearsToIsoDate } from "@/lib/bookingDates";
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
import PortCarrierMatrixSection from "./PortCarrierMatrixSection";
import PortsTotalsMatrixSection from "./PortsTotalsMatrixSection";
import PortTrendsSection from "./PortTrendsSection";
import ReportGuideModal, { ReportGuideToggle } from "./ReportGuideModal";
import ReportsViewSkeleton from "./ReportsViewSkeleton";
import {
  ReportMatrixContentSkeleton,
  ReportTrendsContentSkeleton,
} from "./ReportsContentSkeleton";
import {
  useReportInfinite,
  type ReportFilters,
  type ReportTab,
} from "@/hooks/swr/useReportData";
import { useActivePortsCatalog } from "@/hooks/swr/useCatalogs";

export default function ReportsView() {
  const [tab, setTab] = useState<ReportTab>("ports_totals");
  const [dateFrom, setDateFrom] = useState(defaultReportDateFrom);
  const [dateTo, setDateTo] = useState(() =>
    defaultReportDateTo(defaultReportDateFrom()),
  );
  const [portFilter, setPortFilter] = useState(0);
  const [withoutLta, setWithoutLta] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>({
    tab: "ports_totals",
    dateFrom: defaultReportDateFrom(),
    dateTo: defaultReportDateTo(),
    portFilter: 0,
    withoutLta: false,
  });
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

  const portOptions = useMemo(
    () => ports.map((p) => ({ value: p.id, label: p.name, logoUrl: p.logo })),
    [ports],
  );

  const portsById = useMemo(
    () => new Map(ports.map((p) => [p.id, portDisplayName(p)])),
    [ports],
  );

  const hasActiveFilters = reportsHasActiveFilters(appliedFilters);

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
    withoutLta;

  const canApplyFilters =
    dateFrom !== appliedFilters.dateFrom ||
    dateTo !== appliedFilters.dateTo ||
    portFilter !== appliedFilters.portFilter ||
    withoutLta !== appliedFilters.withoutLta ||
    tab !== appliedFilters.tab;

  function clearFilters() {
    const cleanDateFrom = defaultReportDateFrom();
    const cleanDateTo = defaultReportDateTo(cleanDateFrom);
    setDateFrom(cleanDateFrom);
    setDateTo(cleanDateTo);
    setPortFilter(0);
    setWithoutLta(false);
    setError(null);
    setAppliedFilters({
      tab,
      dateFrom: cleanDateFrom,
      dateTo: cleanDateTo,
      portFilter: 0,
      withoutLta: false,
    });
  }

  function applyFilters() {
    setError(null);
    setAppliedFilters({
      tab,
      dateFrom,
      dateTo,
      portFilter,
      withoutLta,
    });
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
        } = appliedFilters;

        if (appliedTab === "ports_totals") {
          await exportStructuredReport({
            report_type: "ports_totals_matrix",
            date_from: appliedDateFrom,
            date_to: appliedDateTo,
            without_lta: appliedWithoutLta,
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
          onChange={(value) => {
            setTab(value);
            const from = defaultReportDateFrom();
            setDateFrom(from);
            setDateTo(defaultReportDateTo(from));
            setPortFilter(0);
            setWithoutLta(false);
            setError(null);
          }}
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
