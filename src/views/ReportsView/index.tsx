"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, FileText } from "lucide-react";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import ViewSection from "@/components/layout/ViewSection";
import ViewStatCard from "@/components/layout/ViewStatCard";
import { FormFieldSelect } from "@/components/ui/FormField";
import FilterActions from "@/components/layout/FilterActions";
import Skeleton from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { toIsoDate } from "@/lib/bookingDates";
import {
  setDataExportHandler,
  type DataExportFormat,
} from "@/lib/dataExportStore";
import { fetchAllPages } from "@/lib/fetchAllPages";
import {
  exportBookingsReport,
  fetchBookingTotalsReport,
  fetchMovementsReport,
  type BookingTotalsReport,
  type MovementsReport,
} from "@/services/bookings/bookingService";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchShippingLines } from "@/services/catalogs/shippingLineService";
import type { Port } from "@/types/catalog";
import type { ShippingLine } from "@/types/cruise";
import ReportsViewSkeleton from "./ReportsViewSkeleton";

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

type ReportTab = "totals" | "movements" | "by_line";

export default function ReportsView() {
  const [tab, setTab] = useState<ReportTab>("totals");
  const [dateFrom, setDateFrom] = useState(yearStart);
  const [dateTo, setDateTo] = useState(todayIso);
  const [portFilter, setPortFilter] = useState(0);
  const [lineFilter, setLineFilter] = useState(0);
  const [withoutLta, setWithoutLta] = useState(false);

  const [ports, setPorts] = useState<Port[]>([]);
  const [lines, setLines] = useState<ShippingLine[]>([]);
  const [totals, setTotals] = useState<BookingTotalsReport | null>(null);
  const [movements, setMovements] = useState<MovementsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [portsList, linesPage] = await Promise.all([
          fetchAllPages((page, pageSize) => fetchPorts({ page, pageSize })),
          fetchShippingLines({ pageSize: 100 }),
        ]);
        if (cancelled) return;
        setPorts(portsList.filter((p) => p.is_active));
        setLines(linesPage.results.filter((l) => l.is_active));
      } catch {
        if (!cancelled) {
          setPorts([]);
          setLines([]);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "movements") {
        const data = await fetchMovementsReport({
          date_from: dateFrom,
          date_to: dateTo,
          port: portFilter > 0 ? portFilter : undefined,
        });
        setMovements(data);
        setTotals(null);
      } else {
        const data = await fetchBookingTotalsReport({
          date_from: dateFrom,
          date_to: dateTo,
          port: portFilter > 0 ? portFilter : undefined,
          shipping_line: lineFilter > 0 ? lineFilter : undefined,
          without_lta: withoutLta,
        });
        setTotals(data);
        setMovements(null);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo cargar el reporte."));
      setTotals(null);
      setMovements(null);
    } finally {
      setLoading(false);
    }
  }, [tab, dateFrom, dateTo, portFilter, lineFilter, withoutLta]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  const portOptions = useMemo(
    () => ports.map((p) => ({ value: p.id, label: p.name })),
    [ports],
  );
  const lineOptions = useMemo(
    () => lines.map((l) => ({ value: l.id, label: l.name })),
    [lines],
  );

  const handleExport = useCallback(
    async (format: DataExportFormat) => {
      setError(null);
      try {
        await exportBookingsReport({
          exportFormat: format,
          port: portFilter > 0 ? portFilter : undefined,
          shipping_line: lineFilter > 0 ? lineFilter : undefined,
          call_date_from: dateFrom,
          call_date_to: dateTo,
          ordering: "call_date",
        });
      } catch (err) {
        setError(getApiErrorMessage(err, "No se pudo exportar el reporte."));
      }
    },
    [portFilter, lineFilter, dateFrom, dateTo],
  );

  useEffect(() => {
    setDataExportHandler(handleExport);
    return () => setDataExportHandler(null);
  }, [handleExport]);

  if (!ready) return <ReportsViewSkeleton />;

  return (
    <>
      <FilterSidebarContent>
        <FormFieldSelect<ReportTab>
          label="Reporte"
          name="report_tab"
          value={tab}
          onChange={(value) => {
            setTab(value);
            if (value === "movements") {
              setDateFrom(weekAgoIso());
              setDateTo(todayIso());
            }
          }}
          options={[
            { value: "totals", label: "Booking Totals" },
            { value: "movements", label: "Movimientos" },
            { value: "by_line", label: "Por naviera (export)" },
          ]}
          compact
        />
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
          Desde
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
          Hasta
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <FormFieldSelect<number>
          label="Puerto"
          name="report_port"
          value={portFilter}
          onChange={(v) => setPortFilter(Number(v))}
          options={portOptions}
          optionLabel="Todos los puertos"
          emptyValue={0}
          compact
        />
        {tab !== "movements" ? (
          <FormFieldSelect<number>
            label="Naviera"
            name="report_line"
            value={lineFilter}
            onChange={(v) => setLineFilter(Number(v))}
            options={lineOptions}
            optionLabel="Todas las navieras"
            emptyValue={0}
            compact
          />
        ) : null}
        {tab === "totals" ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
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
          onApply={() => void load()}
          onClear={() => {
            setDateFrom(tab === "movements" ? weekAgoIso() : yearStart());
            setDateTo(todayIso());
            setPortFilter(0);
            setLineFilter(0);
            setWithoutLta(false);
          }}
          canClear
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={BarChart3}
        title="Reportes"
        description="Totales de calls/PAX, movimientos de la semana y export por naviera."
      />
      {error ? <ViewErrorBanner message={error} /> : null}

      {loading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : tab === "totals" && totals ? (
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
                      <td className="py-2 pr-4 font-medium">{row.name}</td>
                      <td className="py-2 pr-4">{row.calls}</td>
                      <td className="py-2">{row.planned_pax.toLocaleString("es-MX")}</td>
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
                      <td className="py-2 pr-4 font-medium">{row.name}</td>
                      <td className="py-2 pr-4">{row.calls}</td>
                      <td className="py-2">{row.planned_pax.toLocaleString("es-MX")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ViewSection>
        </div>
      ) : tab === "movements" && movements ? (
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
            description="Basado en auditoría de cambios de estado."
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
              {movements.confirmations_count + movements.cancellations_count === 0 ? (
                <p className="py-6 text-sm text-zinc-500">
                  No hay cambios de estado auditados en este rango (el histórico importado
                  no genera movimientos).
                </p>
              ) : null}
            </div>
          </ViewSection>
        </div>
      ) : tab === "by_line" ? (
        <ViewSection
          icon={FileText}
          title="Reporte por naviera"
          description="Usa los filtros del panel y exporta desde Datos → Exportar (Excel o CSV)."
        >
          <p className="px-5 py-6 text-sm text-zinc-600 dark:text-zinc-300 sm:px-6">
            El archivo incluye las mismas columnas que el export de Reservas, acotado al
            puerto/naviera y rango de fechas seleccionados.
          </p>
        </ViewSection>
      ) : null}
    </>
  );
}
