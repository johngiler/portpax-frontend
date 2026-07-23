"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, FileText } from "lucide-react";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import ViewSection from "@/components/layout/ViewSection";
import ViewStatCard from "@/components/layout/ViewStatCard";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import FilterActions from "@/components/layout/FilterActions";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import {
  useActivePortsCatalog,
  useActiveShippingLinesCatalog,
} from "@/hooks/swr/useCatalogs";
import {
  useReportData,
  type ReportFilters,
  type ReportTab,
} from "@/hooks/swr/useReportData";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { toIsoDate } from "@/lib/bookingDates";
import {
  setDataExportHandler,
  type DataExportFormat,
} from "@/lib/dataExportStore";
import {
  exportBookingsReport,
  exportStructuredReport,
} from "@/services/bookings/bookingService";
import CarrierPanoramaSection from "./CarrierPanoramaSection";
import CumplimientoRealSection from "./CumplimientoRealSection";
import ReportGuideModal, { ReportGuideToggle } from "./ReportGuideModal";
import ReportsViewSkeleton from "./ReportsViewSkeleton";
import ReportLogoName from "./ReportLogoName";

function yearStart(): string {
  const y = new Date().getFullYear();
  return toIsoDate(y, 0, 1);
}

function todayIso(): string {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function weekAgoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function ReportsView() {
  const [tab, setTab] = useState<ReportTab>("totals");
  const [dateFrom, setDateFrom] = useState(yearStart);
  const [dateTo, setDateTo] = useState(todayIso);
  const [portFilter, setPortFilter] = useState(0);
  const [lineFilter, setLineFilter] = useState(0);
  const [withoutLta, setWithoutLta] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>({
    tab: "totals",
    dateFrom: yearStart(),
    dateTo: todayIso(),
    portFilter: 0,
    lineFilter: 0,
    withoutLta: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [reportGuideOpen, setReportGuideOpen] = useState(false);

  const { ports, isLoading: portsLoading } = useActivePortsCatalog();
  const { lines, isLoading: linesLoading } = useActiveShippingLinesCatalog();
  const ready = !portsLoading && !linesLoading;

  const { payload, isLoading, error: reportError } = useReportData(
    appliedFilters,
    ready,
  );

  const totals = payload?.tab === "totals" ? payload.data : null;
  const movements = payload?.tab === "movements" ? payload.data : null;
  const panorama = payload?.tab === "panorama" ? payload.data : null;
  const cumplimiento = payload?.tab === "cumplimiento" ? payload.data : null;

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
  const lineOptions = useMemo(
    () => lines.map((l) => ({ value: l.id, label: l.name, logoUrl: l.logo })),
    [lines],
  );

  const defaultDateFrom = tab === "movements" ? weekAgoIso() : yearStart();
  const defaultDateTo = todayIso();

  const canClearFilters =
    dateFrom !== defaultDateFrom ||
    dateTo !== defaultDateTo ||
    portFilter > 0 ||
    lineFilter > 0 ||
    withoutLta;

  function clearFilters() {
    const cleanDateFrom = tab === "movements" ? weekAgoIso() : yearStart();
    const cleanDateTo = todayIso();
    setDateFrom(cleanDateFrom);
    setDateTo(cleanDateTo);
    setPortFilter(0);
    setLineFilter(0);
    setWithoutLta(false);
    setError(null);
    setAppliedFilters({
      tab,
      dateFrom: cleanDateFrom,
      dateTo: cleanDateTo,
      portFilter: 0,
      lineFilter: 0,
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
      lineFilter,
      withoutLta,
    });
  }

  const handleExport = useCallback(
    async (format: DataExportFormat) => {
      const {
        tab: appliedTab,
        dateFrom: appliedDateFrom,
        dateTo: appliedDateTo,
        portFilter: appliedPortFilter,
        lineFilter: appliedLineFilter,
      } = appliedFilters;
      setError(null);
      try {
        if (appliedTab === "totals") {
          await exportBookingsReport({
            exportFormat: format,
            port: appliedPortFilter > 0 ? appliedPortFilter : undefined,
            shipping_line:
              appliedLineFilter > 0 ? appliedLineFilter : undefined,
            call_date_from: appliedDateFrom,
            call_date_to: appliedDateTo,
            ordering: "call_date",
          });
          return;
        }
        if (appliedTab === "movements" && format === "csv") {
          setError("El reporte WEEK solo se exporta a Excel (.xlsx).");
          return;
        }
        if (appliedTab === "movements") {
          await exportStructuredReport({
            report_type: "week",
            date_from: appliedDateFrom,
            date_to: appliedDateTo,
            port: appliedPortFilter > 0 ? appliedPortFilter : undefined,
            shipping_line:
              appliedLineFilter > 0 ? appliedLineFilter : undefined,
            exportFormat: "xlsx",
          });
          return;
        }
        if (appliedTab === "panorama") {
          if (!appliedLineFilter) {
            setError("Selecciona una naviera para exportar el panorama.");
            return;
          }
          await exportStructuredReport({
            report_type: "carrier_panorama",
            date_from: appliedDateFrom,
            date_to: appliedDateTo,
            shipping_line: appliedLineFilter,
            exportFormat: format,
          });
          return;
        }
        await exportStructuredReport({
          report_type: "cumplimiento_real",
          date_from: appliedDateFrom,
          date_to: appliedDateTo,
          port: appliedPortFilter > 0 ? appliedPortFilter : undefined,
          exportFormat: format,
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

  const showLineFilter = tab !== "movements";
  const showPortFilter = tab !== "panorama";
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
            setDateFrom(value === "movements" ? weekAgoIso() : yearStart());
            setDateTo(todayIso());
            setPortFilter(0);
            setLineFilter(0);
            setWithoutLta(false);
            setError(null);
          }}
          options={[
            { value: "totals", label: "Booking Totals" },
            { value: "movements", label: "WEEK / Movimientos" },
            { value: "panorama", label: "Panorama por naviera" },
            { value: "cumplimiento", label: "Cumplimiento REAL" },
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
            optionLabel="Todos los puertos"
            emptyValue={0}
            compact
            showLogo
            logoKind="port"
          />
        ) : null}
        {showLineFilter ? (
          <FormFieldSelect<number>
            label="Naviera"
            name="report_line"
            value={lineFilter}
            onChange={(v) => setLineFilter(Number(v))}
            options={lineOptions}
            optionLabel={
              tab === "panorama" ? "Selecciona una naviera" : "Todas las navieras"
            }
            emptyValue={0}
            compact
            showLogo
            logoKind="shipping_line"
          />
        ) : null}
        <FormField
          label="Desde"
          name="report_date_from"
          type="date"
          value={dateFrom}
          onChange={(value) => setDateFrom(String(value))}
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
        {tab === "totals" ? (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={withoutLta}
              onChange={(e) => setWithoutLta(e.target.checked)}
              className="rounded border-zinc-300"
            />
            Sin LTA / CL / LTD
          </label>
        ) : null}
        <FilterActions
          onApply={applyFilters}
          onClear={clearFilters}
          canClear={canClearFilters}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={BarChart3}
        title="Reportes"
        description="Totales, WEEK, panorama por naviera y cumplimiento REAL (sin proyección ni garantías)."
      />
      {error ? <ViewErrorBanner message={error} /> : null}

      {loading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : appliedFilters.tab === "totals" && totals && totals.total_calls === 0 ? (
        <EmptyState
          icon={BarChart3}
          filtered
          title="Sin datos con estos filtros"
          description="No hay reservas en el período o filtros seleccionados. Ajusta el rango, el puerto o la naviera."
          onClearFilters={clearFilters}
        />
      ) : appliedFilters.tab === "totals" && totals ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <ViewStatCard
              label="Calls"
              value={totals.total_calls.toLocaleString("es-MX")}
              description={`${totals.date_from} → ${totals.date_to}`}
              icon={FileText}
              accentColor="#3478b5"
              gradient="linear-gradient(160deg, rgba(52, 120, 181, 0.14) 0%, var(--background) 55%)"
            />
            <ViewStatCard
              label="PAX planificado"
              value={totals.planned_pax.toLocaleString("es-MX")}
              description="Suma en el período"
              icon={BarChart3}
              accentColor="#0d9488"
              gradient="linear-gradient(160deg, rgba(13, 148, 136, 0.14) 0%, var(--background) 55%)"
            />
            <ViewStatCard
              label="PAX real"
              value={totals.actual_pax.toLocaleString("es-MX")}
              description="Suma actual_pax"
              icon={BarChart3}
              accentColor="#7c3aed"
              gradient="linear-gradient(160deg, rgba(124, 58, 237, 0.12) 0%, var(--background) 55%)"
            />
          </div>
          <ViewSection
            icon={BarChart3}
            title="Por puerto"
            description="Calls y PAX agrupados por puerto."
          >
            <div className="overflow-x-auto px-5 py-4 sm:px-6">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-zinc-500">
                    <th className="py-2 pr-4">Puerto</th>
                    <th className="py-2 pr-4">Calls</th>
                    <th className="py-2">PAX plan.</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.by_port.map((row) => (
                    <tr
                      key={row.port_id}
                      className="border-t border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="py-2.5 pr-4">
                        <ReportLogoName name={row.name} logo={row.logo} kind="port" />
                      </td>
                      <td className="py-2.5 pr-4">{row.calls}</td>
                      <td className="py-2.5">{row.planned_pax.toLocaleString("es-MX")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ViewSection>
          <ViewSection
            icon={BarChart3}
            title="Por naviera"
            description="Top navieras del período."
          >
            <div className="overflow-x-auto px-5 py-4 sm:px-6">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-zinc-500">
                    <th className="py-2 pr-4">Naviera</th>
                    <th className="py-2 pr-4">Calls</th>
                    <th className="py-2">PAX plan.</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.by_shipping_line.slice(0, 25).map((row) => (
                    <tr
                      key={row.shipping_line_id}
                      className="border-t border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="py-2.5 pr-4">
                        <ReportLogoName
                          name={row.name}
                          logo={row.logo}
                          kind="shipping_line"
                        />
                      </td>
                      <td className="py-2.5 pr-4">{row.calls}</td>
                      <td className="py-2.5">{row.planned_pax.toLocaleString("es-MX")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ViewSection>
        </div>
      ) : appliedFilters.tab === "movements" &&
        movements &&
        movements.confirmations_count + movements.cancellations_count === 0 ? (
        <EmptyState
          icon={FileText}
          filtered
          title="Sin movimientos en el rango"
          description="No hay confirmaciones ni cancelaciones auditadas en este período (el histórico importado no genera movimientos)."
          onClearFilters={clearFilters}
        />
      ) : appliedFilters.tab === "movements" && movements ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <ViewStatCard
              label="Confirmaciones"
              value={String(movements.confirmations_count)}
              description="Cambios a CO/CL/LTA/LTD/R en el rango"
              icon={FileText}
              accentColor="#059669"
              gradient="linear-gradient(160deg, rgba(5, 150, 105, 0.14) 0%, var(--background) 55%)"
            />
            <ViewStatCard
              label="Cancelaciones"
              value={String(movements.cancellations_count)}
              description="Cambios a C en el rango"
              icon={FileText}
              accentColor="#dc2626"
              gradient="linear-gradient(160deg, rgba(220, 38, 38, 0.12) 0%, var(--background) 55%)"
            />
          </div>
          <ViewSection
            icon={FileText}
            title="Detalle de movimientos"
            description="Excel genera el WEEK (movimientos + matrices mes × naviera)."
          >
            <div className="overflow-x-auto px-5 py-4 sm:px-6">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-zinc-500">
                    <th className="py-2 pr-3">Tipo</th>
                    <th className="py-2 pr-3">Cuándo</th>
                    <th className="py-2 pr-3">Código</th>
                    <th className="py-2 pr-3">Puerto</th>
                    <th className="py-2 pr-3">Naviera</th>
                    <th className="py-2">Barco</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...movements.confirmations.map((r) => ({ ...r, kind: "Conf." })),
                    ...movements.cancellations.map((r) => ({ ...r, kind: "Canc." })),
                  ]
                    .sort((a, b) => b.at.localeCompare(a.at))
                    .slice(0, 100)
                    .map((row) => (
                      <tr
                        key={`${row.kind}-${row.id}`}
                        className="border-t border-zinc-100 dark:border-zinc-800"
                      >
                        <td className="py-2 pr-3">{row.kind}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {row.at.slice(0, 16).replace("T", " ")}
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs">{row.booking_code}</td>
                        <td className="py-2 pr-3">{row.port_code}</td>
                        <td className="py-2 pr-3">{row.shipping_line_name}</td>
                        <td className="py-2">{row.vessel_name}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </ViewSection>
        </div>
      ) : appliedFilters.tab === "panorama" && panorama ? (
        <CarrierPanoramaSection
          data={panorama}
          onClearFilters={clearFilters}
        />
      ) : appliedFilters.tab === "cumplimiento" && cumplimiento ? (
        <CumplimientoRealSection
          data={cumplimiento}
          onClearFilters={clearFilters}
        />
      ) : null}
    </>
  );
}
