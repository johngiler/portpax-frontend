import { toIsoDate } from "@/lib/bookingDates";
import type { TimeFilterPreset } from "@/utils/timeRange";

const STORAGE_KEY = "portpax-view-time-prefs";
const PREFS_VERSION = 2;

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
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function defaultCustomTo(): string {
  const d = new Date();
  d.setDate(d.getDate() + 29);
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

export function loadViewTimePrefs(): ViewTimePrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    const version = typeof data.prefsVersion === "number" ? data.prefsVersion : 1;
    if (version < PREFS_VERSION) return null;

    return {
      timeFilter:
        typeof data.timeFilter === "string" && isValidTimeFilter(data.timeFilter)
          ? data.timeFilter
          : "30d",
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
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...prefs, prefsVersion: PREFS_VERSION }),
    );
  } catch {
    // ignore
  }
}
