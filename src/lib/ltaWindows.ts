/**
 * Rolling 6-month blocks for the LTA agreement form timeline.
 * Mirrors backend apps/bookings/services/lta/windows.py (client-side preview).
 *
 * Current period = 2 blocks (today's season + the previous one).
 * Then 3 open-booking blocks, then LTA zone.
 */

import { localTodayIso, parseIsoDate, toIsoDate } from "@/lib/bookingDates";
import type { LtaBookingPolicy } from "@/types/lta";

/** Período actual: today's block + one block backwards. */
export const CURRENT_BLOCKS = 2;
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
  current_blocks: number;
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

function previousBlock(
  season: SeasonKind,
  blockStartIso: string,
): { season: SeasonKind; from: string; to: string } {
  const { year } = parseIsoDate(blockStartIso);
  if (season === "winter") {
    return {
      season: "summer",
      from: dateFromParts(year, 4, 1),
      to: dateFromParts(year, 9, 31),
    };
  }
  return {
    season: "winter",
    from: dateFromParts(year - 1, 10, 1),
    to: dateFromParts(year, 3, 30),
  };
}

function windowStartBlock(todayIso: string): {
  season: SeasonKind;
  from: string;
  to: string;
} {
  let { season, from, to } = blockContaining(todayIso);
  for (let i = 0; i < Math.max(0, CURRENT_BLOCKS - 1); i += 1) {
    ({ season, from, to } = previousBlock(season, from));
  }
  return { season, from, to };
}

function seasonBlockLabel(season: SeasonKind, blockStartIso: string): string {
  const { year } = parseIsoDate(blockStartIso);
  if (season === "summer") return `Summer ${year}`;
  return `Winter ${year}/${year + 1}`;
}

export function firstLtaBlockIndex(
  openBlocks = OPEN_BLOCKS_AFTER_CURRENT,
): number {
  return CURRENT_BLOCKS + openBlocks;
}

function zoneForBlockIndex(
  index: number,
  ltaBlocks = DEFAULT_LTA_BLOCKS,
  openBlocks = OPEN_BLOCKS_AFTER_CURRENT,
): BookingWindowZone {
  if (index < 0) return "current";
  if (index < CURRENT_BLOCKS) return "current";
  if (index < CURRENT_BLOCKS + openBlocks) return "general";
  if (index < CURRENT_BLOCKS + openBlocks + ltaBlocks) return "lta_covered";
  return "beyond";
}

function listSeasonBlocks(
  todayIso?: string,
  count = CURRENT_BLOCKS + OPEN_BLOCKS_AFTER_CURRENT + DEFAULT_LTA_BLOCKS,
  ltaBlocks = DEFAULT_LTA_BLOCKS,
): SeasonBlock[] {
  const today = todayIso ?? localTodayIso();
  let { season, from, to } = windowStartBlock(today);
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
  const currentLast = blocks[CURRENT_BLOCKS - 1];
  const openLast = blocks[CURRENT_BLOCKS + OPEN_BLOCKS_AFTER_CURRENT - 1];
  const ltaFirst = blocks[CURRENT_BLOCKS + OPEN_BLOCKS_AFTER_CURRENT];
  const ltaLast =
    blocks[CURRENT_BLOCKS + OPEN_BLOCKS_AFTER_CURRENT + DEFAULT_LTA_BLOCKS - 1];
  return {
    reference_date: today,
    current_from: blocks[0].date_from,
    current_to: currentLast.date_to,
    general_from: blocks[CURRENT_BLOCKS].date_from,
    general_to: openLast.date_to,
    lta_from: ltaFirst.date_from,
    lta_to: ltaLast.date_to,
    current_blocks: CURRENT_BLOCKS,
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
