"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Booking } from "@/types/booking";
import OccupancyDayTooltip, {
  anchorFromElement,
  type TooltipAnchor,
} from "../OccupancySection/OccupancyDayTooltip";

type DayTooltipState = {
  hoveredDate: string | null;
  hoverAnchor: TooltipAnchor | null;
  selectedDate: string | null;
  selectedAnchor: TooltipAnchor | null;
};

export function useDayTooltip(bookings: Booking[]) {
  const [state, setState] = useState<DayTooltipState>({
    hoveredDate: null,
    hoverAnchor: null,
    selectedDate: null,
    selectedAnchor: null,
  });
  const hoverClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hoverClearTimer.current) clearTimeout(hoverClearTimer.current);
    };
  }, []);

  function clearHoverTimer() {
    if (hoverClearTimer.current) {
      clearTimeout(hoverClearTimer.current);
      hoverClearTimer.current = null;
    }
  }

  function onDaySelect(date: string | null, el?: Element | null) {
    clearHoverTimer();
    setState({
      hoveredDate: null,
      hoverAnchor: null,
      selectedDate: date,
      selectedAnchor: date && el ? anchorFromElement(el) : null,
    });
  }

  function onDayHover(date: string | null, el?: Element | null) {
    clearHoverTimer();
    if (date && el) {
      setState((prev) => ({
        ...prev,
        hoveredDate: date,
        hoverAnchor: anchorFromElement(el),
      }));
      return;
    }
    hoverClearTimer.current = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        hoveredDate: null,
        hoverAnchor: null,
      }));
    }, 140);
  }

  const detailDate = state.hoveredDate ?? state.selectedDate;
  const tooltipAnchor = state.hoverAnchor ?? state.selectedAnchor;
  const detailBookings = useMemo(() => {
    if (!detailDate) return [];
    return bookings.filter((b) => b.call_date === detailDate);
  }, [bookings, detailDate]);

  const pinned = Boolean(state.selectedDate && !state.hoveredDate);

  const tooltip =
    detailDate && tooltipAnchor ? (
      <OccupancyDayTooltip
        date={detailDate}
        bookings={detailBookings}
        anchor={tooltipAnchor}
        pinned={pinned}
        onClose={() => onDaySelect(null)}
        onKeepOpen={() => clearHoverTimer()}
        onHoverLeave={() => onDayHover(null)}
      />
    ) : null;

  return {
    onDayHover,
    onDaySelect,
    tooltip,
  };
}
