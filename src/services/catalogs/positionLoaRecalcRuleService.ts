import { apiFetch, type ApiListResponse } from "@/services/apiClient";
import type { PositionLoaRecalcRule } from "@/types/catalog";

const BASE = "api/catalogs/position-loa-recalc-rules/";

export async function fetchPositionLoaRecalcRules(
  portId: number,
): Promise<PositionLoaRecalcRule[]> {
  const data = await apiFetch<ApiListResponse<PositionLoaRecalcRule>>(
    `${BASE}?port=${portId}&page_size=100`,
  );
  return data.results;
}

export type PositionLoaRecalcRulePayload = {
  port: number;
  combined_position: number;
  min_separation_m: number;
  is_active?: boolean;
  notes?: string;
};

export async function createPositionLoaRecalcRule(
  payload: PositionLoaRecalcRulePayload,
): Promise<PositionLoaRecalcRule> {
  return apiFetch<PositionLoaRecalcRule>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePositionLoaRecalcRule(
  id: number,
  payload: Partial<PositionLoaRecalcRulePayload>,
): Promise<PositionLoaRecalcRule> {
  return apiFetch<PositionLoaRecalcRule>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePositionLoaRecalcRule(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
