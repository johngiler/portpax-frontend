import { apiFetch, type ApiListResponse } from "@/services/apiClient";
import type { Port, PortPayload } from "@/types/catalog";

const BASE = "api/catalogs/ports/";

export type FetchPortsParams = {
  page?: number;
  search?: string;
};

export async function fetchPorts(
  params: FetchPortsParams = {},
): Promise<ApiListResponse<Port>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.search?.trim()) query.set("search", params.search.trim());
  const qs = query.toString();
  return apiFetch<ApiListResponse<Port>>(`${BASE}${qs ? `?${qs}` : ""}`);
}

export async function fetchPort(id: number): Promise<Port> {
  return apiFetch<Port>(`${BASE}${id}/`);
}

export async function createPort(payload: PortPayload): Promise<Port> {
  return apiFetch<Port>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePort(id: number, payload: PortPayload): Promise<Port> {
  return apiFetch<Port>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePort(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
