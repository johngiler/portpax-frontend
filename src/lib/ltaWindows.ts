/**
 * Rolling 6-month blocks for the LTA agreement form timeline.
 * Mirrors backend apps/bookings/services/lta/windows.py (client-side preview).
 */

import { localTodayIso, parseIsoDate, toIsoDate } from "@/lib/bookingDates";
import type { LtaBookingPolicy } from "@/types/lta";

export const OPEN_BLOCKS_AFTER_CURRENT = 3;
export const DEFAULT_LTA_BLOCKS = 4;

export type SeasonKind = "summer" | "winter";

export type BookingWindowZone = "current" | "general" | "lta_covered" | "beyond";

export type SeasonBlock = {
  index: number;
  season: SeasonKind;
  label: string;
  date_from: string;
  date_to: string;
  zone: BookingWindowZone;
};

export type SeasonalWindowsSnapshot = {
  reference_date: string;
  current_from: string;
  current_to: string;
  general_from: string;
  general_to: string;
  lta_from: string;
  lta_to: string;
  open_blocks: number;
  blocks: SeasonBlock[];
};

function dateFromParts(year: number, monthIndex: number, day: number): string {
  return toIsoDate(year, monthIndex, day);
}

function blockContaining(iso: string): { season: SeasonKind; from: string; to: string } {
  const { year, monthIndex } = parseIsoDate(iso);
  const m = monthIndex + 1;
  if (m >= 5 && m <= 10) {
    return {
      season: "summer",
      from: dateFromParts(year, 4, 1),
      to: dateFromParts(year, 9, 31),
    };
  }
  if (m >= 11) {
    return {
      season: "winter",
      from: dateFromParts(year, 10, 1),
      to: dateFromParts(year + 1, 3, 30),
    };
  }
  return {
    season: "winter",
    from: dateFromParts(year - 1, 10, 1),
    to: dateFromParts(year, 3, 30),
  };
}

function nextBlock(
  season: SeasonKind,
  blockEndIso: string,
): { season: SeasonKind; from: string; to: string } {
  const { year } = parseIsoDate(blockEndIso);
  if (season === "summer") {
    return {
      season: "winter",
      from: dateFromParts(year, 10, 1),
      to: dateFromParts(year + 1, 3, 30),
    };
  }
  return {
    season: "summer",
    from: dateFromParts(year, 4, 1),
    to: dateFromParts(year, 9, 31),
  };
}

function seasonBlockLabel(season: SeasonKind, blockStartIso: string): string {
  const { year } = parseIsoDate(blockStartIso);
  if (season === "summer") return `Summer ${year}`;
  return `Winter ${year}/${year + 1}`;
}

function zoneForBlockIndex(
  index: number,
  ltaBlocks = DEFAULT_LTA_BLOCKS,
): BookingWindowZone {
  if (index < 0) return "current";
  if (index === 0) return "current";
  if (index <= OPEN_BLOCKS_AFTER_CURRENT) return "general";
  if (index <= OPEN_BLOCKS_AFTER_CURRENT + ltaBlocks) return "lta_covered";
  return "beyond";
}

function listSeasonBlocks(
  todayIso?: string,
  count = OPEN_BLOCKS_AFTER_CURRENT + DEFAULT_LTA_BLOCKS + 1,
  ltaBlocks = DEFAULT_LTA_BLOCKS,
): SeasonBlock[] {
  const today = todayIso ?? localTodayIso();
  let { season, from, to } = blockContaining(today);
  const blocks: SeasonBlock[] = [];
  for (let idx = 0; idx < count; idx += 1) {
    blocks.push({
      index: idx,
      season,
      label: seasonBlockLabel(season, from),
      date_from: from,
      date_to: to,
      zone: zoneForBlockIndex(idx, ltaBlocks),
    });
    ({ season, from, to } = nextBlock(season, to));
  }
  return blocks;
}

export function buildSeasonalWindowsSnapshot(todayIso?: string): SeasonalWindowsSnapshot {
  const today = todayIso ?? localTodayIso();
  const blocks = listSeasonBlocks(today);
  const openLast = blocks[OPEN_BLOCKS_AFTER_CURRENT];
  const ltaFirst = blocks[OPEN_BLOCKS_AFTER_CURRENT + 1];
  const ltaLast = blocks[OPEN_BLOCKS_AFTER_CURRENT + DEFAULT_LTA_BLOCKS];
  const current = blocks[0];
  return {
    reference_date: today,
    current_from: current.date_from,
    current_to: current.date_to,
    general_from: blocks[1].date_from,
    general_to: openLast.date_to,
    lta_from: ltaFirst.date_from,
    lta_to: ltaLast.date_to,
    open_blocks: OPEN_BLOCKS_AFTER_CURRENT,
    blocks,
  };
}

export const ZONE_LABEL: Record<BookingWindowZone, string> = {
  current: "Período actual",
  general: "Open booking",
  lta_covered: "Zona LTA",
  beyond: "Fuera de ventana",
};

export function blockOverlapsAgreement(
  block: SeasonBlock,
  validFrom: string | null,
  validUntil: string | null,
): boolean {
  if (validFrom && block.date_to < validFrom) return false;
  if (validUntil && block.date_from > validUntil) return false;
  return true;
}

export function agreementBookableBlockIndices(
  policy: LtaBookingPolicy,
  depthBlocks: number,
  validFrom: string | null,
  todayIso?: string,
): Set<number> {
  const today = todayIso ?? localTodayIso();
  const blocks = listSeasonBlocks(today);
  const ltaBlocks = blocks.filter((b) => b.zone === "lta_covered");
  const depth = Math.max(1, depthBlocks);
  const allowed = new Set<number>();

  const inStabilization = (() => {
    const anchor = validFrom ?? today;
    const anchorBlock = blockContaining(anchor);
    const { year: ay, monthIndex: am, day: ad } = parseIsoDate(anchorBlock.from);
    const { year: ty, monthIndex: tm, day: td } = parseIsoDate(today);
    let months = (ty - ay) * 12 + (tm - am);
    if (td < ad) months -= 1;
    return months < 12;
  })();

  const todaySeason = blockContaining(today).season;

  for (let i = 0; i < Math.min(depth, ltaBlocks.length); i += 1) {
    const block = ltaBlocks[i];
    if (policy === "standard") {
      allowed.add(block.index);
      continue;
    }
    if (inStabilization && i < 3) {
      allowed.add(block.index);
      continue;
    }
    if (todaySeason === "summer" && block.season === "winter") {
      allowed.add(block.index);
    }
    if (todaySeason === "winter" && block.season === "summer") {
      allowed.add(block.index);
    }
  }
  return allowed;
}
