import { apiFetch, type ApiListResponse } from "@/services/apiClient";
import type { Position, PositionPayload } from "@/types/catalog";

const BASE = "api/catalogs/positions/";

export type FetchPositionsParams = {
  port?: number;
  pageSize?: number;
};

export async function fetchPositions(
  params: FetchPositionsParams = {},
): Promise<ApiListResponse<Position>> {
  const query = new URLSearchParams();
  if (params.port) query.set("port", String(params.port));
  if (params.pageSize) query.set("page_size", String(params.pageSize));
  const qs = query.toString();
  return apiFetch<ApiListResponse<Position>>(`${BASE}${qs ? `?${qs}` : ""}`);
}

export async function createPosition(payload: PositionPayload): Promise<Position> {
  return apiFetch<Position>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePosition(id: number, payload: PositionPayload): Promise<Position> {
  return apiFetch<Position>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePosition(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
