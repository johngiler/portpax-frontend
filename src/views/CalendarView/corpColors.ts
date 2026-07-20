/** Corporation color tokens aligned with SPEC (RCI/NCL/MSC/CCL/VV/otros). */

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

export const CORP_CHIP_CLASS: Record<CorpColorKey, string> = {
  rci: "bg-blue-600 text-white",
  ncl: "bg-emerald-600 text-white",
  msc: "bg-orange-500 text-white",
  ccl: "bg-red-600 text-white",
  vv: "bg-violet-600 text-white",
  other: "bg-zinc-500 text-white",
};

export const CORP_DOT_CLASS: Record<CorpColorKey, string> = {
  rci: "bg-blue-600",
  ncl: "bg-emerald-600",
  msc: "bg-orange-500",
  ccl: "bg-red-600",
  vv: "bg-violet-600",
  other: "bg-zinc-500",
};

export function corpKeyFromShippingLineCode(code: string | null | undefined): CorpColorKey {
  if (!code) return "other";
  const key = code.trim().toLowerCase().replace(/\s+/g, "_");
  return CODE_TO_CORP[key] ?? "other";
}
