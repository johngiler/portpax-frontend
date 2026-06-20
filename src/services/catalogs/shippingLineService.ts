import { apiFetch, type ApiListResponse } from "@/services/apiClient";
import type { ShippingLine, ShippingLinePayload } from "@/types/cruise";

const BASE = "api/catalogs/shipping-lines/";

export type FetchShippingLinesParams = {
  page?: number;
  search?: string;
  pageSize?: number;
};

export async function fetchShippingLines(
  params: FetchShippingLinesParams = {},
): Promise<ApiListResponse<ShippingLine>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.pageSize) query.set("page_size", String(params.pageSize));
  const qs = query.toString();
  return apiFetch<ApiListResponse<ShippingLine>>(`${BASE}${qs ? `?${qs}` : ""}`);
}

export async function createShippingLine(payload: ShippingLinePayload): Promise<ShippingLine> {
  return apiFetch<ShippingLine>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateShippingLine(
  id: number,
  payload: ShippingLinePayload,
): Promise<ShippingLine> {
  return apiFetch<ShippingLine>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteShippingLine(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
