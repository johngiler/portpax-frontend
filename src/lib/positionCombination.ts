import {
  buildCombinedPositionCode,
  positionDisplayCode,
  positionShortCode,
} from "@/lib/positionCode";
import type { Position } from "@/types/catalog";

export type CombinedDefaults = {
  code: string;
  max_loa_m: number | null;
  min_draft_m: number | null;
  bollard_count: number | null;
  fender_count: number | null;
  berth: number | null;
  distinctBerths: boolean;
};

function parseDecimal(value: string | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function sumNullable(a: number | null, b: number | null): number | null {
  if (a == null && b == null) return null;
  return (a ?? 0) + (b ?? 0);
}

function minNullable(a: number | null, b: number | null): number | null {
  const values = [a, b].filter((v): v is number => v != null);
  return values.length ? Math.min(...values) : null;
}

export function canCombineAsBase(position: Position): boolean {
  return position.position_type === "pier" && !position.is_combined;
}

export function deriveCombinedDefaults(first: Position, second: Position): CombinedDefaults {
  const maxLoa = sumNullable(parseDecimal(first.max_loa_m), parseDecimal(second.max_loa_m));
  const minDraft = minNullable(parseDecimal(first.min_draft_m), parseDecimal(second.min_draft_m));
  const bollards = sumNullable(first.bollard_count, second.bollard_count);
  const fenders = sumNullable(first.fender_count, second.fender_count);

  const berthIds = new Set([first.berth, second.berth].filter((id): id is number => id != null));
  const sharedBerth = first.berth != null && first.berth === second.berth ? first.berth : null;

  return {
    code: buildCombinedPositionCode(
      first.port_code,
      positionDisplayCode(first),
      positionDisplayCode(second),
    ),
    max_loa_m: maxLoa,
    min_draft_m: minDraft,
    bollard_count: bollards,
    fender_count: fenders,
    berth: sharedBerth,
    distinctBerths: berthIds.size > 1,
  };
}

export function combinedPositionLabel(position: Position): string | null {
  if (!position.is_combined || !position.component_positions.length) return null;
  return position.component_positions.map((p) => p.code).join(" + ");
}