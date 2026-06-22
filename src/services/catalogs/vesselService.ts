import { apiFetch, type ApiListResponse } from "@/services/apiClient";
import {
  appendCatalogFormValue,
  appendCatalogLogoFields,
  type CatalogLogoSaveOptions,
  usesCatalogLogoMultipart,
} from "@/lib/catalogMultipart";
import type { Vessel, VesselPayload } from "@/types/cruise";

const BASE = "api/catalogs/vessels/";

export type FetchVesselsParams = {
  page?: number;
  search?: string;
  shipping_line?: number;
  pageSize?: number;
};

export type VesselSaveOptions = CatalogLogoSaveOptions;

function buildVesselFormData(payload: VesselPayload, options?: VesselSaveOptions): FormData {
  const form = new FormData();
  (Object.entries(payload) as [keyof VesselPayload, VesselPayload[keyof VesselPayload]][]).forEach(
    ([key, value]) => appendCatalogFormValue(form, key, value),
  );
  appendCatalogLogoFields(form, options);
  return form;
}

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

export async function createVessel(
  payload: VesselPayload,
  options?: VesselSaveOptions,
): Promise<Vessel> {
  if (usesCatalogLogoMultipart(options)) {
    return apiFetch<Vessel>(BASE, {
      method: "POST",
      body: buildVesselFormData(payload, options),
    });
  }
  return apiFetch<Vessel>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVessel(
  id: number,
  payload: VesselPayload,
  options?: VesselSaveOptions,
): Promise<Vessel> {
  if (usesCatalogLogoMultipart(options)) {
    return apiFetch<Vessel>(`${BASE}${id}/`, {
      method: "PATCH",
      body: buildVesselFormData(payload, options),
    });
  }
  return apiFetch<Vessel>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteVessel(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
