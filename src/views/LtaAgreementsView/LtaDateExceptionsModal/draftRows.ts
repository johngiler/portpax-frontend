import type { LtaDateException } from "@/types/lta";

export type ExceptionDraftRow = {
  key: string;
  /** Pattern date when source is rule / skip / reschedule. */
  ruleIso: string | null;
  /** Effective date shown (rule, include, or reschedule target). */
  iso: string;
  kind: "rule" | "include" | "skip" | "reschedule";
};

export function buildDraftRows(
  ruleDates: string[],
  exceptions: LtaDateException[],
): ExceptionDraftRow[] {
  const skip = new Set<string>();
  const include = new Set<string>();
  const reschedule = new Map<string, string>();

  for (const item of exceptions) {
    if (item.kind === "skip") skip.add(item.date);
    else if (item.kind === "include") include.add(item.date);
    else if (item.kind === "reschedule") {
      skip.add(item.from);
      reschedule.set(item.from, item.to);
    }
  }

  const rows: ExceptionDraftRow[] = [];
  const usedTargets = new Set<string>();

  for (const ruleIso of ruleDates) {
    const target = reschedule.get(ruleIso);
    if (target) {
      usedTargets.add(target);
      rows.push({
        key: `rule:${ruleIso}`,
        ruleIso,
        iso: target,
        kind: "reschedule",
      });
      continue;
    }
    if (skip.has(ruleIso)) {
      rows.push({
        key: `rule:${ruleIso}`,
        ruleIso,
        iso: ruleIso,
        kind: "skip",
      });
      continue;
    }
    rows.push({
      key: `rule:${ruleIso}`,
      ruleIso,
      iso: ruleIso,
      kind: "rule",
    });
  }

  for (const date of [...include].sort()) {
    if (usedTargets.has(date) || reschedule.has(date)) continue;
    if (ruleDates.includes(date) && !skip.has(date)) continue;
    rows.push({
      key: `include:${date}`,
      ruleIso: null,
      iso: date,
      kind: "include",
    });
  }

  rows.sort((a, b) => a.iso.localeCompare(b.iso));
  return rows;
}

export function draftRowsToExceptions(
  rows: ExceptionDraftRow[],
): LtaDateException[] {
  const out: LtaDateException[] = [];
  for (const row of rows) {
    if (row.kind === "skip" && row.ruleIso) {
      out.push({ kind: "skip", date: row.ruleIso });
    } else if (row.kind === "reschedule" && row.ruleIso && row.iso !== row.ruleIso) {
      out.push({ kind: "reschedule", from: row.ruleIso, to: row.iso });
    } else if (row.kind === "include") {
      out.push({ kind: "include", date: row.iso });
    }
  }
  return out;
}
