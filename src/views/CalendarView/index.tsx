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

function samePortIds(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((id, index) => id === sortedB[index]);
}

export default function CalendarView() {
  const [hasLoadedPrefs, setHasLoadedPrefs] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  const [defaultPortIds, setDefaultPortIds] = useState<number[]>([]);

  const [mode, setMode] = useState<CalendarViewMode>("weekly");
  const [portIds, setPortIds] = useState<number[]>([]);
  const [shippingLineFilter, setShippingLineFilter] = useState(0);
  const [positionFilter, setPositionFilter] = useState(0);
  const [status, setStatus] = useState<BookingListStatusFilter>("");
  const [search, setSearch] = useState("");

  const [appliedMode, setAppliedMode] = useState<CalendarViewMode>("weekly");
  const [appliedPortIds, setAppliedPortIds] = useState<number[]>([]);
  const [appliedShippingLineFilter, setAppliedShippingLineFilter] = useState(0);
  const [appliedPositionFilter, setAppliedPositionFilter] = useState(0);
  const [appliedStatus, setAppliedStatus] = useState<BookingListStatusFilter>("");
  const [appliedSearch, setAppliedSearch] = useState("");

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

        const defaults = DEFAULT_PORT_CODES.map(
          (code) => activePorts.find((p) => p.code === code)?.id,
        ).filter((id): id is number => id != null);
        const initial =
          defaults.length > 0
            ? defaults
            : activePorts.length === 1
              ? [activePorts[0].id]
              : [];
        setDefaultPortIds(initial);
        setPortIds((prev) => (prev.length > 0 ? prev : initial));
        setAppliedPortIds((prev) => (prev.length > 0 ? prev : initial));
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
    if (appliedMode === "weekly") {
      const days = weekDatesFrom(weekAnchor);
      return { from: days[0], to: days[6] };
    }
    if (appliedMode === "annual") return yearBounds(year);
    return monthBounds(year, monthIndex);
  }, [appliedMode, weekAnchor, year, monthIndex]);

  const handleExport = useCallback(
    async (format: DataExportFormat) => {
      setViewError(null);
      if (appliedPortIds.length === 0) {
        setViewError("Selecciona al menos un puerto para exportar.");
        return;
      }
      try {
        await exportCalendarReport({
          ports: appliedPortIds,
          call_date_from: exportRange.from,
          call_date_to: exportRange.to,
          shipping_line:
            appliedShippingLineFilter > 0 ? appliedShippingLineFilter : undefined,
          status: appliedStatus || undefined,
          exportFormat: format,
        });
      } catch (err) {
        setViewError(getApiErrorMessage(err, "No se pudo exportar el calendario."));
      }
    },
    [appliedPortIds, exportRange, appliedShippingLineFilter, appliedStatus],
  );

  useEffect(() => {
    if (appliedPortIds.length === 0) {
      setDataExportHandler(null);
      return () => setDataExportHandler(null);
    }
    setDataExportHandler(handleExport);
    return () => setDataExportHandler(null);
  }, [handleExport, appliedPortIds.length]);

  const portOptions = useMemo(
    () => ports.map((p) => ({ value: p.id, label: p.name, logoUrl: p.logo })),
    [ports],
  );
  const shippingLineOptions = useMemo(
    () =>
      shippingLines.map((l) => ({
        value: l.id,
        label: l.name,
        logoUrl: l.logo,
      })),
    [shippingLines],
  );
  const portsById = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of ports) map.set(p.id, p.name);
    return map;
  }, [ports]);

  function applyFilters() {
    setAppliedMode(mode);
    setAppliedPortIds(portIds);
    setAppliedShippingLineFilter(shippingLineFilter);
    setAppliedPositionFilter(positionFilter);
    setAppliedStatus(status);
    setAppliedSearch(search.trim());
  }

  function clearFilters() {
    setMode("weekly");
    setPortIds(defaultPortIds);
    setShippingLineFilter(0);
    setPositionFilter(0);
    setStatus("");
    setSearch("");
    setAppliedMode("weekly");
    setAppliedPortIds(defaultPortIds);
    setAppliedShippingLineFilter(0);
    setAppliedPositionFilter(0);
    setAppliedStatus("");
    setAppliedSearch("");
  }

  const draftDirty =
    mode !== "weekly" ||
    !samePortIds(portIds, defaultPortIds) ||
    shippingLineFilter > 0 ||
    positionFilter > 0 ||
    status !== "" ||
    search.trim() !== "";

  const appliedDirty =
    appliedMode !== "weekly" ||
    !samePortIds(appliedPortIds, defaultPortIds) ||
    appliedShippingLineFilter > 0 ||
    appliedPositionFilter > 0 ||
    appliedStatus !== "" ||
    appliedSearch !== "";

  const canClear = draftDirty || appliedDirty;

  function handleModeChangeFromView(next: CalendarViewMode) {
    setMode(next);
    setAppliedMode(next);
  }

  if (!hasLoadedPrefs) {
    return <CalendarViewSkeleton />;
  }

  const description =
    appliedMode === "weekly"
      ? "Una card por puerto: muelles × días de la semana. Exporta desde Datos en el panel."
      : appliedMode === "monthly"
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
          onApply={applyFilters}
          onClear={clearFilters}
          canClear={canClear}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={CalendarRange}
        title="Calendario"
        description={description}
      />
      {viewError ? <ViewErrorBanner message={viewError} /> : null}

      <OperationalSection
        mode={appliedMode}
        onModeChange={handleModeChangeFromView}
        portIds={appliedPortIds}
        portsById={portsById}
        shippingLineId={appliedShippingLineFilter}
        status={appliedStatus}
        positionId={appliedPositionFilter}
        search={appliedSearch}
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
