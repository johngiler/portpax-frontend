"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewFilteredBanner from "@/components/layout/ViewFilteredBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import {
  FormField,
  FormFieldMultiSelect,
  FormFieldSelect,
} from "@/components/ui/FormField";
import FilterActions from "@/components/layout/FilterActions";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  setDataExportHandler,
  type DataExportFormat,
} from "@/lib/dataExportStore";
import { exportStructuredReport } from "@/services/bookings/bookingService";
import { suggestBookingTags } from "@/services/bookings/bookingTagService";
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
  dateRangeFromSolicitudesYears,
  defaultMovementYear,
  parseReportsFilters,
  REPORT_PAX_BASIS_OPTIONS,
  reportsFiltersForTab,
  serializeReportsFilters,
  solicitudesYearOptions,
  yearsInReportRange,
  type ReportPaxBasis,
  type ReportTab,
  type ReportsWorkspaceFilters,
} from "./reportsFilterQuery";
import BookingMovementsSection from "./BookingMovementsSection";
import PortCarrierMatrixSection from "./PortCarrierMatrixSection";
import PortsTotalsMatrixSection from "./PortsTotalsMatrixSection";
import PortTrendsSection from "./PortTrendsSection";
import SolicitudesPortSection from "./SolicitudesPortSection";
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
import { useActivePortsCatalog, useActiveShippingLinesCatalog } from "@/hooks/swr/useCatalogs";

type AppliedReportsFilters = ReportFilters & {
  years: number[];
  tagIds: number[];
  shippingLineId: number;
};

function toApplied(filters: ReportsWorkspaceFilters): AppliedReportsFilters {
  const range =
    filters.tab === "solicitudes_port" || filters.tab === "booking_movements"
      ? dateRangeFromSolicitudesYears(filters.years)
      : { dateFrom: filters.dateFrom, dateTo: filters.dateTo };
  return {
    tab: filters.tab,
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    portFilter: filters.port,
    withoutLta: filters.withoutLta,
    paxBasis: filters.paxBasis,
    years: filters.years,
    tagIds: filters.tagIds,
    shippingLineId: filters.shippingLineId,
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
  const [years, setYears] = useState<number[]>(initial.years);
  const [tagIds, setTagIds] = useState<number[]>(initial.tagIds);
  const [shippingLineId, setShippingLineId] = useState(initial.shippingLineId);
  const [tagOptions, setTagOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [appliedFilters, setAppliedFilters] = useState<AppliedReportsFilters>(
    () => toApplied(initial),
  );
  const [error, setError] = useState<string | null>(null);
  const [reportGuideOpen, setReportGuideOpen] = useState(false);

  const { ports, isLoading: portsLoading } = useActivePortsCatalog();
  const { lines: shippingLines } = useActiveShippingLinesCatalog(
    tab === "solicitudes_port",
  );
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

  useEffect(() => {
    if (tab !== "solicitudes_port") return;
    let cancelled = false;
    void suggestBookingTags("", 50).then((rows) => {
      if (cancelled) return;
      setTagOptions(
        rows.map((t) => ({ value: t.id, label: t.name })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [tab]);

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
      years,
      tagIds,
      shippingLineId,
    }),
    [
      tab,
      dateFrom,
      dateTo,
      portFilter,
      withoutLta,
      paxBasis,
      years,
      tagIds,
      shippingLineId,
    ],
  );

  const portOptions = useMemo(
    () => ports.map((p) => ({ value: p.id, label: p.name, logoUrl: p.logo })),
    [ports],
  );

  const portsById = useMemo(
    () => new Map(ports.map((p) => [p.id, portDisplayName(p)])),
    [ports],
  );

  const yearOptions = useMemo(
    () =>
      (tab === "solicitudes_port" || tab === "booking_movements"
        ? solicitudesYearOptions()
        : yearsInReportRange(dateFrom, dateTo)
      ).map((y) => ({
        value: y,
        label: String(y),
      })),
    [tab, dateFrom, dateTo],
  );

  const shippingLineOptions = useMemo(
    () =>
      shippingLines.map((line) => ({
        value: line.id,
        label: line.name,
        logoUrl: line.logo,
      })),
    [shippingLines],
  );

  const shippingLineLabelsById = useMemo(
    () => new Map(shippingLines.map((line) => [line.id, line.name])),
    [shippingLines],
  );

  const tagLabelsById = useMemo(
    () => new Map(tagOptions.map((t) => [t.value, t.label])),
    [tagOptions],
  );

  const hasActiveFilters = reportsHasActiveFilters({
    tab: appliedFilters.tab,
    portFilter: appliedFilters.portFilter,
    dateFrom: appliedFilters.dateFrom,
    dateTo: appliedFilters.dateTo,
    withoutLta: appliedFilters.withoutLta,
    paxBasis: appliedFilters.paxBasis,
    years: appliedFilters.years,
    tagIds: appliedFilters.tagIds,
    shippingLineId: appliedFilters.shippingLineId,
  });

  const activeFilterChips = useMemo(
    () =>
      buildReportsActiveFilterChips({
        tab: appliedFilters.tab,
        portLabel:
          appliedFilters.portFilter > 0
            ? portsById.get(appliedFilters.portFilter) ?? null
            : null,
        dateFrom: appliedFilters.dateFrom,
        dateTo: appliedFilters.dateTo,
        withoutLta: appliedFilters.withoutLta,
        paxBasis: appliedFilters.paxBasis,
        years: appliedFilters.years,
        tagLabels: appliedFilters.tagIds
          .map((id) => tagLabelsById.get(id))
          .filter((label): label is string => Boolean(label)),
        shippingLineLabel:
          appliedFilters.shippingLineId > 0
            ? shippingLineLabelsById.get(appliedFilters.shippingLineId) ?? null
            : null,
      }),
    [appliedFilters, portsById, tagLabelsById, shippingLineLabelsById],
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
    const nextTo = defaultReportDateTo(value);
    setDateTo(nextTo);
    const allowed = new Set(yearsInReportRange(value, nextTo));
    setYears((prev) => prev.filter((y) => allowed.has(y)));
  }

  function handleDateToChange(value: string) {
    setDateTo(value);
    const allowed = new Set(yearsInReportRange(dateFrom, value));
    setYears((prev) => prev.filter((y) => allowed.has(y)));
  }

  const canClearFilters =
    tab === "booking_movements"
      ? (years[0] ?? 0) !== defaultMovementYear() ||
        (appliedFilters.years[0] ?? 0) !== defaultMovementYear()
      : tab === "solicitudes_port"
        ? portFilter > 0 ||
          withoutLta ||
          paxBasis !== "planned" ||
          years.length > 0 ||
          tagIds.length > 0 ||
          shippingLineId > 0
        : dateFrom !== defaultDateFrom ||
          dateTo !== defaultDateTo ||
          portFilter > 0 ||
          withoutLta ||
          paxBasis !== "planned" ||
          years.length > 0 ||
          tagIds.length > 0 ||
          shippingLineId > 0;

  const canApplyFilters =
    dateFrom !== appliedFilters.dateFrom ||
    dateTo !== appliedFilters.dateTo ||
    portFilter !== appliedFilters.portFilter ||
    withoutLta !== appliedFilters.withoutLta ||
    paxBasis !== appliedFilters.paxBasis ||
    tab !== appliedFilters.tab ||
    years.join(",") !== appliedFilters.years.join(",") ||
    tagIds.join(",") !== appliedFilters.tagIds.join(",") ||
    shippingLineId !== appliedFilters.shippingLineId;

  // Year-driven tabs: don't treat draft date drift as dirty.
  const canApplyYearDriven =
    portFilter !== appliedFilters.portFilter ||
    withoutLta !== appliedFilters.withoutLta ||
    paxBasis !== appliedFilters.paxBasis ||
    tab !== appliedFilters.tab ||
    years.join(",") !== appliedFilters.years.join(",") ||
    tagIds.join(",") !== appliedFilters.tagIds.join(",") ||
    shippingLineId !== appliedFilters.shippingLineId;

  const canApply =
    tab === "solicitudes_port" || tab === "booking_movements"
      ? canApplyYearDriven
      : canApplyFilters;

  function clearFilters() {
    const clean = defaultReportsFilters();
    const next =
      tab === "booking_movements"
        ? { ...clean, tab, years: [defaultMovementYear()] }
        : { ...clean, tab };
    setDateFrom(next.dateFrom);
    setDateTo(next.dateTo);
    setPortFilter(0);
    setWithoutLta(false);
    setPaxBasis("planned");
    setYears(next.years);
    setTagIds([]);
    setShippingLineId(0);
    setError(null);
    const applied = toApplied(next);
    setAppliedFilters(applied);
    syncUrl(next);
  }

  function applyFilters() {
    setError(null);
    const next =
      tab === "booking_movements"
        ? {
            ...draftFilters,
            years: [years[0] ?? defaultMovementYear()],
          }
        : draftFilters;
    setAppliedFilters(toApplied(next));
    syncUrl(next);
  }

  function handleTabChange(value: ReportTab) {
    const next = reportsFiltersForTab(draftFilters, value);
    setTab(next.tab);
    setPortFilter(next.port);
    setWithoutLta(next.withoutLta);
    setPaxBasis(next.paxBasis);
    setYears(next.years);
    setTagIds(next.tagIds);
    setShippingLineId(next.shippingLineId);
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
          years: appliedYears,
          tagIds: appliedTagIds,
          shippingLineId: appliedShippingLineId,
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
        if (appliedTab === "solicitudes_port") {
          if (!appliedPortFilter) {
            setError("Selecciona un puerto para exportar.");
            return;
          }
          if (!appliedShippingLineId) {
            setError("Selecciona una naviera para exportar.");
            return;
          }
          await exportStructuredReport({
            report_type: "solicitudes_port",
            date_from: appliedDateFrom,
            date_to: appliedDateTo,
            port: appliedPortFilter,
            without_lta: appliedWithoutLta,
            pax_basis: appliedPaxBasis,
            years: appliedYears,
            tags: appliedTagIds,
            shipping_line: appliedShippingLineId,
            exportFormat: "xlsx",
          });
          return;
        }
        if (appliedTab === "booking_movements") {
          const year = appliedYears[0] ?? defaultMovementYear();
          await exportStructuredReport({
            report_type: "booking_movements",
            year,
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

  const showPortFilter =
    tab !== "ports_totals" && tab !== "booking_movements";
  const portRequired =
    tab === "port_carrier" ||
    tab === "port_trends" ||
    tab === "solicitudes_port";
  const showSolicitudesFilters = tab === "solicitudes_port";
  const showMovementsFilters = tab === "booking_movements";
  const showSharedReportFilters = !showMovementsFilters;
  const loading =
    appliedFilters.tab !== "solicitudes_port" &&
    appliedFilters.tab !== "booking_movements" &&
    isLoading;

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
            {
              value: "solicitudes_port",
              label: "Resumen de movimientos",
            },
            {
              value: "booking_movements",
              label: "Movimientos de bookings",
            },
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
        {showSolicitudesFilters ? (
          <>
            <FormFieldSelect<number>
              label="Naviera"
              name="report_shipping_line"
              value={shippingLineId}
              onChange={(v) => setShippingLineId(Number(v))}
              options={shippingLineOptions}
              optionLabel="Selecciona una naviera"
              emptyValue={0}
              compact
              showLogo
              logoKind="shipping_line"
            />
            <FormFieldMultiSelect<number>
              label="Años"
              name="report_years"
              value={years}
              onChange={setYears}
              options={yearOptions}
              placeholder="Todos desde 2025"
              compact
            />
            <FormFieldMultiSelect<number>
              label="Tags"
              name="report_tags"
              value={tagIds}
              onChange={setTagIds}
              options={tagOptions}
              placeholder="Todos los tags"
              compact
            />
          </>
        ) : null}
        {showMovementsFilters ? (
          <FormFieldSelect<number>
            label="Año"
            name="report_movement_year"
            value={years[0] ?? defaultMovementYear()}
            onChange={(v) => setYears([Number(v)])}
            options={yearOptions}
            compact
          />
        ) : null}
        {showSharedReportFilters ? (
          <FormFieldSelect<ReportPaxBasis>
            label="Base PAX"
            name="report_pax_basis"
            value={paxBasis}
            onChange={setPaxBasis}
            options={REPORT_PAX_BASIS_OPTIONS}
            compact
            labelEnd={<PaxConceptsGuideButton includeReportsBasis />}
          />
        ) : null}
        {showSharedReportFilters && !showSolicitudesFilters ? (
          <>
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
              onChange={(value) => handleDateToChange(String(value))}
              compact
            />
          </>
        ) : null}
        {showSharedReportFilters ? (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={withoutLta}
              onChange={(e) => setWithoutLta(e.target.checked)}
              className="rounded border-zinc-300"
            />
            Sin LTA
          </label>
        ) : null}
        <FilterActions
          onApply={applyFilters}
          onClear={clearFilters}
          canClear={canClearFilters}
          canApply={canApply}
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
      ) : appliedFilters.tab === "solicitudes_port" ? (
        <SolicitudesPortSection
          enabled
          dateFrom={appliedFilters.dateFrom}
          dateTo={appliedFilters.dateTo}
          portId={appliedFilters.portFilter}
          years={appliedFilters.years}
          tagIds={appliedFilters.tagIds}
          shippingLineId={appliedFilters.shippingLineId}
          withoutLta={appliedFilters.withoutLta}
          paxBasis={appliedFilters.paxBasis}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      ) : appliedFilters.tab === "booking_movements" ? (
        <BookingMovementsSection
          enabled
          year={appliedFilters.years[0] ?? defaultMovementYear()}
        />
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
