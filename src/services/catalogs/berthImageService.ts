import { apiFetch } from "@/services/apiClient";
import type { BerthImage } from "@/types/catalog";

const BASE = "api/catalogs/berth-images/";

export async function createBerthImage(
  berthId: number,
  file: File,
  options: { caption?: string; isCover?: boolean } = {},
): Promise<BerthImage> {
  const form = new FormData();
  form.append("berth", String(berthId));
  form.append("image", file);
  if (options.caption) form.append("caption", options.caption);
  form.append("is_cover", options.isCover ? "true" : "false");
  return apiFetch<BerthImage>(BASE, { method: "POST", body: form });
}

export async function deleteBerthImage(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
