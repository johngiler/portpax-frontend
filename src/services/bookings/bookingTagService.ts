import { apiFetch } from "@/services/apiClient";
import { BATCH_BOOKINGS_PAGE_SIZE } from "@/services/bookings/bookingActivityService";

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

function batchPageQuery(opts?: { page?: number; pageSize?: number }): string {
  const sp = new URLSearchParams();
  sp.set("page", String(opts?.page ?? 1));
  sp.set("page_size", String(opts?.pageSize ?? BATCH_BOOKINGS_PAGE_SIZE));
  return sp.toString();
}

export async function patchImportBatchTag(
  batchId: number,
  payload: { tag_name?: string; clear?: boolean },
  opts?: { page?: number; pageSize?: number },
): Promise<unknown> {
  const qs = batchPageQuery(opts);
  return apiFetch(`api/bookings/import-batches/${batchId}/tag/?${qs}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function patchRunBatchTag(
  batchId: number,
  payload: { tag_name?: string; clear?: boolean },
  opts?: { page?: number; pageSize?: number },
): Promise<unknown> {
  const qs = batchPageQuery(opts);
  return apiFetch(`api/bookings/run-batches/${batchId}/tag/?${qs}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
