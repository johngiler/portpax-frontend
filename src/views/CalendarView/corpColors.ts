/** Corporation color tokens — muted/neutral chips for calendar readability. */

export type CorpColorKey = "rci" | "ncl" | "msc" | "ccl" | "vv" | "other";

const CODE_TO_CORP: Record<string, CorpColorKey> = {
  royal_caribbean_international: "rci",
  celebrity_cruises: "rci",
  rccl: "rci",
  rci: "rci",
  cel: "rci",
  norwegian_cruise_line: "ncl",
  oceania_cruises: "ncl",
  regent_seven_seas_cruises: "ncl",
  ncl: "ncl",
  oc: "ncl",
  reg: "ncl",
  msc_cruises: "msc",
  msc: "msc",
  carnival_cruise_line: "ccl",
  princess_cruises: "ccl",
  holland_america_line: "ccl",
  costa_cruises: "ccl",
  aida_cruises: "ccl",
  ccl: "ccl",
  pcl: "ccl",
  hal: "ccl",
  cos: "ccl",
  aida: "ccl",
  virgin_voyages: "vv",
  vv: "vv",
};

/** Soft zinc/slate chips with a thin corp accent (not saturated fills). */
export const CORP_CHIP_CLASS: Record<CorpColorKey, string> = {
  rci: "bg-zinc-100 text-zinc-800 ring-1 ring-inset ring-zinc-200/90 border-l-[3px] border-l-slate-400 dark:bg-zinc-800/80 dark:text-zinc-100 dark:ring-zinc-700 dark:border-l-slate-400",
  ncl: "bg-zinc-100 text-zinc-800 ring-1 ring-inset ring-zinc-200/90 border-l-[3px] border-l-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-100 dark:ring-zinc-700 dark:border-l-zinc-400",
  msc: "bg-stone-100 text-stone-800 ring-1 ring-inset ring-stone-200/90 border-l-[3px] border-l-stone-400 dark:bg-zinc-800/80 dark:text-zinc-100 dark:ring-zinc-700 dark:border-l-stone-400",
  ccl: "bg-neutral-100 text-neutral-800 ring-1 ring-inset ring-neutral-200/90 border-l-[3px] border-l-neutral-500 dark:bg-zinc-800/80 dark:text-zinc-100 dark:ring-zinc-700 dark:border-l-neutral-400",
  vv: "bg-zinc-100 text-zinc-800 ring-1 ring-inset ring-zinc-200/90 border-l-[3px] border-l-zinc-400 dark:bg-zinc-800/80 dark:text-zinc-100 dark:ring-zinc-700 dark:border-l-zinc-300",
  other: "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200/90 border-l-[3px] border-l-zinc-300 dark:bg-zinc-800/80 dark:text-zinc-200 dark:ring-zinc-700 dark:border-l-zinc-500",
};

export const CORP_DOT_CLASS: Record<CorpColorKey, string> = {
  rci: "bg-slate-400",
  ncl: "bg-zinc-500",
  msc: "bg-stone-400",
  ccl: "bg-neutral-500",
  vv: "bg-zinc-400",
  other: "bg-zinc-300",
};

/** Short labels matching the calendar color legend. */
export const CORP_SHORT_LABEL: Record<CorpColorKey, string> = {
  rci: "RCI",
  ncl: "NCL",
  msc: "MSC",
  ccl: "Carnival",
  vv: "Virgin",
  other: "Otras",
};

export function corpKeyFromShippingLineCode(code: string | null | undefined): CorpColorKey {
  if (!code) return "other";
  const key = code.trim().toLowerCase().replace(/\s+/g, "_");
  return CODE_TO_CORP[key] ?? "other";
}
