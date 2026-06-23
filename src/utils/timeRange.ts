import { toIsoDate } from "@/lib/bookingDates";

export type TimeFilterPreset = "hoy" | "7d" | "30d" | "temporada" | "custom";

export type TimeRange = {
  date_from: string;
  date_to: string;
};

function toLocalISO(d: Date): string {
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function getSeasonRange(now: Date): TimeRange {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  if (m >= 5) {
    return { date_from: `${y}-10-01`, date_to: `${y + 1}-04-30` };
  }
  return { date_from: `${y - 1}-10-01`, date_to: `${y}-04-30` };
}

export function getTimeRange(
  preset: TimeFilterPreset,
  customFrom?: string,
  customTo?: string,
  refDate?: Date,
): TimeRange {
  const now = refDate || new Date();
  const today = toLocalISO(now);

  switch (preset) {
    case "hoy":
      return { date_from: today, date_to: today };
    case "7d": {
      const to = new Date(now);
      to.setDate(to.getDate() + 6);
      return { date_from: today, date_to: toLocalISO(to) };
    }
    case "30d": {
      const to = new Date(now);
      to.setDate(to.getDate() + 29);
      return { date_from: today, date_to: toLocalISO(to) };
    }
    case "temporada":
      return getSeasonRange(now);
    case "custom":
      if (customFrom && customTo) {
        return customFrom <= customTo
          ? { date_from: customFrom, date_to: customTo }
          : { date_from: customTo, date_to: customFrom };
      }
      return { date_from: today, date_to: today };
    default:
      return { date_from: today, date_to: today };
  }
}

export const TIME_FILTER_LABELS: Record<TimeFilterPreset, string> = {
  hoy: "Hoy",
  "7d": "Próx. 7 días",
  "30d": "Próx. 30 días",
  temporada: "Temporada",
  custom: "Rango personalizado",
};

/** Max years ahead (from today) for the dashboard occupancy calendar and data load. */
export const OCCUPANCY_MAX_FORWARD_YEARS = 5;

/** Widen the occupancy calendar so upcoming port calls stay visible beyond a short filter window. */
export function expandRangeForOccupancy(
  range: TimeRange,
  forwardYears = OCCUPANCY_MAX_FORWARD_YEARS,
  refDate?: Date,
): TimeRange {
  const now = refDate || new Date();
  const today = toLocalISO(now);
  const horizonYear = now.getFullYear() + forwardYears;
  const horizon = toIsoDate(horizonYear, 11, 31);

  return {
    date_from: range.date_from < today ? range.date_from : today,
    date_to: range.date_to > horizon ? range.date_to : horizon,
  };
}
