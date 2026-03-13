/**
 * Tipos y cliente API para el módulo Docking/Muellaje.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function url(path: string) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export type DockingStats = {
  shipping_lines: number;
  ports: number;
  berths: number;
  ships: number;
  scales: number;
};

export type ShippingLine = { id: number; name: string; code: string; fee_tier: string };
export type Port = { id: number; name: string; code: string };
export type Berth = {
  id: number;
  port: number;
  port_name: string;
  name: string;
  capacity_pax: number | null;
  max_draft_m: string | null;
  max_length_m: string | null;
};
export type Ship = {
  id: number;
  shipping_line: number;
  shipping_line_name: string;
  name: string;
  code: string;
  imo: string;
  capacity_pax: number | null;
  length_m: string | null;
  draft_m: string | null;
};
export type Scale = {
  id: number;
  ship: number;
  ship_name: string;
  port: number;
  port_name: string;
  berth: number | null;
  berth_name: string | null;
  date: string;
  pax_count: number | null;
};

export type ListParams = { page?: number; page_size?: number };

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function listUrl(path: string, params?: ListParams): string {
  const full = url(path);
  if (!params?.page && params?.page_size == null) return full;
  const sep = full.includes("?") ? "&" : "?";
  const parts: string[] = [];
  if (params.page != null) parts.push(`page=${params.page}`);
  if (params.page_size != null) parts.push(`page_size=${params.page_size}`);
  return parts.length ? `${full}${sep}${parts.join("&")}` : full;
}

export async function getDockingStats(): Promise<DockingStats> {
  const res = await fetch(url("api/stats/"));
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function getShippingLines(
  params?: ListParams
): Promise<PaginatedResponse<ShippingLine>> {
  const res = await fetch(listUrl("api/shipping-lines/", params));
  if (!res.ok) throw new Error("Failed to fetch shipping lines");
  return res.json();
}

export async function getPorts(params?: ListParams): Promise<PaginatedResponse<Port>> {
  const res = await fetch(listUrl("api/ports/", params));
  if (!res.ok) throw new Error("Failed to fetch ports");
  return res.json();
}

export async function getBerths(params?: ListParams): Promise<PaginatedResponse<Berth>> {
  const res = await fetch(listUrl("api/berths/", params));
  if (!res.ok) throw new Error("Failed to fetch berths");
  return res.json();
}

export async function getShips(params?: ListParams): Promise<PaginatedResponse<Ship>> {
  const res = await fetch(listUrl("api/ships/", params));
  if (!res.ok) throw new Error("Failed to fetch ships");
  return res.json();
}

export async function getScales(params?: ListParams): Promise<PaginatedResponse<Scale>> {
  const res = await fetch(listUrl("api/scales/", params));
  if (!res.ok) throw new Error("Failed to fetch scales");
  return res.json();
}

/** Tarifa portuaria por pasajero (puerto + fee_tier: RCL, NCL, MSC, CCL, VV, Others) */
export type PortFeeRule = {
  id: number;
  port: number;
  port_name: string;
  fee_tier: string;
  amount_per_pax_usd: string;
  minimum_charge_usd: string | null;
  valid_from: string | null;
  valid_to: string | null;
  notes: string;
};

export async function getPortFeeRules(
  params?: ListParams
): Promise<PaginatedResponse<PortFeeRule>> {
  const res = await fetch(listUrl("api/port-fee-rules/", params));
  if (!res.ok) throw new Error("Failed to fetch port fee rules");
  return res.json();
}

/** Métricas por mes para gráficas */
export type ScalesByMonth = {
  year: number;
  month: number;
  month_label: string;
  scales: number;
  pax_total: number;
};

/** Métricas por año para gráficas */
export type ScalesByYear = {
  year: number;
  scales: number;
  pax_total: number;
};

export async function getScalesByMonth(): Promise<ScalesByMonth[]> {
  const res = await fetch(url("api/metrics/scales-by-month/"));
  if (!res.ok) throw new Error("Failed to fetch scales by month");
  return res.json();
}

export async function getScalesByYear(): Promise<ScalesByYear[]> {
  const res = await fetch(url("api/metrics/scales-by-year/"));
  if (!res.ok) throw new Error("Failed to fetch scales by year");
  return res.json();
}

// ——— CRUD: Navieras ———
export type ShippingLinePayload = { name: string; code?: string };

export async function createShippingLine(payload: ShippingLinePayload): Promise<ShippingLine> {
  const res = await fetch(url("api/shipping-lines/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err === "object" && err && "detail" in err ? String(err.detail) : "Error al crear naviera");
  }
  return res.json();
}

export async function updateShippingLine(id: number, payload: Partial<ShippingLinePayload>): Promise<ShippingLine> {
  const res = await fetch(url(`api/shipping-lines/${id}/`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al actualizar naviera");
  return res.json();
}

export async function deleteShippingLine(id: number): Promise<void> {
  const res = await fetch(url(`api/shipping-lines/${id}/`), { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar naviera");
}

// ——— CRUD: Puertos ———
export type PortPayload = { name: string; code?: string };

export async function createPort(payload: PortPayload): Promise<Port> {
  const res = await fetch(url("api/ports/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err === "object" && err && "detail" in err ? String(err.detail) : "Error al crear puerto");
  }
  return res.json();
}

export async function updatePort(id: number, payload: Partial<PortPayload>): Promise<Port> {
  const res = await fetch(url(`api/ports/${id}/`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al actualizar puerto");
  return res.json();
}

export async function deletePort(id: number): Promise<void> {
  const res = await fetch(url(`api/ports/${id}/`), { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar puerto");
}

// ——— CRUD: Muelles ———
export type BerthPayload = {
  port: number;
  name: string;
  capacity_pax?: number | null;
  max_draft_m?: number | string | null;
  max_length_m?: number | string | null;
};

export async function createBerth(payload: BerthPayload): Promise<Berth> {
  const res = await fetch(url("api/berths/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err === "object" && err && "detail" in err ? String(err.detail) : "Error al crear muelle");
  }
  return res.json();
}

export async function updateBerth(id: number, payload: Partial<BerthPayload>): Promise<Berth> {
  const res = await fetch(url(`api/berths/${id}/`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al actualizar muelle");
  return res.json();
}

export async function deleteBerth(id: number): Promise<void> {
  const res = await fetch(url(`api/berths/${id}/`), { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar muelle");
}

// ——— CRUD: Barcos ———
export type ShipPayload = {
  shipping_line: number;
  name: string;
  imo?: string;
  capacity_pax?: number | null;
  length_m?: number | string | null;
  draft_m?: number | string | null;
};

export async function createShip(payload: ShipPayload): Promise<Ship> {
  const res = await fetch(url("api/ships/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err === "object" && err && "detail" in err ? String(err.detail) : "Error al crear barco");
  }
  return res.json();
}

export async function updateShip(id: number, payload: Partial<ShipPayload>): Promise<Ship> {
  const res = await fetch(url(`api/ships/${id}/`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al actualizar barco");
  return res.json();
}

export async function deleteShip(id: number): Promise<void> {
  const res = await fetch(url(`api/ships/${id}/`), { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar barco");
}
