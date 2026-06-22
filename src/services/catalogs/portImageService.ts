import { apiFetch } from "@/services/apiClient";
import type { PortImage } from "@/types/catalog";

const BASE = "api/catalogs/port-images/";

export async function createPortImage(
  portId: number,
  file: File,
  options: { caption?: string; isCover?: boolean } = {},
): Promise<PortImage> {
  const form = new FormData();
  form.append("port", String(portId));
  form.append("image", file);
  if (options.caption) form.append("caption", options.caption);
  form.append("is_cover", options.isCover ? "true" : "false");
  return apiFetch<PortImage>(BASE, { method: "POST", body: form });
}

export async function deletePortImage(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
