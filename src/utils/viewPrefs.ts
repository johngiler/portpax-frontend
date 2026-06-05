import type { TimeFilterPreset } from "@/utils/timeRange";

const STORAGE_KEY = "portpax-view-time-prefs";

export type ViewTimePrefs = {
  timeFilter: TimeFilterPreset;
  customDateFrom: string;
  customDateTo: string;
};

function isValidTimeFilter(v: string): v is TimeFilterPreset {
  return ["hoy", "7d", "30d", "temporada", "custom"].includes(v);
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function defaultCustomFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toISOString().slice(0, 10);
}

function defaultCustomTo(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadViewTimePrefs(): ViewTimePrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    return {
      timeFilter:
        typeof data.timeFilter === "string" && isValidTimeFilter(data.timeFilter)
          ? data.timeFilter
          : "7d",
      customDateFrom:
        typeof data.customDateFrom === "string" && isValidDate(data.customDateFrom)
          ? data.customDateFrom
          : defaultCustomFrom(),
      customDateTo:
        typeof data.customDateTo === "string" && isValidDate(data.customDateTo)
          ? data.customDateTo
          : defaultCustomTo(),
    };
  } catch {
    return null;
  }
}

export function saveViewTimePrefs(prefs: ViewTimePrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}
