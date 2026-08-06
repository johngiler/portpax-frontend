"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewFilteredBanner from "@/components/layout/ViewFilteredBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { useAuth } from "@/contexts/AuthContext";
import { useSetFilterOpen } from "@/contexts/MainLayoutContext";
import {
  useActivePortsCatalog,
  useActiveShippingLinesCatalog,
  useActiveVesselsCatalog,
} from "@/hooks/swr/useCatalogs";
import { useBookingsInfinite } from "@/hooks/swr/useBookingsInfinite";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { parseIsoDate, toIsoDate } from "@/lib/bookingDates";
import { canWriteApp } from "@/lib/navAccess";
import { currentReturnTo } from "@/lib/safeReturnTo";
import type {
  AvailabilityHeatModeQuery,
  BookingsTabQuery,
  BookingsWorkspaceFilters,
  CalendarSeasonQuery,
  CalendarViewModeQuery,
} from "@/lib/viewFilterQuery";
import {
  buildBookingsWorkspaceQuery,
  parseBookingsWorkspaceFilters,
} from "@/lib/viewFilterQuery";
import {
  setDataExportHandler,
  type DataExportFormat,
} from "@/lib/dataExportStore";
import { setDataImportHandler } from "@/lib/dataImportStore";
import { setDataActivityHandler } from "@/lib/dataActivityStore";
import {
  deleteBooking,
  exportBookingsReport,
  exportCalendarReport,
  exportStructuredReport,
  updateBooking,
} from "@/services/bookings/bookingService";
import {
  previewAvailabilityListFilter,
  previewAvailabilityListFilterFromPaste,
  previewBulkBookingImport,
  previewBulkBookingImportFromPaste,
  type BulkImportPreviewRow,
} from "@/services/bookings/bulkImportService";
import type { ImportBatchRetryRow } from "@/services/bookings/bookingActivityService";
import { fetchPositions } from "@/services/catalogs/positionService";
import { portDisplayName } from "@/types/catalog";
import {
  bookingDetailHref,
  bookingStatusFiltersEqual,
  type BookingStatusFilterValue,
} from "@/types/booking";
import {
  addDaysIso,
  monthBounds,
  weekDatesFrom,
  yearBounds,
} from "@/views/CalendarView/OperationalSection/calendarOpsUtils";
import OperationalSection from "@/views/CalendarView/OperationalSection";
import { getTimeRange, availabilityDefaultRange } from "@/utils/timeRange";
import BookingFilters from "./BookingFilters";
import BookingsAvailabilityPanel from "./BookingsAvailabilityPanel";
import BookingsHistoryModal from "./BookingsHistoryModal";
import BookingsList, {
  type BulkStatusPayload,
} from "./BookingsList";
import BookingsTabs from "./BookingsTabs";
import BookingsViewSkeleton from "./BookingsViewSkeleton";
import BulkBookingImportModal from "./Import/BulkBookingImportModal";
import BulkImportLoadingModal from "./Import/BulkImportLoadingModal";
import ImportOptionsModal from "./Import/ImportOptionsModal";
import ImportPasteModal from "./Import/ImportPasteModal";
import {
  retryRowsToPasteMatrix,
} from "./Import/retryRows";
import {
  resolveBookingsDateRange,
  type BookingsDatePreset,
} from "./BookingsDateFilters";

const BATCH_SIZE = 20;

function defaultCustomFrom(): string {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function defaultCustomTo(): string {
  const d = new Date();
  d.setDate(d.getDate() + 29);
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function todayIso(): string {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysInclusive(from: string, to: string): number {
  if (from > to) return 0;
  const a = parseIsoDate(from);
  const b = parseIsoDate(to);
  const t0 = Date.UTC(a.year, a.monthIndex, a.day);
  const t1 = Date.UTC(b.year, b.monthIndex, b.day);
  return Math.floor((t1 - t0) / 86_400_000) + 1;
}

export default function BookingsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const setFilterOpen = useSetFilterOpen();
  const canWrite = canWriteApp(user?.role);
  const skipUrlHydrateRef = useRef(false);

  const navDefaults = useMemo(
    () => ({
      customFrom: defaultCustomFrom(),
      customTo: defaultCustomTo(),
      week: todayIso(),
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
    }),
    [],
  );

  const { ports, isLoading: portsLoading } = useActivePortsCatalog();
  const { lines, isLoading: linesLoading } = useActiveShippingLinesCatalog();
  const portsReady = !portsLoading && !linesLoading;

  const portOptions = useMemo(
    () =>
      ports.map((port) => ({
        value: port.id,
        label: portDisplayName(port),
        logoUrl: port.logo,
      })),
    [ports],
  );
  const portsById = useMemo(() => {
    const byId = new Map<number, string>();
    for (const port of ports) byId.set(port.id, portDisplayName(port));
    return byId;
  }, [ports]);
  const shippingLineOptions = useMemo(
    () =>
      lines.map((line) => ({
        value: line.id,
        label: line.name,
        logoUrl: line.logo,
      })),
    [lines],
  );

  const [tab, setTab] = useState<BookingsTabQuery>("list");
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilterValue[]>(
    [],
  );
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<
    BookingStatusFilterValue[]
  >([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [portFilter, setPortFilter] = useState(0);
  const [appliedPortFilter, setAppliedPortFilter] = useState(0);
  const [shippingLineFilter, setShippingLineFilter] = useState(0);
  const [appliedShippingLineFilter, setAppliedShippingLineFilter] = useState(0);
  const [vesselFilter, setVesselFilter] = useState(0);
  const [appliedVesselFilter, setAppliedVesselFilter] = useState(0);
  const [datePreset, setDatePreset] = useState<BookingsDatePreset>("all");
  const [appliedDatePreset, setAppliedDatePreset] =
    useState<BookingsDatePreset>("all");
  const [customDateFrom, setCustomDateFrom] = useState(navDefaults.customFrom);
  const [customDateTo, setCustomDateTo] = useState(navDefaults.customTo);
  const [appliedCustomDateFrom, setAppliedCustomDateFrom] = useState(
    navDefaults.customFrom,
  );
  const [appliedCustomDateTo, setAppliedCustomDateTo] = useState(
    navDefaults.customTo,
  );
  const [calendarMode, setCalendarMode] =
    useState<CalendarViewModeQuery>("monthly");
  const [appliedCalendarMode, setAppliedCalendarMode] =
    useState<CalendarViewModeQuery>("monthly");
  const [positionFilter, setPositionFilter] = useState(0);
  const [appliedPositionFilter, setAppliedPositionFilter] = useState(0);
  const [weekAnchor, setWeekAnchor] = useState(navDefaults.week);
  const [year, setYear] = useState(navDefaults.year);
  const [monthIndex, setMonthIndex] = useState(navDefaults.month);
  const [appliedYear, setAppliedYear] = useState(navDefaults.year);
  const [appliedMonthIndex, setAppliedMonthIndex] = useState(navDefaults.month);
  const [calendarSeason, setCalendarSeason] =
    useState<CalendarSeasonQuery>("natural");
  const [appliedCalendarSeason, setAppliedCalendarSeason] =
    useState<CalendarSeasonQuery>("natural");
  const [heatMode, setHeatMode] =
    useState<AvailabilityHeatModeQuery>("availability");
  const [appliedHeatMode, setAppliedHeatMode] =
    useState<AvailabilityHeatModeQuery>("availability");

  const [positionOptions, setPositionOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [viewError, setViewError] = useState<string | null>(null);
  const [importOptionsOpen, setImportOptionsOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportRows, setBulkImportRows] = useState<BulkImportPreviewRow[]>(
    [],
  );
  const [bulkImportFileName, setBulkImportFileName] = useState("");
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [bulkImportSource, setBulkImportSource] = useState<"file" | "paste">(
    "file",
  );
  const [historyBatchId, setHistoryBatchId] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reprocessPasteOpen, setReprocessPasteOpen] = useState(false);
  const [reprocessPasteHeaders, setReprocessPasteHeaders] = useState<string[]>(
    [],
  );
  const [reprocessPasteRows, setReprocessPasteRows] = useState<string[][]>([]);
  const [availabilityDateAllowlist, setAvailabilityDateAllowlist] = useState<
    string[] | null
  >(null);

  const { vessels } = useActiveVesselsCatalog(
    shippingLineFilter > 0 ? shippingLineFilter : null,
  );
  const vesselOptions = useMemo(
    () =>
      vessels.map((vessel) => ({
        value: vessel.id,
        label: vessel.name,
        lineId: vessel.shipping_line,
        logoUrl: vessel.logo,
      })),
    [vessels],
  );

  function workspaceState(
    overrides?: Partial<BookingsWorkspaceFilters>,
  ): BookingsWorkspaceFilters {
    return {
      tab,
      status: appliedStatusFilter,
      search: appliedSearch,
      port: appliedPortFilter,
      line: appliedShippingLineFilter,
      vessel: appliedVesselFilter,
      datePreset: appliedDatePreset,
      customFrom: appliedCustomDateFrom,
      customTo: appliedCustomDateTo,
      mode: appliedCalendarMode,
      season: appliedCalendarSeason,
      position: appliedPositionFilter,
      week: weekAnchor,
      year: appliedYear,
      month: appliedMonthIndex,
      heat: appliedHeatMode,
      ...overrides,
    };
  }

  function syncToUrl(state: BookingsWorkspaceFilters) {
    const qs = buildBookingsWorkspaceQuery(state);
    if (searchParams.toString() === qs) return;
    skipUrlHydrateRef.current = true;
    router.replace(qs ? `/bookings?${qs}` : "/bookings");
  }

  useEffect(() => {
    if (!portsReady) return;
    if (skipUrlHydrateRef.current) {
      skipUrlHydrateRef.current = false;
      return;
    }
    const parsed = parseBookingsWorkspaceFilters(searchParams, navDefaults);
    const tab = parsed.tab;
    const port =
      parsed.port > 0 && portOptions.some((p) => p.value === parsed.port)
        ? parsed.port
        : 0;

    setTab(tab);
    setStatusFilter(parsed.status);
    setAppliedStatusFilter(parsed.status);
    setSearch(parsed.search);
    setAppliedSearch(parsed.search);
    setPortFilter(port);
    setAppliedPortFilter(port);
    setShippingLineFilter(parsed.line);
    setAppliedShippingLineFilter(parsed.line);
    setVesselFilter(parsed.vessel);
    setAppliedVesselFilter(parsed.vessel);
    setDatePreset(parsed.datePreset as BookingsDatePreset);
    setAppliedDatePreset(parsed.datePreset as BookingsDatePreset);
    setCustomDateFrom(parsed.customFrom);
    setCustomDateTo(parsed.customTo);
    setAppliedCustomDateFrom(parsed.customFrom);
    setAppliedCustomDateTo(parsed.customTo);
    setCalendarMode(parsed.mode);
    setAppliedCalendarMode(parsed.mode);
    setCalendarSeason(parsed.season);
    setAppliedCalendarSeason(parsed.season);
    setPositionFilter(parsed.position);
    setAppliedPositionFilter(parsed.position);
    setHeatMode(parsed.heat);
    setAppliedHeatMode(parsed.heat);
    setWeekAnchor(parsed.week);
    setYear(parsed.year);
    setMonthIndex(parsed.month);
    setAppliedYear(parsed.year);
    setAppliedMonthIndex(parsed.month);
  }, [portsReady, searchParams, portOptions, navDefaults]);

  useEffect(() => {
    if (portFilter <= 0) {
      setPositionOptions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchPositions({ port: portFilter, pageSize: 100 });
        if (cancelled) return;
        setPositionOptions(
          res.results
            .filter((p) => p.is_active)
            .map((p) => ({
              value: p.id,
              label: p.short_code || p.code,
            })),
        );
      } catch {
        if (!cancelled) setPositionOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portFilter]);

  const listParams = useMemo(() => {
    const dateRange = resolveBookingsDateRange(
      appliedDatePreset,
      appliedCustomDateFrom,
      appliedCustomDateTo,
    );
    return {
      search: appliedSearch,
      statuses: appliedStatusFilter,
      port: appliedPortFilter > 0 ? appliedPortFilter : undefined,
      shipping_line:
        appliedShippingLineFilter > 0 ? appliedShippingLineFilter : undefined,
      vessel: appliedVesselFilter > 0 ? appliedVesselFilter : undefined,
      position:
        appliedPositionFilter > 0 ? appliedPositionFilter : undefined,
      call_date_from: dateRange.call_date_from,
      call_date_to: dateRange.call_date_to,
      ordering: "call_date_proximity" as const,
      pageSize: BATCH_SIZE,
    };
  }, [
    appliedSearch,
    appliedStatusFilter,
    appliedPortFilter,
    appliedShippingLineFilter,
    appliedVesselFilter,
    appliedPositionFilter,
    appliedDatePreset,
    appliedCustomDateFrom,
    appliedCustomDateTo,
  ]);

  const availabilityRange = useMemo(() => {
    // Imported dates: fetch window = min→max, grid shows only those days.
    if (availabilityDateAllowlist?.length) {
      const sorted = [...availabilityDateAllowlist].sort();
      return { from: sorted[0], to: sorted[sorted.length - 1] };
    }
    if (appliedDatePreset === "all") {
      const range = availabilityDefaultRange();
      return { from: range.date_from, to: range.date_to };
    }
    const range = getTimeRange(
      appliedDatePreset === "custom" ? "custom" : appliedDatePreset,
      appliedCustomDateFrom,
      appliedCustomDateTo,
    );
    return { from: range.date_from, to: range.date_to };
  }, [
    availabilityDateAllowlist,
    appliedDatePreset,
    appliedCustomDateFrom,
    appliedCustomDateTo,
  ]);

  const availabilityRangeRef = useRef(availabilityRange);
  availabilityRangeRef.current = availabilityRange;
  const availabilityAllowlistRef = useRef(availabilityDateAllowlist);
  availabilityAllowlistRef.current = availabilityDateAllowlist;
  const syncWorkspaceRef = useRef<
    (overrides?: Partial<BookingsWorkspaceFilters>) => void
  >(() => {});
  // Always sync with the latest workspace filters (tab, port, etc.).
  syncWorkspaceRef.current = (overrides) => {
    syncToUrl(workspaceState(overrides));
  };

  const handleAvailabilityStartChange = useCallback((newFrom: string) => {
    const { from, to } = availabilityRangeRef.current;
    const allowlist = availabilityAllowlistRef.current;
    const span = allowlist?.length
      ? allowlist.length
      : Math.max(1, daysInclusive(from, to));
    const newTo = addDaysIso(newFrom, span - 1);

    // Exit imported allowlist → chained custom range (sidebar Desde/Hasta).
    setAvailabilityDateAllowlist(null);
    setDatePreset("custom");
    setAppliedDatePreset("custom");
    setCustomDateFrom(newFrom);
    setCustomDateTo(newTo);
    setAppliedCustomDateFrom(newFrom);
    setAppliedCustomDateTo(newTo);
    syncWorkspaceRef.current({
      datePreset: "custom",
      customFrom: newFrom,
      customTo: newTo,
    });
  }, []);

  const {
    bookings,
    totalCount,
    hasMore,
    isLoading: loading,
    loadingMore,
    error: bookingsError,
    loadMore,
    refresh: refreshBookings,
  } = useBookingsInfinite(listParams, tab === "list" && portsReady);

  useEffect(() => {
    if (bookingsError) {
      setViewError(
        getApiErrorMessage(bookingsError, "No se pudieron cargar las reservas."),
      );
    }
  }, [bookingsError]);

  function applyFilters() {
    setAppliedStatusFilter(statusFilter);
    setAppliedSearch(search.trim());
    setAppliedPortFilter(portFilter);
    setAppliedShippingLineFilter(shippingLineFilter);
    setAppliedVesselFilter(vesselFilter);
    setAppliedDatePreset(datePreset);
    setAppliedCustomDateFrom(customDateFrom);
    setAppliedCustomDateTo(customDateTo);
    setAppliedCalendarMode(calendarMode);
    setAppliedPositionFilter(positionFilter);
    setAppliedYear(year);
    setAppliedMonthIndex(monthIndex);
    setAppliedCalendarSeason(calendarSeason);
    setAppliedHeatMode(heatMode);
    let nextWeek = weekAnchor;
    if (calendarMode === "weekly") {
      nextWeek = toIsoDate(year, monthIndex, 1);
      setWeekAnchor(nextWeek);
    }
    syncToUrl(
      workspaceState({
        status: statusFilter,
        search: search.trim(),
        port: portFilter,
        line: shippingLineFilter,
        vessel: vesselFilter,
        datePreset,
        customFrom: customDateFrom,
        customTo: customDateTo,
        mode: calendarMode,
        season: calendarSeason,
        position: positionFilter,
        year,
        month: monthIndex,
        week: nextWeek,
        heat: heatMode,
      }),
    );
  }

  async function handleBulkDeleteCancelled(ids: number[]) {
    setViewError(null);
    const results = await Promise.allSettled(ids.map((id) => deleteBooking(id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    await refreshBookings();
    if (failed > 0) {
      setViewError(
        failed === ids.length
          ? "No se pudieron eliminar las reservas seleccionadas."
          : `Se eliminaron ${ids.length - failed} de ${ids.length}; ${failed} fallaron (solo canceladas).`,
      );
    }
  }

  async function handleBulkStatusChange(ids: number[], payload: BulkStatusPayload) {
    setViewError(null);
    const results = await Promise.allSettled(
      ids.map((id) => updateBooking(id, payload)),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    await refreshBookings();
    if (failed > 0) {
      setViewError(
        failed === ids.length
          ? "No se pudo cambiar el estado de las reservas seleccionadas (revisa transiciones y validaciones)."
          : `Se actualizaron ${ids.length - failed} de ${ids.length}; ${failed} fallaron (transición o validación).`,
      );
    }
  }

  function handleClearFilters() {
    const port = 0;
    const from = defaultCustomFrom();
    const to = defaultCustomTo();
    const week = todayIso();
    const y = new Date().getFullYear();
    const m = new Date().getMonth();
    setStatusFilter([]);
    setAppliedStatusFilter([]);
    setSearch("");
    setAppliedSearch("");
    setPortFilter(port);
    setAppliedPortFilter(port);
    setShippingLineFilter(0);
    setAppliedShippingLineFilter(0);
    setVesselFilter(0);
    setAppliedVesselFilter(0);
    setDatePreset("all");
    setAppliedDatePreset("all");
    setCustomDateFrom(from);
    setCustomDateTo(to);
    setAppliedCustomDateFrom(from);
    setAppliedCustomDateTo(to);
    setCalendarMode("monthly");
    setAppliedCalendarMode("monthly");
    setCalendarSeason("natural");
    setAppliedCalendarSeason("natural");
    setPositionFilter(0);
    setAppliedPositionFilter(0);
    setHeatMode("availability");
    setAppliedHeatMode("availability");
    setAvailabilityDateAllowlist(null);
    setWeekAnchor(week);
    setYear(y);
    setMonthIndex(m);
    setAppliedYear(y);
    setAppliedMonthIndex(m);
    syncToUrl({
      tab,
      status: [],
      search: "",
      port,
      line: 0,
      vessel: 0,
      datePreset: "all",
      customFrom: from,
      customTo: to,
      mode: "monthly",
      season: "natural",
      position: 0,
      week,
      year: y,
      month: m,
      heat: "availability",
    });
  }

  function handleTabChange(next: BookingsTabQuery) {
    setTab(next);
    syncToUrl(workspaceState({ tab: next }));
  }

  const hasActiveFilters =
    appliedStatusFilter.length > 0 ||
    appliedSearch !== "" ||
    appliedPortFilter > 0 ||
    appliedShippingLineFilter > 0 ||
    appliedVesselFilter > 0 ||
    appliedPositionFilter > 0 ||
    appliedDatePreset !== "all" ||
    Boolean(availabilityDateAllowlist?.length) ||
    (tab === "availability" && appliedHeatMode !== "availability") ||
    (tab === "calendar" && appliedCalendarMode !== "monthly");

  const canClearFilters =
    hasActiveFilters ||
    statusFilter.length > 0 ||
    search.trim() !== "" ||
    portFilter > 0 ||
    shippingLineFilter > 0 ||
    vesselFilter > 0 ||
    positionFilter > 0 ||
    datePreset !== "all" ||
    Boolean(availabilityDateAllowlist?.length) ||
    (tab === "availability" && heatMode !== "availability") ||
    (tab === "calendar" && calendarMode !== "monthly");

  const canApplyFilters =
    !bookingStatusFiltersEqual(statusFilter, appliedStatusFilter) ||
    search.trim() !== appliedSearch ||
    portFilter !== appliedPortFilter ||
    shippingLineFilter !== appliedShippingLineFilter ||
    vesselFilter !== appliedVesselFilter ||
    datePreset !== appliedDatePreset ||
    customDateFrom !== appliedCustomDateFrom ||
    customDateTo !== appliedCustomDateTo ||
    calendarMode !== appliedCalendarMode ||
    year !== appliedYear ||
    monthIndex !== appliedMonthIndex ||
    calendarSeason !== appliedCalendarSeason ||
    positionFilter !== appliedPositionFilter ||
    heatMode !== appliedHeatMode;

  const handleExport = useCallback(
    async (format: DataExportFormat) => {
      setViewError(null);
      try {
        if (tab === "list") {
          await exportBookingsReport({
            exportFormat: format,
            search: listParams.search,
            statuses: listParams.statuses,
            port: listParams.port,
            position: listParams.position,
            shipping_line: listParams.shipping_line,
            vessel: listParams.vessel,
            call_date_from: listParams.call_date_from,
            call_date_to: listParams.call_date_to,
            ordering: listParams.ordering,
          });
          return;
        }
        if (tab === "availability") {
          if (appliedPortFilter <= 0) {
            setViewError("Selecciona un puerto para exportar disponibilidad.");
            return;
          }
          await exportStructuredReport({
            report_type: "availability",
            date_from: availabilityRange.from,
            date_to: availabilityRange.to,
            port: appliedPortFilter,
            shipping_line:
              appliedShippingLineFilter > 0
                ? appliedShippingLineFilter
                : undefined,
            vessel:
              appliedVesselFilter > 0 ? appliedVesselFilter : undefined,
            position:
              appliedPositionFilter > 0 ? appliedPositionFilter : undefined,
            statuses:
              appliedStatusFilter.length > 0
                ? appliedStatusFilter
                : undefined,
            exportFormat: format,
          });
          return;
        }
        // calendar
        let from = weekAnchor;
        let to = weekAnchor;
        if (appliedCalendarMode === "weekly") {
          const days = weekDatesFrom(weekAnchor);
          from = days[0];
          to = days[6];
        } else if (appliedCalendarMode === "annual") {
          const b = yearBounds(appliedYear);
          from = b.from;
          to = b.to;
        } else {
          const b = monthBounds(appliedYear, appliedMonthIndex);
          from = b.from;
          to = b.to;
        }
        const exportPorts =
          appliedPortFilter > 0
            ? [appliedPortFilter]
            : portOptions.map((p) => p.value);
        if (exportPorts.length === 0) {
          setViewError("No hay puertos para exportar el calendario.");
          return;
        }
        await exportCalendarReport({
          ports: exportPorts,
          call_date_from: from,
          call_date_to: to,
          shipping_line:
            appliedShippingLineFilter > 0
              ? appliedShippingLineFilter
              : undefined,
          statuses:
            appliedStatusFilter.length > 0
              ? appliedStatusFilter
              : undefined,
          exportFormat: format,
        });
      } catch (err) {
        setViewError(getApiErrorMessage(err, "No se pudo exportar."));
      }
    },
    [
      tab,
      listParams,
      appliedPortFilter,
      availabilityRange,
      appliedCalendarMode,
      weekAnchor,
      appliedYear,
      appliedMonthIndex,
      appliedShippingLineFilter,
      appliedVesselFilter,
      appliedPositionFilter,
      appliedStatusFilter,
      portOptions,
    ],
  );

  useEffect(() => {
    setDataExportHandler(handleExport);
    return () => setDataExportHandler(null);
  }, [handleExport]);

  useEffect(() => {
    setDataActivityHandler(() => {
      setHistoryOpen(true);
    });
    return () => setDataActivityHandler(null);
  }, []);

  useEffect(() => {
    if (!canWrite) {
      setDataImportHandler(null);
      return;
    }
    setDataImportHandler(() => {
      setImportOptionsOpen(true);
    });
    return () => setDataImportHandler(null);
  }, [canWrite]);

  async function applyAvailabilityFilterPayload(payload: {
    dates: string[];
    date_from: string;
    date_to: string;
  }) {
    // Partial dates only — do not switch sidebar to continuous "custom" range.
    setAvailabilityDateAllowlist(payload.dates);
    setTab("availability");
    syncToUrl(workspaceState({ tab: "availability" }));
    setFilterOpen?.(false);
  }

  function handleDatePresetChange(preset: typeof datePreset) {
    setDatePreset(preset);
    if (!availabilityDateAllowlist?.length) return;
    // Leaving imported partial dates → apply the chosen manual range immediately.
    setAvailabilityDateAllowlist(null);
    setAppliedDatePreset(preset);
    if (preset === "custom") {
      setAppliedCustomDateFrom(customDateFrom);
      setAppliedCustomDateTo(customDateTo);
    }
    syncToUrl(
      workspaceState({
        datePreset: preset,
        customFrom: customDateFrom,
        customTo: customDateTo,
      }),
    );
  }

  function handleCustomDateFromChange(value: string) {
    setCustomDateFrom(value);
    if (availabilityDateAllowlist?.length) {
      setAvailabilityDateAllowlist(null);
    }
  }

  function handleCustomDateToChange(value: string) {
    setCustomDateTo(value);
    if (availabilityDateAllowlist?.length) {
      setAvailabilityDateAllowlist(null);
    }
  }

  async function handleImportFile(
    optionId: "bulk_bookings" | "availability_filter",
    file: File,
  ) {
    setViewError(null);
    setBulkImportFileName(file.name);
    setBulkImportLoading(true);
    try {
      if (optionId === "availability_filter") {
        const payload = await previewAvailabilityListFilter(file);
        await applyAvailabilityFilterPayload(payload);
        setBulkImportFileName("");
        return;
      }
      setBulkImportSource("file");
      const preview = await previewBulkBookingImport(file);
      setBulkImportRows(preview.rows);
      setBulkImportOpen(true);
    } catch (err) {
      setBulkImportFileName("");
      setViewError(
        getApiErrorMessage(
          err,
          optionId === "availability_filter"
            ? "No se pudo leer el archivo de disponibilidad."
            : "No se pudo leer el archivo de reservas.",
        ),
      );
    } finally {
      setBulkImportLoading(false);
    }
  }

  async function handleImportPaste(
    optionId: "bulk_bookings" | "availability_filter",
    text: string,
  ) {
    setViewError(null);
    setBulkImportFileName("Pegado desde Excel");
    setBulkImportLoading(true);
    try {
      if (optionId === "availability_filter") {
        const payload = await previewAvailabilityListFilterFromPaste(text);
        await applyAvailabilityFilterPayload(payload);
        setBulkImportFileName("");
        return;
      }
      setBulkImportSource("paste");
      const preview = await previewBulkBookingImportFromPaste(text);
      setBulkImportRows(preview.rows);
      setBulkImportOpen(true);
    } catch (err) {
      setBulkImportFileName("");
      setViewError(
        getApiErrorMessage(err, "No se pudo interpretar el pegado desde Excel."),
      );
    } finally {
      setBulkImportLoading(false);
    }
  }

  function handleReprocessImportRows(payload: {
    rows: ImportBatchRetryRow[];
    label: string;
    source: "file" | "paste";
  }) {
    setViewError(null);
    const matrix = retryRowsToPasteMatrix(payload.rows);
    setReprocessPasteHeaders(matrix.headers);
    setReprocessPasteRows(matrix.rows);
    setReprocessPasteOpen(true);
  }

  const allPortIds = useMemo(
    () => portOptions.map((p) => p.value),
    [portOptions],
  );

  if (!portsReady) return <BookingsViewSkeleton variant="page" />;

  const description =
    tab === "list"
      ? "Busca por código de reserva para abrir la escala y descargar el PDF de confirmación."
      : tab === "calendar"
        ? "Calendario operativo de todos los puertos (o el seleccionado) en una sola vista."
        : "Disponibilidad día × posición: un puerto o todos, desde hoy hasta 3 años.";

  const calendarPortLabel =
    appliedPortFilter > 0
      ? (portsById.get(appliedPortFilter) ?? "Puerto")
      : "Todos los puertos";

  return (
    <>
      <ImportOptionsModal
        open={importOptionsOpen}
        onClose={() => !bulkImportLoading && setImportOptionsOpen(false)}
        disabled={bulkImportLoading}
        onImportFile={(optionId, file) => {
          void handleImportFile(optionId, file);
        }}
        onImportPaste={(optionId, text) => {
          void handleImportPaste(optionId, text);
        }}
      />

      <BulkImportLoadingModal
        open={bulkImportLoading}
        fileName={bulkImportFileName}
      />

      <ImportPasteModal
        open={reprocessPasteOpen && !bulkImportLoading}
        title="Pegar reservas masivas"
        hint="Revisa o corrige las filas pendientes y pulsa «Aplicar datos» para validarlas de nuevo."
        columns={[
          "Ship",
          "Port",
          "Arrival",
          "Departure",
          "Vendor Name",
          "Call Type",
        ]}
        formatGuideId="bulk_bookings"
        initialHeaders={reprocessPasteHeaders}
        initialRows={reprocessPasteRows}
        disabled={bulkImportLoading}
        onClose={() => {
          setReprocessPasteOpen(false);
          setReprocessPasteHeaders([]);
          setReprocessPasteRows([]);
        }}
        onApply={(text) => {
          setReprocessPasteOpen(false);
          setReprocessPasteHeaders([]);
          setReprocessPasteRows([]);
          void handleImportPaste("bulk_bookings", text);
        }}
      />

      <BulkBookingImportModal
        open={bulkImportOpen && !bulkImportLoading}
        rows={bulkImportRows}
        fileName={bulkImportFileName}
        importSource={bulkImportSource}
        onClose={() => {
          setBulkImportOpen(false);
          setBulkImportRows([]);
          setBulkImportFileName("");
        }}
        onCreated={async ({ batchId }) => {
          setBulkImportOpen(false);
          setBulkImportRows([]);
          setBulkImportFileName("");
          setViewError(null);
          await refreshBookings();
          setHistoryBatchId(batchId);
          setHistoryOpen(true);
        }}
      />

      <BookingsHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        initialBatchId={historyBatchId}
        onInitialBatchConsumed={() => setHistoryBatchId(null)}
        onReprocessRows={(payload) => {
          void handleReprocessImportRows(payload);
        }}
      />

      <FilterSidebarContent>
        <BookingFilters
          tab={tab}
          status={statusFilter}
          search={search}
          portFilter={portFilter}
          shippingLineFilter={shippingLineFilter}
          vesselFilter={vesselFilter}
          datePreset={datePreset}
          customDateFrom={customDateFrom}
          customDateTo={customDateTo}
          calendarMode={calendarMode}
          calendarYear={year}
          calendarMonthIndex={monthIndex}
          calendarSeason={calendarSeason}
          positionFilter={positionFilter}
          heatMode={heatMode}
          portOptions={portOptions}
          shippingLineOptions={shippingLineOptions}
          vesselOptions={vesselOptions}
          positionOptions={positionOptions}
          canClear={canClearFilters}
          canApply={canApplyFilters}
          onStatusChange={setStatusFilter}
          onSearchChange={setSearch}
          onPortFilterChange={(id) => {
            setPortFilter(id);
            setPositionFilter(0);
          }}
          onShippingLineFilterChange={setShippingLineFilter}
          onVesselFilterChange={setVesselFilter}
          onDatePresetChange={handleDatePresetChange}
          onCustomDateFromChange={handleCustomDateFromChange}
          onCustomDateToChange={handleCustomDateToChange}
          onCalendarModeChange={setCalendarMode}
          onCalendarYearChange={setYear}
          onCalendarMonthChange={setMonthIndex}
          onCalendarSeasonChange={setCalendarSeason}
          onPositionFilterChange={setPositionFilter}
          onHeatModeChange={setHeatMode}
          importedDatesCount={availabilityDateAllowlist?.length ?? 0}
          onApply={applyFilters}
          onClear={handleClearFilters}
          onBookingCodePick={(bookingCode) => {
            router.push(
              bookingDetailHref(
                { booking_code: bookingCode },
                { returnTo: currentReturnTo(pathname, searchParams) },
              ),
            );
          }}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={CalendarDays}
        title="Reservas"
        description={description}
        actions={
          canWrite ? (
            <DefaultButton
              type="button"
              onClick={() => router.push("/bookings/new")}
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" strokeWidth={2} />
                Reservar
              </span>
            </DefaultButton>
          ) : undefined
        }
      />

      <BookingsTabs value={tab} onChange={handleTabChange} />

      {hasActiveFilters ? (
        <ViewFilteredBanner onClear={handleClearFilters} />
      ) : null}

      {viewError && (
        <ViewErrorBanner
          message={viewError}
          onDismiss={() => setViewError(null)}
        />
      )}

      {tab === "list" ? (
        loading && bookings.length === 0 ? (
          <BookingsViewSkeleton variant="list" />
        ) : (
          <>
            <BookingsList
              bookings={bookings}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              canWrite={canWrite}
              onBulkDelete={canWrite ? handleBulkDeleteCancelled : undefined}
              onBulkStatus={canWrite ? handleBulkStatusChange : undefined}
            />
            {bookings.length > 0 ? (
              <InfiniteScrollFooter
                hasMore={hasMore}
                loading={loadingMore}
                onLoadMore={loadMore}
                loadedCount={bookings.length}
                totalCount={totalCount}
                itemLabel="reservas"
              />
            ) : null}
          </>
        )
      ) : null}

      {tab === "calendar" ? (
        <OperationalSection
          mode={appliedCalendarMode}
          onModeChange={(next) => {
            setCalendarMode(next);
            setAppliedCalendarMode(next);
            syncToUrl(workspaceState({ mode: next }));
          }}
          portId={appliedPortFilter}
          portLabel={calendarPortLabel}
          shippingLineId={appliedShippingLineFilter}
          vesselId={appliedVesselFilter}
          statuses={appliedStatusFilter}
          positionId={appliedPositionFilter}
          search={appliedSearch}
          weekAnchor={weekAnchor}
          onWeekAnchorChange={(iso) => {
            setWeekAnchor(iso);
            syncToUrl(workspaceState({ week: iso }));
          }}
          year={appliedYear}
          onYearChange={(y) => {
            setYear(y);
            setAppliedYear(y);
            syncToUrl(workspaceState({ year: y }));
          }}
          monthIndex={appliedMonthIndex}
          onMonthChange={(m) => {
            setMonthIndex(m);
            setAppliedMonthIndex(m);
            syncToUrl(workspaceState({ month: m }));
          }}
          season={appliedCalendarSeason}
          onSeasonChange={(next) => {
            setCalendarSeason(next);
            setAppliedCalendarSeason(next);
            syncToUrl(workspaceState({ season: next }));
          }}
          onClearFilters={handleClearFilters}
        />
      ) : null}

      {tab === "availability" ? (
        <BookingsAvailabilityPanel
          portId={appliedPortFilter}
          portIds={allPortIds}
          dateFrom={availabilityRange.from}
          dateTo={availabilityRange.to}
          dateAllowlist={availabilityDateAllowlist}
          heatMode={appliedHeatMode}
          filters={{
            shipping_line:
              appliedShippingLineFilter > 0
                ? appliedShippingLineFilter
                : undefined,
            vessel:
              appliedVesselFilter > 0 ? appliedVesselFilter : undefined,
            position:
              appliedPositionFilter > 0 ? appliedPositionFilter : undefined,
            statuses:
              appliedStatusFilter.length > 0
                ? appliedStatusFilter
                : undefined,
          }}
          canBook={canWrite}
          returnTo={currentReturnTo(pathname, searchParams)}
          onClearFilters={handleClearFilters}
          onStartDateChange={handleAvailabilityStartChange}
        />
      ) : null}
    </>
  );
}
