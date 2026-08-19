import { apiFetch } from "@/services/apiClient";

const BASE = "api/catalogs/port-proximities/";

export type PortProximity = {
  from_port: number;
  from_port_name: string;
  to_port: number;
  to_port_name: string;
  distance_km: string;
  travel_hours_min: string;
  speed_knots_used: string;
};

export type FetchPortProximitiesParams = {
  from_port?: number;
  to_port?: number;
  within_hours?: number;
  within_days?: number;
};

export async function fetchPortProximities(
  params: FetchPortProximitiesParams,
): Promise<PortProximity[]> {
  const query = new URLSearchParams();
  if (params.from_port) query.set("from_port", String(params.from_port));
  if (params.to_port) query.set("to_port", String(params.to_port));
  if (params.within_hours != null) query.set("within_hours", String(params.within_hours));
  if (params.within_days != null) query.set("within_days", String(params.within_days));

  const qs = query.toString();
  // Backend desactiva paginación: retornará un array.
  const data = await apiFetch<PortProximity[]>(
    `${BASE}${qs ? `?${qs}` : ""}`,
  );
  return data;
}

