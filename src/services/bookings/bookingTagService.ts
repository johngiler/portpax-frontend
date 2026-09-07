import { apiFetch } from "@/services/apiClient";

const BASE = "api/bookings/tags/";

export type BookingTagOption = {
  id: number;
  name: string;
  created_at?: string;
};

export async function fetchBookingTags(query = ""): Promise<BookingTagOption[]> {
  const sp = new URLSearchParams();
  if (query.trim()) sp.set("search", query.trim());
  const qs = sp.toString();
  return apiFetch<BookingTagOption[]>(`${BASE}${qs ? `?${qs}` : ""}`);
}

/** Autocomplete / suggest (same list endpoint with search). */
export async function suggestBookingTags(
  query = "",
  limit = 20,
): Promise<BookingTagOption[]> {
  const rows = await fetchBookingTags(query);
  return rows.slice(0, Math.max(1, Math.min(limit, 50)));
}

export async function createBookingTag(payload: {
  name: string;
}): Promise<BookingTagOption> {
  return apiFetch<BookingTagOption>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBookingTag(
  id: number,
  payload: { name: string },
): Promise<BookingTagOption> {
  return apiFetch<BookingTagOption>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteBookingTag(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}

export async function patchImportBatchTag(
  batchId: number,
  payload: { tag_name?: string; clear?: boolean },
): Promise<unknown> {
  return apiFetch(`api/bookings/import-batches/${batchId}/tag/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchRunBatchDetail(batchId: number) {
  return apiFetch(`api/bookings/run-batches/${batchId}/`);
}

export async function patchRunBatchTag(
  batchId: number,
  payload: { tag_name?: string; clear?: boolean },
): Promise<unknown> {
  return apiFetch(`api/bookings/run-batches/${batchId}/tag/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
