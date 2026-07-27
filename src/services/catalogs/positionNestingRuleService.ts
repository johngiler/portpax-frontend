import { apiFetch, type ApiListResponse } from "@/services/apiClient";
import type { PositionNestingRule } from "@/types/catalog";

const BASE = "api/catalogs/position-nesting-rules/";

export async function fetchPositionNestingRules(
  portId: number,
): Promise<PositionNestingRule[]> {
  const data = await apiFetch<ApiListResponse<PositionNestingRule>>(
    `${BASE}?port=${portId}&page_size=100`,
  );
  return data.results;
}

export type PositionNestingRulePayload = {
  port: number;
  outer_position: number;
  inner_position: number;
  enforce_eta?: boolean;
  enforce_etd?: boolean;
  is_active?: boolean;
  notes?: string;
};

export async function createPositionNestingRule(
  payload: PositionNestingRulePayload,
): Promise<PositionNestingRule> {
  return apiFetch<PositionNestingRule>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePositionNestingRule(
  id: number,
  payload: Partial<PositionNestingRulePayload>,
): Promise<PositionNestingRule> {
  return apiFetch<PositionNestingRule>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePositionNestingRule(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
