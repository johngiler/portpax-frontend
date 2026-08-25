import {
  apiDownload,
  apiFetch,
  triggerBrowserDownload,
} from "@/services/apiClient";

const BASE = "api/catalogs/shipping-lines/";

export type ShippingLineImportEntityKind = "shipping_line" | "vessel";

export type ShippingLineImportItem = {
  kind: ShippingLineImportEntityKind;
  row: number;
  id: number | null;
  code: string;
  name: string;
  label: string;
  shipping_line_id?: number;
  errors?: string[];
};

export type ShippingLineImportBucket = {
  updated_count: number;
  created_count: number;
  invalid_count: number;
  created: ShippingLineImportItem[];
  invalid: ShippingLineImportItem[];
  updated: ShippingLineImportItem[];
};

export type ShippingLineImportResult = {
  updated_count: number;
  created_count: number;
  invalid_count: number;
  shipping_lines: ShippingLineImportBucket;
  vessels: ShippingLineImportBucket;
  created: ShippingLineImportItem[];
  invalid: ShippingLineImportItem[];
};

export async function exportShippingLinesCatalog(params: {
  search?: string;
  group?: number;
  exportFormat: "xlsx" | "csv";
}): Promise<void> {
  const query = new URLSearchParams();
  query.set("export_format", params.exportFormat);
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.group) query.set("group", String(params.group));
  const { blob, filename } = await apiDownload(
    `${BASE}export/?${query.toString()}`,
  );
  const fallback =
    params.exportFormat === "csv"
      ? "navieras_barcos.zip"
      : "navieras_barcos.xlsx";
  triggerBrowserDownload(blob, filename || fallback);
}

export async function importShippingLinesCatalog(
  file: File,
): Promise<ShippingLineImportResult> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<ShippingLineImportResult>(`${BASE}import/`, {
    method: "POST",
    body: form,
  });
}
