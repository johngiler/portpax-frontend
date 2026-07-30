"use client";

import { useCallback, useState } from "react";
import FilterActions from "@/components/layout/FilterActions";
import FilterSuggestField from "@/components/layout/FilterSuggestField";
import BookingStatusGuideModal from "@/components/booking/BookingStatusGuideModal";
import { BookingStatusGuideToggle } from "@/components/booking/BookingStatusGuideTable";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import { suggestBookings } from "@/lib/filterSuggestions";
import type { BookingsTabQuery, CalendarViewModeQuery } from "@/lib/viewFilterQuery";
import type { BookingActivityKind } from "@/services/bookings/bookingActivityService";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchShippingLines } from "@/services/catalogs/shippingLineService";
import { fetchVessels } from "@/services/catalogs/vesselService";
import {
  BOOKING_STATUS_FILTER_OPTIONS,
  type BookingListStatusFilter,
} from "@/types/booking";
import { getTimeRange, availabilityDefaultRange } from "@/utils/timeRange";
import BookingsDateFilters, { type BookingsDatePreset } from "./BookingsDateFilters";

const STATUS_OPTIONS = BOOKING_STATUS_FILTER_OPTIONS
  .filter((option) => option.value !== "")
  .map((option) => ({
    value: option.value as Exclude<BookingListStatusFilter, "">,
    label: option.label,
  }));

const MODE_OPTIONS: { value: CalendarViewModeQuery; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "annual", label: "Anual" },
];

const HISTORY_KIND_OPTIONS: { value: BookingActivityKind; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "single", label: "Única" },
  { value: "bulk", label: "Masiva" },
];

type FilterOption = { value: number; label: string; logoUrl?: string | null };

type BookingFiltersProps = {
  tab: BookingsTabQuery;
  status: BookingListStatusFilter;
  search: string;
  portFilter: number;
  shippingLineFilter: number;
  vesselFilter: number;
  datePreset: BookingsDatePreset;
  customDateFrom: string;
  customDateTo: string;
  calendarMode: CalendarViewModeQuery;
  positionFilter: number;
  historyKind: BookingActivityKind;
  historyDateFrom: string;
  historyDateTo: string;
  portOptions: FilterOption[];
  shippingLineOptions: FilterOption[];
  vesselOptions: FilterOption[];
  positionOptions: FilterOption[];
  canClear: boolean;
  canApply: boolean;
  onStatusChange: (status: BookingListStatusFilter) => void;
  onSearchChange: (search: string) => void;
  onPortFilterChange: (portId: number) => void;
  onShippingLineFilterChange: (lineId: number) => void;
  onVesselFilterChange: (vesselId: number) => void;
  onDatePresetChange: (preset: BookingsDatePreset) => void;
  onCustomDateFromChange: (value: string) => void;
  onCustomDateToChange: (value: string) => void;
  onCalendarModeChange: (mode: CalendarViewModeQuery) => void;
  onPositionFilterChange: (positionId: number) => void;
  onHistoryKindChange: (kind: BookingActivityKind) => void;
  onHistoryDateFromChange: (value: string) => void;
  onHistoryDateToChange: (value: string) => void;
  importedDatesCount?: number;
  onApply: () => void;
  onClear: () => void;
};

export default function BookingFilters({
  tab,
  status,
  search,
  portFilter,
  shippingLineFilter,
  vesselFilter,
  datePreset,
  customDateFrom,
  customDateTo,
  calendarMode,
  positionFilter,
  historyKind,
  historyDateFrom,
  historyDateTo,
  portOptions,
  shippingLineOptions,
  vesselOptions,
  positionOptions,
  canClear,
  canApply,
  onStatusChange,
  onSearchChange,
  onPortFilterChange,
  onShippingLineFilterChange,
  onVesselFilterChange,
  onDatePresetChange,
  onCustomDateFromChange,
  onCustomDateToChange,
  onCalendarModeChange,
  onPositionFilterChange,
  onHistoryKindChange,
  onHistoryDateFromChange,
  onHistoryDateToChange,
  importedDatesCount = 0,
  onApply,
  onClear,
}: BookingFiltersProps) {
  const [statusGuideOpen, setStatusGuideOpen] = useState(false);
  const timeRange =
    datePreset === "all"
      ? tab === "availability"
        ? availabilityDefaultRange()
        : getTimeRange("hoy")
      : getTimeRange(datePreset, customDateFrom, customDateTo);

  const showVessel = tab === "list" || tab === "calendar" || tab === "availability";
  const showStatusSearch = tab !== "availability" && tab !== "history";
  const showLine = tab !== "history";
  const showDates = tab === "list" || tab === "availability";
  const showCalendarMode = tab === "calendar";
  const showPort = tab !== "history";
  const showPosition =
    tab === "list" || tab === "calendar" || tab === "availability";
  const showHistoryFilters = tab === "history";

  const loadPortOptions = useCallback(async (input: string) => {
    const res = await fetchPorts({
      search: input.trim() || undefined,
      pageSize: 30,
    });
    return res.results.map((p) => ({
      value: p.id,
      label: p.name,
      logoUrl: p.logo,
    }));
  }, []);

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

  return (
    <>
      {showHistoryFilters ? (
        <>
          <FormFieldSelect<BookingActivityKind>
            label="Tipo"
            name="history_kind"
            value={historyKind}
            onChange={onHistoryKindChange}
            options={HISTORY_KIND_OPTIONS}
            compact
          />
          <FormField
            label="Desde"
            name="history_date_from"
            type="date"
            value={historyDateFrom}
            onChange={(v) => onHistoryDateFromChange(String(v))}
            compact
          />
          <FormField
            label="Hasta"
            name="history_date_to"
            type="date"
            value={historyDateTo}
            onChange={(v) => onHistoryDateToChange(String(v))}
            compact
          />
        </>
      ) : null}

      {showStatusSearch ? (
        <FilterSuggestField
          label="Buscar"
          name="booking_search"
          value={search}
          onChange={onSearchChange}
          loadSuggestions={suggestBookings}
          placeholder="Código, puerto, barco…"
          onPick={(suggestion) => {
            if (suggestion.filterEntity === "port" && suggestion.entityId) {
              onPortFilterChange(suggestion.entityId);
              onSearchChange("");
              return;
            }
            if (
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
      ) : null}

      {showCalendarMode ? (
        <FormFieldSelect<CalendarViewModeQuery>
          label="Vista calendario"
          name="booking_calendar_mode"
          value={calendarMode}
          onChange={onCalendarModeChange}
          options={MODE_OPTIONS}
          compact
        />
      ) : null}

      {showPort ? (
        <FormFieldSelect<number>
          label="Puerto"
          name="booking_port_filter"
          value={portFilter}
          onChange={onPortFilterChange}
          options={portOptions}
          loadOptions={loadPortOptions}
          compact
          showLogo
          logoKind="port"
          required={false}
          optionLabel="Todos los puertos"
          emptyValue={0}
        />
      ) : null}

      {showPosition ? (
        <FormFieldSelect<number>
          label="Posición"
          name="booking_position_filter"
          value={positionFilter}
          onChange={onPositionFilterChange}
          options={positionOptions}
          optionLabel={
            portFilter > 0
              ? "Todas las posiciones"
              : "Elige un puerto primero"
          }
          emptyValue={0}
          compact
          disabled={portFilter <= 0}
        />
      ) : null}

      {showLine ? (
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
      ) : null}

      {showVessel ? (
        <FormFieldSelect<number>
          label="Barco"
          name="booking_vessel_filter"
          value={vesselFilter}
          onChange={onVesselFilterChange}
          options={vesselOptions}
          loadOptions={
            shippingLineFilter > 0 ? loadVesselOptions : undefined
          }
          optionLabel={
            shippingLineFilter > 0 ? "Todos los barcos" : "Elige una naviera primero"
          }
          emptyValue={0}
          compact
          showLogo
          logoKind="vessel"
          disabled={shippingLineFilter <= 0}
        />
      ) : null}

      {showStatusSearch ? (
        <>
          <FormFieldSelect<string>
            label="Estado"
            name="booking_status_filter"
            value={status}
            onChange={(value) => onStatusChange(value as BookingListStatusFilter)}
            options={STATUS_OPTIONS}
            optionLabel="Todos los estados"
            emptyValue=""
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
      ) : null}

      {showDates ? (
        <BookingsDateFilters
          datePreset={datePreset}
          customDateFrom={customDateFrom}
          customDateTo={customDateTo}
          timeRange={timeRange}
          showAllRangeHint={tab === "availability"}
          importedDatesCount={
            tab === "availability" ? importedDatesCount : 0
          }
          onDatePresetChange={onDatePresetChange}
          onCustomDateFromChange={onCustomDateFromChange}
          onCustomDateToChange={onCustomDateToChange}
        />
      ) : null}

      <FilterActions
        onApply={onApply}
        onClear={onClear}
        canClear={canClear}
        canApply={canApply}
      />
    </>
  );
}
