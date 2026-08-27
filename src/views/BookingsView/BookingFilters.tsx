"use client";

import { useCallback, useState } from "react";
import FilterActions from "@/components/layout/FilterActions";
import FilterSuggestField from "@/components/layout/FilterSuggestField";
import BookingStatusGuideModal from "@/components/booking/BookingStatusGuideModal";
import { BookingStatusGuideToggle } from "@/components/booking/BookingStatusGuideTable";
import { FormField, FormFieldMultiSelect, FormFieldSelect } from "@/components/ui/FormField";
import { suggestBookings, suggestBookingsPortVessel } from "@/lib/filterSuggestions";
import { getMonthOptions, getBookingYearRange } from "@/lib/bookingDates";
import type {
  AvailabilityHeatModeQuery,
  BookingsTabQuery,
  CalendarSeasonQuery,
  CalendarViewModeQuery,
  ConflictFilterValue,
} from "@/lib/viewFilterQuery";
import { fetchShippingLines } from "@/services/catalogs/shippingLineService";
import { fetchVessels } from "@/services/catalogs/vesselService";
import {
  BOOKING_STATUS_MULTI_OPTIONS,
  type BookingStatusFilterValue,
} from "@/types/booking";
import { getTimeRange, availabilityDefaultRange } from "@/utils/timeRange";
import BookingsDateFilters, { type BookingsDatePreset } from "./BookingsDateFilters";

const STATUS_OPTIONS = BOOKING_STATUS_MULTI_OPTIONS;

const MODE_OPTIONS: { value: CalendarViewModeQuery; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "annual", label: "Anual" },
];

const SEASON_OPTIONS: { value: CalendarSeasonQuery; label: string }[] = [
  { value: "natural", label: "Año natural" },
  { value: "summer", label: "Summer (may–oct)" },
  { value: "winter", label: "Winter (nov–abr)" },
];

const HEAT_MODE_OPTIONS: { value: AvailabilityHeatModeQuery; label: string }[] =
  [
    { value: "availability", label: "Disponibilidad" },
    { value: "occupancy", label: "Ocupación" },
  ];

/** Exact ships-per-day; 0 = any occupied day (emptyValue). */
const DENSITY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "1 barco" },
  { value: 2, label: "2 barcos" },
  { value: 3, label: "3 barcos" },
  { value: 4, label: "4 barcos" },
];

const MONTH_OPTIONS = getMonthOptions().map((o) => ({
  value: o.value,
  label: o.label.charAt(0).toUpperCase() + o.label.slice(1),
}));

const YEAR_OPTIONS = getBookingYearRange("2024-01-01", 6).map((y) => ({
  value: y,
  label: String(y),
}));

const CONFLICT_OPTIONS: { value: ConflictFilterValue; label: string }[] = [
  { value: "yes", label: "Con conflicto (amarillo y rojo)" },
  { value: "yellow", label: "Solo amarillo" },
  { value: "red", label: "Solo rojo" },
  { value: "no", label: "Sin conflicto" },
  { value: "proximity", label: "Tipo · Proximidad" },
  { value: "loa", label: "Tipo · Eslora" },
  { value: "schedule", label: "Tipo · Horario" },
  { value: "position", label: "Tipo · Posición" },
  { value: "lta", label: "Tipo · LTA" },
  { value: "physical", label: "Tipo · Físico (manga/calado)" },
];

type FilterOption = { value: number; label: string; logoUrl?: string | null };

type BookingFiltersProps = {
  tab: BookingsTabQuery;
  status: BookingStatusFilterValue[];
  conflictFilter: ConflictFilterValue;
  search: string;
  /** Empty = all ports. */
  portFilter: number[];
  shippingLineFilter: number;
  vesselFilter: number;
  datePreset: BookingsDatePreset;
  customDateFrom: string;
  customDateTo: string;
  calendarMode: CalendarViewModeQuery;
  calendarYear: number;
  calendarMonthIndex: number;
  calendarSeason: CalendarSeasonQuery;
  positionFilter: number;
  heatMode: AvailabilityHeatModeQuery;
  density: number;
  portOptions: FilterOption[];
  shippingLineOptions: FilterOption[];
  vesselOptions: FilterOption[];
  positionOptions: FilterOption[];
  canClear: boolean;
  canApply: boolean;
  onStatusChange: (status: BookingStatusFilterValue[]) => void;
  onConflictFilterChange: (value: ConflictFilterValue) => void;
  onSearchChange: (search: string) => void;
  onPortFilterChange: (portIds: number[]) => void;
  onShippingLineFilterChange: (lineId: number) => void;
  onVesselFilterChange: (vesselId: number) => void;
  onDatePresetChange: (preset: BookingsDatePreset) => void;
  onCustomDateFromChange: (value: string) => void;
  onCustomDateToChange: (value: string) => void;
  onCalendarModeChange: (mode: CalendarViewModeQuery) => void;
  onCalendarYearChange: (year: number) => void;
  onCalendarMonthChange: (monthIndex: number) => void;
  onCalendarSeasonChange: (season: CalendarSeasonQuery) => void;
  onPositionFilterChange: (positionId: number) => void;
  onHeatModeChange: (mode: AvailabilityHeatModeQuery) => void;
  onDensityChange: (density: number) => void;
  importedDatesCount?: number;
  onApply: () => void;
  onClear: () => void;
  /** When user picks a booking code suggestion, open that reservation. */
  onBookingCodePick?: (bookingCode: string) => void;
};

export default function BookingFilters({
  tab,
  status,
  conflictFilter,
  search,
  portFilter,
  shippingLineFilter,
  vesselFilter,
  datePreset,
  customDateFrom,
  customDateTo,
  calendarMode,
  calendarYear,
  calendarMonthIndex,
  calendarSeason,
  positionFilter,
  heatMode,
  density,
  portOptions,
  shippingLineOptions,
  vesselOptions,
  positionOptions,
  canClear,
  canApply,
  onStatusChange,
  onConflictFilterChange,
  onSearchChange,
  onPortFilterChange,
  onShippingLineFilterChange,
  onVesselFilterChange,
  onDatePresetChange,
  onCustomDateFromChange,
  onCustomDateToChange,
  onCalendarModeChange,
  onCalendarYearChange,
  onCalendarMonthChange,
  onCalendarSeasonChange,
  onPositionFilterChange,
  onHeatModeChange,
  onDensityChange,
  importedDatesCount = 0,
  onApply,
  onClear,
  onBookingCodePick,
}: BookingFiltersProps) {
  const [statusGuideOpen, setStatusGuideOpen] = useState(false);
  const timeRange =
    datePreset === "all"
      ? tab === "availability"
        ? availabilityDefaultRange()
        : getTimeRange("hoy")
      : getTimeRange(datePreset, customDateFrom, customDateTo);

  const isAvailabilityTab = tab === "availability";
  const isAvailabilityGaps = isAvailabilityTab && heatMode === "availability";
  const isOccupancyHeat = isAvailabilityTab && heatMode === "occupancy";

  // Disponibilidad (huecos): Criterio + Puerto + fechas.
  // Ocupación: Criterio → Buscar → Puerto → Posición → densidad → foco.
  const showVessel =
    tab === "list" ||
    tab === "calendar" ||
    tab === "proximity" ||
    isOccupancyHeat;
  const showSearch = tab === "list" || tab === "calendar" || isOccupancyHeat;
  const searchCatalogOnly = tab === "calendar" || isOccupancyHeat;
  const showDates = tab === "list" || tab === "availability" || tab === "proximity";
  const showCalendarMode = tab === "calendar";
  const showHeatMode = isAvailabilityTab;
  const showPosition =
    tab === "list" || tab === "calendar" || isOccupancyHeat;
  const showPort = tab !== "proximity";
  const showLine =
    tab === "list" ||
    tab === "calendar" ||
    tab === "proximity" ||
    isOccupancyHeat;
  const showStatus = !isAvailabilityGaps;
  const showConflict =
    tab === "list" ||
    tab === "proximity" ||
    tab === "calendar" ||
    isOccupancyHeat;

  const loadLineOptions = useCallback(async (input: string) => {
    const res = await fetchShippingLines({
      search: input.trim() || undefined,
      pageSize: 30,
    });
    return res.results.map((line) => ({
      value: line.id,
      label: line.name,
      logoUrl: line.logo,
    }));
  }, []);

  const loadVesselOptions = useCallback(
    async (input: string) => {
      if (shippingLineFilter <= 0) return [];
      const res = await fetchVessels({
        shipping_line: shippingLineFilter,
        search: input.trim() || undefined,
        pageSize: 30,
      });
      return res.results.map((v) => ({
        value: v.id,
        label: v.name,
        logoUrl: v.logo,
      }));
    },
    [shippingLineFilter],
  );

  const searchField = showSearch ? (
    <FilterSuggestField
      label="Buscar"
      name="booking_search"
      value={search}
      onChange={onSearchChange}
      loadSuggestions={
        searchCatalogOnly ? suggestBookingsPortVessel : suggestBookings
      }
      placeholder={
        searchCatalogOnly
          ? "Puerto, barco…"
          : "Código de reserva, puerto, barco…"
      }
      onPick={(suggestion) => {
        if (
          !searchCatalogOnly &&
          suggestion.filterEntity === "booking" &&
          suggestion.applyValue
        ) {
          onBookingCodePick?.(suggestion.applyValue);
          onSearchChange("");
          return;
        }
        if (suggestion.filterEntity === "port" && suggestion.entityId) {
          onPortFilterChange([suggestion.entityId]);
          onSearchChange("");
          return;
        }
        if (
          !searchCatalogOnly &&
          suggestion.filterEntity === "shipping_line" &&
          suggestion.entityId
        ) {
          onShippingLineFilterChange(suggestion.entityId);
          onVesselFilterChange(0);
          onSearchChange("");
          return;
        }
        if (
          suggestion.filterEntity === "vessel" &&
          suggestion.entityId &&
          suggestion.shippingLineId
        ) {
          onShippingLineFilterChange(suggestion.shippingLineId);
          onVesselFilterChange(suggestion.entityId);
          onSearchChange("");
        }
      }}
    />
  ) : null;

  const heatModeField = showHeatMode ? (
    <FormFieldSelect<AvailabilityHeatModeQuery>
      label="Criterio"
      name="booking_availability_heat"
      value={heatMode}
      onChange={(mode) => {
        // Keep transversal filters (port, vessel, dates, …) across criteria;
        // gaps vs occupancy only changes what the chart consumes.
        onHeatModeChange(mode);
      }}
      options={HEAT_MODE_OPTIONS}
      compact
    />
  ) : null;

  const densityField =
    showHeatMode && heatMode === "occupancy" ? (
      <FormFieldSelect<number>
        label="Barcos por día"
        name="booking_occupancy_density"
        value={density}
        emptyValue={0}
        optionLabel="Todos"
        onChange={onDensityChange}
        options={DENSITY_OPTIONS}
        compact
      />
    ) : null;

  const calendarFields = showCalendarMode ? (
    <>
      <FormFieldSelect<CalendarViewModeQuery>
        label="Vista calendario"
        name="booking_calendar_mode"
        value={calendarMode}
        onChange={onCalendarModeChange}
        options={MODE_OPTIONS}
        compact
      />
      <FormFieldSelect<number>
        label="Año"
        name="booking_calendar_year"
        value={calendarYear}
        onChange={onCalendarYearChange}
        options={YEAR_OPTIONS}
        compact
      />
      {calendarMode !== "annual" ? (
        <FormFieldSelect<number>
          label="Mes"
          name="booking_calendar_month"
          value={calendarMonthIndex}
          onChange={onCalendarMonthChange}
          options={MONTH_OPTIONS}
          compact
        />
      ) : (
        <FormFieldSelect<CalendarSeasonQuery>
          label="Temporada"
          name="booking_calendar_season"
          value={calendarSeason}
          onChange={onCalendarSeasonChange}
          options={SEASON_OPTIONS}
          compact
        />
      )}
    </>
  ) : null;

  const singlePortSelected = portFilter.length === 1;

  const portField = showPort ? (
    <FormFieldMultiSelect<number>
      label="Puerto"
      name="booking_port_filter"
      value={portFilter}
      onChange={onPortFilterChange}
      options={portOptions}
      placeholder="Todos los puertos"
      compact
      showLogo
      logoKind="port"
    />
  ) : null;

  const positionField = showPosition ? (
    <FormFieldSelect<number>
      label="Posición"
      name="booking_position_filter"
      value={positionFilter}
      onChange={onPositionFilterChange}
      options={positionOptions}
      optionLabel={
        singlePortSelected
          ? "Todas las posiciones"
          : "Elige un solo puerto primero"
      }
      emptyValue={0}
      compact
      disabled={!singlePortSelected}
    />
  ) : null;

  const lineField = showLine ? (
    <FormFieldSelect<number>
      label="Naviera"
      name="booking_line_filter"
      value={shippingLineFilter}
      onChange={(lineId) => {
        onShippingLineFilterChange(lineId);
        onVesselFilterChange(0);
      }}
      options={shippingLineOptions}
      loadOptions={loadLineOptions}
      optionLabel="Todas las navieras"
      emptyValue={0}
      compact
      showLogo
      logoKind="shipping_line"
    />
  ) : null;

  const vesselField = showVessel ? (
    <FormFieldSelect<number>
      label="Barco"
      name="booking_vessel_filter"
      value={vesselFilter}
      onChange={onVesselFilterChange}
      options={vesselOptions}
      loadOptions={shippingLineFilter > 0 ? loadVesselOptions : undefined}
      optionLabel={
        tab === "proximity"
          ? "Selecciona un barco"
          : shippingLineFilter > 0
            ? "Todos los barcos"
            : "Elige una naviera primero"
      }
      emptyValue={0}
      compact
      showLogo
      logoKind="vessel"
      disabled={shippingLineFilter <= 0}
    />
  ) : null;

  const statusField = showStatus ? (
    <>
      <FormFieldMultiSelect<BookingStatusFilterValue>
        label="Estado"
        name="booking_status_filter"
        value={status}
        onChange={onStatusChange}
        options={STATUS_OPTIONS}
        placeholder="Todos los estados"
        compact
        labelEnd={
          <BookingStatusGuideToggle
            accordion={false}
            onToggle={() => setStatusGuideOpen(true)}
          />
        }
      />
      <BookingStatusGuideModal
        open={statusGuideOpen}
        onClose={() => setStatusGuideOpen(false)}
        includeFilterExtras
      />
    </>
  ) : null;

  const conflictField = showConflict ? (
    <FormFieldSelect<ConflictFilterValue>
      label="Conflicto"
      name="booking_conflict_filter"
      value={conflictFilter}
      onChange={onConflictFilterChange}
      options={CONFLICT_OPTIONS}
      optionLabel="Todos"
      emptyValue=""
      compact
    />
  ) : null;

  const datesField = showDates ? (
    <BookingsDateFilters
      datePreset={datePreset}
      customDateFrom={customDateFrom}
      customDateTo={customDateTo}
      timeRange={timeRange}
      showAllRangeHint={tab === "availability" || tab === "proximity"}
      importedDatesCount={
        tab === "availability" ||
        tab === "list" ||
        tab === "proximity"
          ? importedDatesCount
          : 0
      }
      onDatePresetChange={onDatePresetChange}
      onCustomDateFromChange={onCustomDateFromChange}
      onCustomDateToChange={onCustomDateToChange}
    />
  ) : null;

  const importedDatesNotice =
    !showDates && importedDatesCount > 0 ? (
      <p className="text-[11px] leading-snug text-[var(--admin-accent)]">
        Se filtraron {importedDatesCount} fecha
        {importedDatesCount === 1 ? "" : "s"} desde la importación
      </p>
    ) : null;

  const actions = (
    <FilterActions
      onApply={onApply}
      onClear={onClear}
      canClear={canClear}
      canApply={canApply}
    />
  );

  // Availability tab: Criterio → Buscar (ocupación) → Puerto → Posición → …
  if (isAvailabilityTab) {
    return (
      <>
        {heatModeField}
        {searchField}
        {portField}
        {positionField}
        {densityField}
        {lineField}
        {vesselField}
        {statusField}
        {conflictField}
        {datesField}
        {actions}
      </>
    );
  }

  return (
    <>
      {searchField}
      {calendarFields}
      {portField}
      {positionField}
      {lineField}
      {vesselField}
      {statusField}
      {conflictField}
      {datesField}
      {importedDatesNotice}
      {actions}
    </>
  );
}
