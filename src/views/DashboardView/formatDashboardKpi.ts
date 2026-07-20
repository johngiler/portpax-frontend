import type { DashboardYoyMetric } from "@/types/dashboard";

/** Compact display for large KPI numbers (es-MX style). */
export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("es", { maximumFractionDigits: 1 })} M`;
  }
  if (Math.abs(value) >= 10_000) {
    return `${(value / 1_000).toLocaleString("es", { maximumFractionDigits: 1 })} mil`;
  }
  return value.toLocaleString("es");
}

export type YoyTone = "up" | "down" | "neutral" | "warn";

export type YoyBadge = {
  label: string;
  tone: YoyTone;
};

/**
 * Avoid absurd % when prior-year base is incomplete (e.g. PAX barely loaded).
 * Falls back to absolute prior comparison.
 */
export function formatYoyBadge(metric: DashboardYoyMetric): YoyBadge {
  const { current, prior, delta_pct: delta } = metric;

  if (prior === 0) {
    if (current === 0) return { label: "Sin cambio YoY", tone: "neutral" };
    return { label: "Sin base YoY comparable", tone: "warn" };
  }

  if (delta == null) {
    return { label: "Sin base YoY", tone: "warn" };
  }

  const ratio = current / prior;
  if (Math.abs(delta) >= 100 && ratio >= 5) {
    return {
      label: `vs ${formatCompactNumber(prior)} año ant.`,
      tone: "warn",
    };
  }

  const sign = delta > 0 ? "+" : "";
  const label = `${sign}${delta.toLocaleString("es", { maximumFractionDigits: 1 })}% YoY`;
  if (delta > 0) return { label, tone: "up" };
  if (delta < 0) return { label, tone: "down" };
  return { label: "0% YoY", tone: "neutral" };
}

export const YOY_TONE_CLASS: Record<YoyTone, string> = {
  up: "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
  down: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  neutral: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  warn: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
};
