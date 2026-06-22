import { apiFetch, type ApiListResponse } from "@/services/apiClient";
import type { Berth, BerthPayload } from "@/types/catalog";

const BASE = "api/catalogs/berths/";

export type FetchBerthsParams = {
  port?: number;
  pageSize?: number;
};

export async function fetchBerths(params: FetchBerthsParams = {}): Promise<ApiListResponse<Berth>> {
  const query = new URLSearchParams();
  if (params.port) query.set("port", String(params.port));
  if (params.pageSize) query.set("page_size", String(params.pageSize));
  const qs = query.toString();
  return apiFetch<ApiListResponse<Berth>>(`${BASE}${qs ? `?${qs}` : ""}`);
}

export async function createBerth(payload: BerthPayload): Promise<Berth> {
  return apiFetch<Berth>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBerth(id: number, payload: BerthPayload): Promise<Berth> {
  return apiFetch<Berth>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteBerth(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
