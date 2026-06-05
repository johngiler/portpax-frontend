import {
  DEFAULT_DASHBOARD_VISIBILITY,
  type DashboardVisibility,
} from "@/types/dashboard";
import type { TimeFilterPreset } from "@/utils/timeRange";

const STORAGE_KEY = "portpax-dashboard-prefs";

export type DashboardPrefs = {
  visibility: DashboardVisibility;
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

function mergeVisibility(stored: unknown): DashboardVisibility {
  if (!stored || typeof stored !== "object") return DEFAULT_DASHBOARD_VISIBILITY;
  const def = DEFAULT_DASHBOARD_VISIBILITY;
  const keys = Object.keys(def) as (keyof DashboardVisibility)[];
  const out = { ...def };
  const obj = stored as Record<string, unknown>;
  for (const key of keys) {
    if (key in obj && typeof obj[key] === "boolean") {
      out[key] = obj[key] as boolean;
    }
  }
  return out;
}

function defaultCustomFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toISOString().slice(0, 10);
}

function defaultCustomTo(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadDashboardPrefs(): DashboardPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    const timeFilter = typeof data.timeFilter === "string" && isValidTimeFilter(data.timeFilter)
      ? data.timeFilter
      : "7d";
    const customDateFrom =
      typeof data.customDateFrom === "string" && isValidDate(data.customDateFrom)
        ? data.customDateFrom
        : defaultCustomFrom();
    const customDateTo =
      typeof data.customDateTo === "string" && isValidDate(data.customDateTo)
        ? data.customDateTo
        : defaultCustomTo();
    return {
      visibility: mergeVisibility(data.visibility),
      timeFilter,
      customDateFrom,
      customDateTo,
    };
  } catch {
    return null;
  }
}

export function saveDashboardPrefs(prefs: DashboardPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}
