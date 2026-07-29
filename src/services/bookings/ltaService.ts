import { apiFetch, type ApiListResponse } from "@/services/apiClient";
import type {
  LongTermAgreement,
  LongTermAgreementPayload,
  LongTermAgreementSaveOptions,
} from "@/types/lta";

const BASE = "api/bookings/long-term-agreements/";

export type FetchLtaParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  port?: number;
  shipping_line?: number;
  is_active?: boolean;
};

function appendScalar(form: FormData, key: string, value: unknown) {
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

function buildLtaFormData(
  payload: LongTermAgreementPayload | Partial<LongTermAgreementPayload>,
  options?: LongTermAgreementSaveOptions,
): FormData {
  const form = new FormData();
  const data = payload as LongTermAgreementPayload;

  if (data.code != null) appendScalar(form, "code", data.code);
  if (data.name != null) appendScalar(form, "name", data.name);
  if (data.port != null) appendScalar(form, "port", data.port);
  if (data.shipping_line != null) appendScalar(form, "shipping_line", data.shipping_line);
  if (data.all_vessels != null) appendScalar(form, "all_vessels", data.all_vessels);
  if (data.min_packs != null) appendScalar(form, "min_packs", data.min_packs);
  else if ("min_packs" in data) form.append("min_packs", "");
  if (data.advance_months_min != null) {
    appendScalar(form, "advance_months_min", data.advance_months_min);
  }
  if (data.advance_months_max != null) {
    appendScalar(form, "advance_months_max", data.advance_months_max);
  }
  if ("valid_from" in data) appendScalar(form, "valid_from", data.valid_from);
  if ("valid_until" in data) appendScalar(form, "valid_until", data.valid_until);
  if (data.is_active != null) appendScalar(form, "is_active", data.is_active);
  if (data.notes != null) appendScalar(form, "notes", data.notes);

  form.append("weekdays", JSON.stringify(data.weekdays ?? []));
  form.append("vessel_ids", JSON.stringify(data.vessel_ids ?? []));
  form.append("position_ids", JSON.stringify(data.position_ids ?? []));

  if (options?.contractFile) {
    form.append("contract_file", options.contractFile);
  } else if (options?.removeContract) {
    form.append("contract_file", "");
  }

  return form;
}

function usesMultipart(options?: LongTermAgreementSaveOptions): boolean {
  return Boolean(options?.contractFile || options?.removeContract);
}

export async function fetchLongTermAgreements(
  params: FetchLtaParams = {},
): Promise<ApiListResponse<LongTermAgreement>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("page_size", String(params.pageSize));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.port) query.set("port", String(params.port));
  if (params.shipping_line) query.set("shipping_line", String(params.shipping_line));
  if (params.is_active != null) query.set("is_active", String(params.is_active));
  const qs = query.toString();
  return apiFetch<ApiListResponse<LongTermAgreement>>(`${BASE}${qs ? `?${qs}` : ""}`);
}

export async function createLongTermAgreement(
  payload: LongTermAgreementPayload,
  options?: LongTermAgreementSaveOptions,
): Promise<LongTermAgreement> {
  if (usesMultipart(options)) {
    return apiFetch<LongTermAgreement>(BASE, {
      method: "POST",
      body: buildLtaFormData(payload, options),
    });
  }
  return apiFetch<LongTermAgreement>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateLongTermAgreement(
  id: number,
  payload: Partial<LongTermAgreementPayload>,
  options?: LongTermAgreementSaveOptions,
): Promise<LongTermAgreement> {
  if (usesMultipart(options)) {
    return apiFetch<LongTermAgreement>(`${BASE}${id}/`, {
      method: "PATCH",
      body: buildLtaFormData(payload as LongTermAgreementPayload, options),
    });
  }
  return apiFetch<LongTermAgreement>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteLongTermAgreement(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}

export type LinkLtaBookingsResult = {
  linked: number;
  skipped: number;
  agreement_code?: string;
  detail?: string;
};

export async function linkLongTermAgreementBookings(
  id: number,
): Promise<LinkLtaBookingsResult> {
  return apiFetch<LinkLtaBookingsResult>(`${BASE}${id}/link-bookings/`, {
    method: "POST",
  });
}
