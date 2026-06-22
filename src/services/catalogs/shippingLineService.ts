import { apiFetch, type ApiListResponse } from "@/services/apiClient";
import {
  appendCatalogFormValue,
  appendCatalogLogoFields,
  type CatalogLogoSaveOptions,
  usesCatalogLogoMultipart,
} from "@/lib/catalogMultipart";
import type { ShippingLine, ShippingLineDetail, ShippingLinePayload } from "@/types/cruise";

const BASE = "api/catalogs/shipping-lines/";

export type FetchShippingLinesParams = {
  page?: number;
  search?: string;
  group?: number;
  pageSize?: number;
};

export type ShippingLineSaveOptions = CatalogLogoSaveOptions;

function buildShippingLineFormData(
  payload: ShippingLinePayload,
  options?: ShippingLineSaveOptions,
): FormData {
  const form = new FormData();
  (Object.entries(payload) as [keyof ShippingLinePayload, ShippingLinePayload[keyof ShippingLinePayload]][]).forEach(
    ([key, value]) => appendCatalogFormValue(form, key, value),
  );
  appendCatalogLogoFields(form, options);
  return form;
}

export async function fetchShippingLines(
  params: FetchShippingLinesParams = {},
): Promise<ApiListResponse<ShippingLine>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.group) query.set("group", String(params.group));
  if (params.pageSize) query.set("page_size", String(params.pageSize));
  const qs = query.toString();
  return apiFetch<ApiListResponse<ShippingLine>>(`${BASE}${qs ? `?${qs}` : ""}`);
}

export async function fetchShippingLine(id: number): Promise<ShippingLineDetail> {
  return apiFetch<ShippingLineDetail>(`${BASE}${id}/`);
}

export async function fetchShippingLineByCode(code: string): Promise<ShippingLineDetail> {
  const trimmed = code.trim();
  const data = await fetchShippingLines({ search: trimmed, pageSize: 50 });
  const match =
    data.results.find((line) => line.code === trimmed) ??
    data.results.find((line) => line.code.includes(trimmed));
  if (!match) {
    throw new Error("Naviera no encontrada.");
  }
  return fetchShippingLine(match.id);
}

export async function createShippingLine(
  payload: ShippingLinePayload,
  options?: ShippingLineSaveOptions,
): Promise<ShippingLine> {
  if (usesCatalogLogoMultipart(options)) {
    return apiFetch<ShippingLine>(BASE, {
      method: "POST",
      body: buildShippingLineFormData(payload, options),
    });
  }
  return apiFetch<ShippingLine>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateShippingLine(
  id: number,
  payload: ShippingLinePayload,
  options?: ShippingLineSaveOptions,
): Promise<ShippingLine> {
  if (usesCatalogLogoMultipart(options)) {
    return apiFetch<ShippingLine>(`${BASE}${id}/`, {
      method: "PATCH",
      body: buildShippingLineFormData(payload, options),
    });
  }
  return apiFetch<ShippingLine>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteShippingLine(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
