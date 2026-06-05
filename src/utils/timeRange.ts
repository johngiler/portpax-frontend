export type TimeFilterPreset = "hoy" | "7d" | "30d" | "temporada" | "custom";

export type TimeRange = {
  date_from: string;
  date_to: string;
};

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
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
  refDate?: Date
): TimeRange {
  const now = refDate || new Date();
  const today = toISO(now);

  switch (preset) {
    case "hoy":
      return { date_from: today, date_to: today };
    case "7d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { date_from: toISO(from), date_to: today };
    }
    case "30d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { date_from: toISO(from), date_to: today };
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
  "7d": "7 días",
  "30d": "30 días",
  temporada: "Temporada",
  custom: "Rango personalizado",
};
