import { apiFetch } from "@/services/apiClient";

const BASE = "api/bookings/";

export type BookingTagOption = {
  id: number;
  name: string;
};

export async function suggestBookingTags(
  query = "",
  limit = 20,
): Promise<BookingTagOption[]> {
  const sp = new URLSearchParams();
  if (query.trim()) sp.set("q", query.trim());
  if (limit) sp.set("limit", String(limit));
  const qs = sp.toString();
  const data = await apiFetch<{ results: BookingTagOption[] }>(
    `${BASE}tags/${qs ? `?${qs}` : ""}`,
  );
  return data.results ?? [];
}

export async function patchImportBatchTag(
  batchId: number,
  payload: { tag_name?: string; clear?: boolean },
): Promise<unknown> {
  return apiFetch(`${BASE}import-batches/${batchId}/tag/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchRunBatchDetail(batchId: number) {
  return apiFetch(`${BASE}run-batches/${batchId}/`);
}

export async function patchRunBatchTag(
  batchId: number,
  payload: { tag_name?: string; clear?: boolean },
): Promise<unknown> {
  return apiFetch(`${BASE}run-batches/${batchId}/tag/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
