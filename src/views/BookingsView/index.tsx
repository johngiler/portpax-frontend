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
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { toIsoDate } from "@/lib/bookingDates";
import { canWriteApp } from "@/lib/navAccess";
import { currentReturnTo } from "@/lib/safeReturnTo";
import {
  buildBookingsWorkspaceQuery,
  parseBookingsWorkspaceFilters,
  type BookingsTabQuery,
  type BookingsWorkspaceFilters,
  type CalendarViewModeQuery,
} from "@/lib/viewFilterQuery";
import {
  setDataExportHandler,
  type DataExportFormat,
} from "@/lib/dataExportStore";
import {
  exportBookingsReport,
  exportCalendarReport,
  exportStructuredReport,
  fetchBookings,
} from "@/services/bookings/bookingService";
import { ApiError } from "@/services/apiClient";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchPositions } from "@/services/catalogs/positionService";
import { fetchAllShippingLines } from "@/services/catalogs/shippingLineService";
import { fetchAllVessels } from "@/services/catalogs/vesselService";
import { portDisplayName } from "@/types/catalog";
import type { BookingListStatusFilter } from "@/types/booking";
import {
  monthBounds,
  weekDatesFrom,
  yearBounds,
} from "@/views/CalendarView/OperationalSection/calendarOpsUtils";
import OperationalSection from "@/views/CalendarView/OperationalSection";
import { getTimeRange, availabilityDefaultRange } from "@/utils/timeRange";
import BookingFilters from "./BookingFilters";
import BookingsAvailabilityPanel from "./BookingsAvailabilityPanel";
import BookingsList from "./BookingsList";
import BookingsTabs from "./BookingsTabs";
import BookingsViewSkeleton from "./BookingsViewSkeleton";
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

export default function BookingsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const canWrite = canWriteApp(user?.role);
  const skipUrlHydrateRef = useRef(false);
  const loadGenerationRef = useRef(0);

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

  const [portsReady, setPortsReady] = useState(false);

  const [tab, setTab] = useState<BookingsTabQuery>("list");
  const [statusFilter, setStatusFilter] = useState<BookingListStatusFilter>("");
  const [appliedStatusFilter, setAppliedStatusFilter] =
    useState<BookingListStatusFilter>("");
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

  const [portOptions, setPortOptions] = useState<
    { value: number; label: string; logoUrl?: string | null }[]
  >([]);
  const [shippingLineOptions, setShippingLineOptions] = useState<
    { value: number; label: string; logoUrl?: string | null }[]
  >([]);
  const [allVessels, setAllVessels] = useState<
    { value: number; label: string; lineId: number; logoUrl?: string | null }[]
  >([]);
  const [positionOptions, setPositionOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [portsById, setPortsById] = useState<Map<number, string>>(new Map());

  const [bookings, setBookings] = useState<
    Awaited<ReturnType<typeof fetchBookings>>["results"]
  >([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

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
      position: appliedPositionFilter,
      week: weekAnchor,
      year,
      month: monthIndex,
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
    let cancelled = false;
    (async () => {
      try {
        const [portsPage, lines, vessels] = await Promise.all([
          fetchPorts({ pageSize: 100 }),
          fetchAllShippingLines(),
          fetchAllVessels(),
        ]);
        if (cancelled) return;
        const activePorts = portsPage.results.filter((p) => p.is_active);
        setPortOptions(
          activePorts.map((port) => ({
            value: port.id,
            label: portDisplayName(port),
            logoUrl: port.logo,
          })),
        );
        const byId = new Map<number, string>();
        for (const p of activePorts) byId.set(p.id, portDisplayName(p));
        setPortsById(byId);

        setShippingLineOptions(
          lines
            .filter((line) => line.is_active)
            .map((line) => ({
              value: line.id,
              label: line.name,
              logoUrl: line.logo,
            })),
        );
        setAllVessels(
          vessels
            .filter((vessel) => vessel.is_active)
            .map((vessel) => ({
              value: vessel.id,
              label: vessel.name,
              lineId: vessel.shipping_line,
              logoUrl: vessel.logo,
            })),
        );
        setPortsReady(true);
      } catch {
        if (!cancelled) setPortsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    setPositionFilter(parsed.position);
    setAppliedPositionFilter(parsed.position);
    setWeekAnchor(parsed.week);
    setYear(parsed.year);
    setMonthIndex(parsed.month);
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
            .filter((p) => p.is_active && p.position_type === "pier")
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

  const vesselOptions = useMemo(() => {
    if (shippingLineFilter > 0) {
      return allVessels.filter((vessel) => vessel.lineId === shippingLineFilter);
    }
    return allVessels;
  }, [allVessels, shippingLineFilter]);

  const listParams = useMemo(() => {
    const dateRange = resolveBookingsDateRange(
      appliedDatePreset,
      appliedCustomDateFrom,
      appliedCustomDateTo,
    );
    return {
      search: appliedSearch,
      status: appliedStatusFilter,
      port: appliedPortFilter > 0 ? appliedPortFilter : undefined,
      shipping_line:
        appliedShippingLineFilter > 0 ? appliedShippingLineFilter : undefined,
      vessel: appliedVesselFilter > 0 ? appliedVesselFilter : undefined,
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
    appliedDatePreset,
    appliedCustomDateFrom,
    appliedCustomDateTo,
  ]);

  const availabilityRange = useMemo(() => {
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
  }, [appliedDatePreset, appliedCustomDateFrom, appliedCustomDateTo]);

  const loadInitial = useCallback(async () => {
    if (tab !== "list") return;
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    setLoadingMore(false);
    setViewError(null);
    try {
      const data = await fetchBookings({ ...listParams, page: 1 });
      if (generation !== loadGenerationRef.current) return;
      setBookings(data.results);
      setTotalCount(data.count);
      setPage(1);
    } catch (err) {
      if (generation !== loadGenerationRef.current) return;
      setViewError(
        getApiErrorMessage(err, "No se pudieron cargar las reservas."),
      );
      setBookings([]);
      setTotalCount(0);
    } finally {
      if (generation === loadGenerationRef.current) setLoading(false);
    }
  }, [listParams, tab]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (tab !== "list") return;
    if (loading || loadingMore || bookings.length >= totalCount) return;
    const generation = loadGenerationRef.current;
    const loadedBefore = bookings.length;
    setLoadingMore(true);
    setViewError(null);
    try {
      const nextPage = page + 1;
      const data = await fetchBookings({ ...listParams, page: nextPage });
      if (generation !== loadGenerationRef.current) return;
      if (data.results.length === 0) {
        setTotalCount(loadedBefore);
        return;
      }
      setBookings((prev) => [...prev, ...data.results]);
      setTotalCount(data.count);
      setPage(nextPage);
    } catch (err) {
      if (generation !== loadGenerationRef.current) return;
      if (err instanceof ApiError && err.status === 404) {
        setTotalCount(loadedBefore);
        return;
      }
      setViewError(
        getApiErrorMessage(err, "No se pudieron cargar más reservas."),
      );
    } finally {
      if (generation === loadGenerationRef.current) setLoadingMore(false);
    }
  }, [
    tab,
    loading,
    loadingMore,
    bookings.length,
    totalCount,
    page,
    listParams,
  ]);

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
        position: positionFilter,
      }),
    );
  }

  function handleClearFilters() {
    const port = 0;
    const from = defaultCustomFrom();
    const to = defaultCustomTo();
    const week = todayIso();
    const y = new Date().getFullYear();
    const m = new Date().getMonth();
    setStatusFilter("");
    setAppliedStatusFilter("");
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
    setPositionFilter(0);
    setAppliedPositionFilter(0);
    setWeekAnchor(week);
    setYear(y);
    setMonthIndex(m);
    syncToUrl({
      tab,
      status: "",
      search: "",
      port,
      line: 0,
      vessel: 0,
      datePreset: "all",
      customFrom: from,
      customTo: to,
      mode: "monthly",
      position: 0,
      week,
      year: y,
      month: m,
    });
  }

  function handleTabChange(next: BookingsTabQuery) {
    setTab(next);
    syncToUrl(workspaceState({ tab: next }));
  }

  const hasActiveFilters =
    appliedStatusFilter !== "" ||
    appliedSearch !== "" ||
    appliedPortFilter > 0 ||
    appliedShippingLineFilter > 0 ||
    appliedVesselFilter > 0 ||
    appliedDatePreset !== "all" ||
    (tab === "calendar" && appliedCalendarMode !== "monthly") ||
    (tab === "calendar" && appliedPositionFilter > 0);

  const canClearFilters =
    hasActiveFilters ||
    statusFilter !== "" ||
    search.trim() !== "" ||
    portFilter > 0 ||
    shippingLineFilter > 0 ||
    vesselFilter > 0 ||
    datePreset !== "all" ||
    (tab === "calendar" && calendarMode !== "monthly") ||
    (tab === "calendar" && positionFilter > 0);

  const handleExport = useCallback(
    async (format: DataExportFormat) => {
      setViewError(null);
      try {
        if (tab === "list") {
          await exportBookingsReport({
            exportFormat: format,
            search: listParams.search,
            status: listParams.status,
            port: listParams.port,
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
          const b = yearBounds(year);
          from = b.from;
          to = b.to;
        } else {
          const b = monthBounds(year, monthIndex);
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
          status: appliedStatusFilter || undefined,
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
      year,
      monthIndex,
      appliedShippingLineFilter,
      appliedStatusFilter,
      portOptions,
    ],
  );

  useEffect(() => {
    setDataExportHandler(handleExport);
    return () => setDataExportHandler(null);
  }, [handleExport]);

  const allPortIds = useMemo(
    () => portOptions.map((p) => p.value),
    [portOptions],
  );

  if (!portsReady) return <BookingsViewSkeleton variant="page" />;

  const description =
    tab === "list"
      ? "Solicitudes de escala por puerto, naviera y barco."
      : tab === "calendar"
        ? "Calendario operativo de todos los puertos (o el seleccionado) en una sola vista."
        : "Disponibilidad día × posición: un puerto o todos, desde hoy hasta 3 años.";

  const calendarPortLabel =
    appliedPortFilter > 0
      ? (portsById.get(appliedPortFilter) ?? "Puerto")
      : "Todos los puertos";

  return (
    <>
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
          positionFilter={positionFilter}
          portOptions={portOptions}
          shippingLineOptions={shippingLineOptions}
          vesselOptions={vesselOptions}
          positionOptions={positionOptions}
          canClear={canClearFilters}
          onStatusChange={setStatusFilter}
          onSearchChange={setSearch}
          onPortFilterChange={(id) => {
            setPortFilter(id);
            setPositionFilter(0);
          }}
          onShippingLineFilterChange={setShippingLineFilter}
          onVesselFilterChange={setVesselFilter}
          onDatePresetChange={setDatePreset}
          onCustomDateFromChange={setCustomDateFrom}
          onCustomDateToChange={setCustomDateTo}
          onCalendarModeChange={setCalendarMode}
          onPositionFilterChange={setPositionFilter}
          onApply={applyFilters}
          onClear={handleClearFilters}
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
            />
            {bookings.length > 0 ? (
              <InfiniteScrollFooter
                hasMore={bookings.length < totalCount}
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
          status={appliedStatusFilter}
          positionId={appliedPositionFilter}
          search={appliedSearch}
          weekAnchor={weekAnchor}
          onWeekAnchorChange={(iso) => {
            setWeekAnchor(iso);
            syncToUrl(workspaceState({ week: iso }));
          }}
          year={year}
          onYearChange={(y) => {
            setYear(y);
            syncToUrl(workspaceState({ year: y }));
          }}
          monthIndex={monthIndex}
          onMonthChange={(m) => {
            setMonthIndex(m);
            syncToUrl(workspaceState({ month: m }));
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
          canBook={canWrite}
          returnTo={currentReturnTo(pathname, searchParams)}
          onClearFilters={handleClearFilters}
        />
      ) : null}
    </>
  );
}
