import { apiFetch } from "@/services/apiClient";
import type { PositionImage } from "@/types/catalog";

const BASE = "api/catalogs/position-images/";

export async function createPositionImage(
  positionId: number,
  file: File,
  options: { caption?: string; isCover?: boolean } = {},
): Promise<PositionImage> {
  const form = new FormData();
  form.append("position", String(positionId));
  form.append("image", file);
  if (options.caption) form.append("caption", options.caption);
  form.append("is_cover", options.isCover ? "true" : "false");
  return apiFetch<PositionImage>(BASE, { method: "POST", body: form });
}

export async function deletePositionImage(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
