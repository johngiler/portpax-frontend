import { apiFetch, type ApiListResponse } from "@/services/apiClient";
import type { Vessel, VesselPayload } from "@/types/cruise";

const BASE = "api/catalogs/vessels/";

export type FetchVesselsParams = {
  page?: number;
  search?: string;
  shipping_line?: number;
  pageSize?: number;
};

export async function fetchVessels(
  params: FetchVesselsParams = {},
): Promise<ApiListResponse<Vessel>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.shipping_line) query.set("shipping_line", String(params.shipping_line));
  if (params.pageSize) query.set("page_size", String(params.pageSize));
  const qs = query.toString();
  return apiFetch<ApiListResponse<Vessel>>(`${BASE}${qs ? `?${qs}` : ""}`);
}

export async function createVessel(payload: VesselPayload): Promise<Vessel> {
  return apiFetch<Vessel>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVessel(id: number, payload: VesselPayload): Promise<Vessel> {
  return apiFetch<Vessel>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteVessel(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
