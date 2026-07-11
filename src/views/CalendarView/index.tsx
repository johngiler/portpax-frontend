"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import TimeRangeFilters from "@/components/filters/TimeRangeFilters";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import { toIsoDate } from "@/lib/bookingDates";
import {
  expandRangeForOccupancy,
  getTimeRange,
  type TimeFilterPreset,
} from "@/utils/timeRange";
import { loadViewTimePrefs, saveViewTimePrefs } from "@/utils/viewPrefs";
import OccupancySection from "./OccupancySection";
import CalendarViewSkeleton from "./CalendarViewSkeleton";

function defaultCustomFrom(): string {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function defaultCustomTo(): string {
  const d = new Date();
  d.setDate(d.getDate() + 29);
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function CalendarView() {
  const [timeFilter, setTimeFilter] = useState<TimeFilterPreset>("30d");
  const [customDateFrom, setCustomDateFrom] = useState(defaultCustomFrom);
  const [customDateTo, setCustomDateTo] = useState(defaultCustomTo);
  const [hasLoadedPrefs, setHasLoadedPrefs] = useState(false);

  useEffect(() => {
    const prefs = loadViewTimePrefs();
    if (prefs) {
      setTimeFilter(prefs.timeFilter);
      setCustomDateFrom(prefs.customDateFrom);
      setCustomDateTo(prefs.customDateTo);
    }
    setHasLoadedPrefs(true);
  }, []);

  const timeRange = useMemo(
    () => getTimeRange(timeFilter, customDateFrom, customDateTo),
    [timeFilter, customDateFrom, customDateTo],
  );

  const occupancyRange = useMemo(
    () => expandRangeForOccupancy(timeRange),
    [timeRange],
  );

  useEffect(() => {
    if (!hasLoadedPrefs) return;
    saveViewTimePrefs({ timeFilter, customDateFrom, customDateTo });
  }, [hasLoadedPrefs, timeFilter, customDateFrom, customDateTo]);

  if (!hasLoadedPrefs) {
    return <CalendarViewSkeleton />;
  }

  return (
    <>
      <FilterSidebarContent>
        <TimeRangeFilters
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          customDateFrom={customDateFrom}
          setCustomDateFrom={setCustomDateFrom}
          customDateTo={customDateTo}
          setCustomDateTo={setCustomDateTo}
          timeRange={timeRange}
          canClear={timeFilter !== "30d"}
          onClear={() => {
            setTimeFilter("30d");
            setCustomDateFrom(defaultCustomFrom());
            setCustomDateTo(defaultCustomTo());
          }}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={CalendarRange}
        title="Calendario"
        description="Mapa de ocupación anual por puerto. Usa el período del sidebar para acotar el horizonte."
      />

      <OccupancySection
        dateFrom={occupancyRange.date_from}
        dateTo={occupancyRange.date_to}
      />
    </>
  );
}
