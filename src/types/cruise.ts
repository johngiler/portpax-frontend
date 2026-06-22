export type ShippingLineGroup = {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ShippingLineGroupPayload = {
  code: string;
  name: string;
  is_active: boolean;
};

export type ShippingLine = {
  id: number;
  group: number;
  group_name: string;
  code: string;
  name: string;
  logo: string | null;
  is_active: boolean;
  vessel_count: number;
  created_at: string;
  updated_at: string;
};

export type ShippingLineDetail = ShippingLine & {
  vessels: Vessel[];
};

export type ShippingLinePayload = {
  group: number;
  code: string;
  name: string;
  is_active: boolean;
};

export type Vessel = {
  id: number;
  shipping_line: number;
  shipping_line_name: string;
  group_name: string;
  name: string;
  logo: string | null;
  vessel_class: string;
  gross_tonnage: string | null;
  pax_capacity: number | null;
  crew_capacity: number | null;
  total_persons: number | null;
  loa_m: string | null;
  beam_m: string | null;
  draft_m: string | null;
  flag: string;
  year_built: number | null;
  segment: string;
  size_category: string;
  mooring_line_count: number | null;
  bollard_count: number | null;
  bollard_swl_t: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VesselPayload = {
  shipping_line: number;
  name: string;
  vessel_class: string;
  gross_tonnage: number | null;
  pax_capacity: number | null;
  crew_capacity: number | null;
  loa_m: number | null;
  beam_m: number | null;
  draft_m: number | null;
  flag: string;
  year_built: number | null;
  segment: string;
  size_category: string;
  mooring_line_count: number | null;
  bollard_count: number | null;
  bollard_swl_t: number | null;
  is_active: boolean;
};

export function shippingLineDisplayName(line: ShippingLine): string {
  if (line.group_name && line.group_name !== line.name) {
    return `${line.name} (${line.group_name})`;
  }
  return line.name;
}

export function shippingLineDetailHref(line: Pick<ShippingLine, "code">): string {
  return `/shipping-lines/detail?code=${encodeURIComponent(line.code)}`;
}

export function shippingLineStatusLabel(isActive: boolean): string {
  return isActive ? "Activa" : "Inactiva";
}

export function vesselStatusLabel(isActive: boolean): string {
  return isActive ? "Activo" : "Inactivo";
}

export function vesselDisplayName(vessel: Vessel): string {
  return `${vessel.name} — ${vessel.shipping_line_name}`;
}
