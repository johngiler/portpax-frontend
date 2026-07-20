"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { toIsoDate } from "@/lib/bookingDates";
import {
  setDataExportHandler,
  type DataExportFormat,
} from "@/lib/dataExportStore";
import { fetchAllPages } from "@/lib/fetchAllPages";
import { exportCalendarReport } from "@/services/bookings/bookingService";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchPositions } from "@/services/catalogs/positionService";
import { fetchShippingLines } from "@/services/catalogs/shippingLineService";
import type { BookingListStatusFilter } from "@/types/booking";
import type { Port } from "@/types/catalog";
import type { ShippingLine } from "@/types/cruise";
import CalendarFilters, { type CalendarViewMode } from "./CalendarFilters";
import CalendarViewSkeleton from "./CalendarViewSkeleton";
import OperationalSection from "./OperationalSection";
import {
  monthBounds,
  weekDatesFrom,
  yearBounds,
} from "./OperationalSection/calendarOpsUtils";

const DEFAULT_PORT_CODES = ["roatan", "la_paz", "puerto_plata"] as const;

export default function CalendarView() {
  const [mode, setMode] = useState<CalendarViewMode>("weekly");
  const [hasLoadedPrefs, setHasLoadedPrefs] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  const [portIds, setPortIds] = useState<number[]>([]);
  const [shippingLineFilter, setShippingLineFilter] = useState(0);
  const [positionFilter, setPositionFilter] = useState(0);
  const [status, setStatus] = useState<BookingListStatusFilter>("");
  const [search, setSearch] = useState("");

  const [weekAnchor, setWeekAnchor] = useState(() => {
    const d = new Date();
    return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
  });
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth());

  const [ports, setPorts] = useState<Port[]>([]);
  const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
  const [positionOptions, setPositionOptions] = useState<
    Array<{ value: number; label: string }>
  >([]);

  useEffect(() => {
    setHasLoadedPrefs(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [portsList, linesPage] = await Promise.all([
          fetchAllPages((page, pageSize) => fetchPorts({ page, pageSize })),
          fetchShippingLines({ pageSize: 100 }),
        ]);
        if (cancelled) return;
        const activePorts = portsList.filter((p) => p.is_active);
        setPorts(activePorts);
        setShippingLines(linesPage.results.filter((l) => l.is_active));
        setPortIds((prev) => {
          if (prev.length > 0) return prev;
          const defaults = DEFAULT_PORT_CODES.map(
            (code) => activePorts.find((p) => p.code === code)?.id,
          ).filter((id): id is number => id != null);
          if (defaults.length > 0) return defaults;
          return activePorts.length === 1 ? [activePorts[0].id] : [];
        });
      } catch {
        if (!cancelled) {
          setPorts([]);
          setShippingLines([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (portIds.length !== 1) {
      setPositionOptions([]);
      setPositionFilter(0);
      return;
    }
    const onlyPort = portIds[0];
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchPositions({ port: onlyPort, pageSize: 100 });
        if (cancelled) return;
        setPositionOptions(
          res.results
            .filter((p) => p.is_active && p.position_type === "pier")
            .map((p) => ({
              value: p.id,
              label: p.short_code || p.code,
            })),
        );
        setPositionFilter(0);
      } catch {
        if (!cancelled) setPositionOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portIds]);

  const exportRange = useMemo(() => {
    if (mode === "weekly") {
      const days = weekDatesFrom(weekAnchor);
      return { from: days[0], to: days[6] };
    }
    if (mode === "annual") return yearBounds(year);
    return monthBounds(year, monthIndex);
  }, [mode, weekAnchor, year, monthIndex]);

  const handleExport = useCallback(
    async (format: DataExportFormat) => {
      setViewError(null);
      if (portIds.length === 0) {
        setViewError("Selecciona al menos un puerto para exportar.");
        return;
      }
      try {
        await exportCalendarReport({
          ports: portIds,
          call_date_from: exportRange.from,
          call_date_to: exportRange.to,
          shipping_line: shippingLineFilter > 0 ? shippingLineFilter : undefined,
          status: status || undefined,
          exportFormat: format,
        });
      } catch (err) {
        setViewError(getApiErrorMessage(err, "No se pudo exportar el calendario."));
      }
    },
    [portIds, exportRange, shippingLineFilter, status],
  );

  useEffect(() => {
    if (portIds.length === 0) {
      setDataExportHandler(null);
      return () => setDataExportHandler(null);
    }
    setDataExportHandler(handleExport);
    return () => setDataExportHandler(null);
  }, [handleExport, portIds.length]);

  const portOptions = useMemo(
    () => ports.map((p) => ({ value: p.id, label: p.name })),
    [ports],
  );
  const shippingLineOptions = useMemo(
    () => shippingLines.map((l) => ({ value: l.id, label: l.name })),
    [shippingLines],
  );
  const portsById = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of ports) map.set(p.id, p.name);
    return map;
  }, [ports]);

  if (!hasLoadedPrefs) {
    return <CalendarViewSkeleton />;
  }

  const description =
    mode === "weekly"
      ? "Una card por puerto: muelles × días de la semana. Exporta desde Datos en el panel."
      : mode === "monthly"
        ? "Una card por puerto con el mes completo y totales. Exporta desde Datos en el panel."
        : "Una card por puerto con 12 meses y comparativa anual. Exporta desde Datos en el panel.";

  return (
    <>
      <FilterSidebarContent>
        <CalendarFilters
          mode={mode}
          onModeChange={setMode}
          portIds={portIds}
          shippingLineFilter={shippingLineFilter}
          positionFilter={positionFilter}
          status={status}
          search={search}
          portOptions={portOptions}
          shippingLineOptions={shippingLineOptions}
          positionOptions={positionOptions}
          onPortIdsChange={setPortIds}
          onShippingLineFilterChange={setShippingLineFilter}
          onPositionFilterChange={setPositionFilter}
          onStatusChange={setStatus}
          onSearchChange={setSearch}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={CalendarRange}
        title="Calendario"
        description={description}
      />
      {viewError ? <ViewErrorBanner message={viewError} /> : null}

      <OperationalSection
        mode={mode}
        onModeChange={setMode}
        portIds={portIds}
        portsById={portsById}
        shippingLineId={shippingLineFilter}
        status={status}
        positionId={positionFilter}
        search={search}
        weekAnchor={weekAnchor}
        onWeekAnchorChange={setWeekAnchor}
        year={year}
        onYearChange={setYear}
        monthIndex={monthIndex}
        onMonthChange={setMonthIndex}
      />
    </>
  );
}
