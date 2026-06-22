import { apiFetch, type ApiListResponse } from "@/services/apiClient";
import type { Port, PortDetail, PortPayload } from "@/types/catalog";

const BASE = "api/catalogs/ports/";

export type FetchPortsParams = {
  page?: number;
  search?: string;
  pageSize?: number;
};

export type PortSaveOptions = {
  logoFile?: File | null;
  removeLogo?: boolean;
};

function appendFormValue(form: FormData, key: string, value: unknown) {
  if (value === null || value === undefined) {
    form.append(key, "");
    return;
  }
  if (typeof value === "boolean") {
    form.append(key, value ? "true" : "false");
    return;
  }
  form.append(key, String(value));
}

function buildPortFormData(payload: PortPayload, options?: PortSaveOptions): FormData {
  const form = new FormData();
  (Object.entries(payload) as [keyof PortPayload, PortPayload[keyof PortPayload]][]).forEach(
    ([key, value]) => appendFormValue(form, key, value),
  );
  if (options?.logoFile) {
    form.append("logo", options.logoFile);
  } else if (options?.removeLogo) {
    form.append("logo", "");
  }
  return form;
}

function usesMultipart(options?: PortSaveOptions): boolean {
  return Boolean(options?.logoFile || options?.removeLogo);
}

export async function fetchPorts(
  params: FetchPortsParams = {},
): Promise<ApiListResponse<Port>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.pageSize) query.set("page_size", String(params.pageSize));
  const qs = query.toString();
  return apiFetch<ApiListResponse<Port>>(`${BASE}${qs ? `?${qs}` : ""}`);
}

export async function fetchPort(id: number): Promise<Port> {
  return apiFetch<Port>(`${BASE}${id}/`);
}

export async function fetchPortDetail(id: number): Promise<PortDetail> {
  return apiFetch<PortDetail>(`${BASE}${id}/`);
}

export async function createPort(
  payload: PortPayload,
  options?: PortSaveOptions,
): Promise<Port> {
  if (usesMultipart(options)) {
    return apiFetch<Port>(BASE, {
      method: "POST",
      body: buildPortFormData(payload, options),
    });
  }
  return apiFetch<Port>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePort(
  id: number,
  payload: PortPayload,
  options?: PortSaveOptions,
): Promise<Port> {
  if (usesMultipart(options)) {
    return apiFetch<Port>(`${BASE}${id}/`, {
      method: "PATCH",
      body: buildPortFormData(payload, options),
    });
  }
  return apiFetch<Port>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePort(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
