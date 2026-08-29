export const reportMatrix = {
  shell:
    "flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/30",
  scroll: "overflow-x-auto",
  /** Vertical + horizontal scroll for paginated report tables. */
  scrollPanel: "max-h-[min(36rem,70vh)] overflow-auto",
  table: "min-w-full border-collapse text-xs sm:text-sm",
  sectionBanner:
    "rounded-lg border border-zinc-200/80 bg-zinc-50/90 px-3 py-2 text-xs font-semibold tracking-tight text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100",
  sectionGroup:
    "overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50/40 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/30",
  sectionGroupHeader:
    "flex items-center gap-3 border-b border-zinc-200/70 bg-white/90 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50",
  sectionGroupBody: "flex flex-col gap-4 p-4",
  sectionGroupKicker:
    "text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400",
  sectionGroupTitle:
    "text-sm font-semibold text-zinc-900 dark:text-zinc-50",
  shellNested:
    "flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800/60 dark:bg-zinc-900/20",
  cornerHeader:
    "sticky left-0 z-20 min-w-[4.5rem] border-b border-r border-zinc-200/80 bg-zinc-100/90 px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400",
  monthHeader:
    "min-w-[2.75rem] border-b border-zinc-200/60 bg-zinc-50 px-1.5 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400",
  totalHeader:
    "min-w-[3.25rem] border-b border-zinc-200/80 bg-zinc-100/80 px-1.5 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",
  rowLabel:
    "sticky left-0 z-10 border-r border-zinc-100 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200",
  rowLabelAlt:
    "sticky left-0 z-10 border-r border-zinc-100 bg-zinc-50/40 px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200",
  dataCell:
    "border-b border-zinc-100/80 px-2 py-1.5 text-right tabular-nums text-zinc-700 dark:border-zinc-800/80 dark:text-zinc-200",
  dataCellAlt:
    "border-b border-zinc-100/80 bg-zinc-50/30 px-2 py-1.5 text-right tabular-nums text-zinc-700 dark:border-zinc-800/80 dark:bg-zinc-950/20 dark:text-zinc-200",
  totalRowLabel:
    "sticky left-0 z-10 border-r border-zinc-200/80 bg-zinc-100/70 px-2.5 py-2 text-left text-[11px] font-semibold uppercase text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100",
  totalDataCell:
    "border-b border-zinc-200/60 bg-zinc-100/50 px-2 py-2 text-right text-xs font-semibold tabular-nums text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-100",
  growthPositive: "font-semibold text-emerald-600 dark:text-emerald-400",
  growthNegative: "font-semibold text-red-600 dark:text-red-400",
  growthNeutral: "text-zinc-500 dark:text-zinc-400",
  subHeader:
    "border-b border-zinc-200/60 bg-zinc-50/50 px-2 py-1 text-center text-[9px] font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-500",
} as const;

/** Uniform body padding for report ViewSections (same x/y, full inner width). */
export const reportViewSectionBody = "p-4 sm:p-5";

export const matrixMetricTheme = {
  calls: {
    iconWrap:
      "bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/15 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/20",
    accent: "text-sky-700 dark:text-sky-300",
    headerBar: "border-sky-200/60 bg-sky-50/40 dark:border-sky-900/40 dark:bg-sky-950/20",
    line1: "Call",
    line2: "summary",
  },
  pax: {
    iconWrap:
      "bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/15 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/20",
    accent: "text-violet-700 dark:text-violet-300",
    headerBar:
      "border-violet-200/60 bg-violet-50/40 dark:border-violet-900/40 dark:bg-violet-950/20",
    line1: "Passenger",
    line2: "summary",
  },
} as const;

export function formatMatrixValue(value: number, compact = false): string {
  if (!value) return "—";
  if (compact && value >= 1000) {
    return value.toLocaleString("es-MX", { maximumFractionDigits: 0 });
  }
  return value.toLocaleString("es-MX");
}

export function formatGrowthPct(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value === 0) return "0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}
