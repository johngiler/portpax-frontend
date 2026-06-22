export type PortOperationalStatus =
  | "operational"
  | "in_development"
  | "planned_extension";

export type Port = {
  id: number;
  code: string;
  name: string;
  commercial_name: string;
  country: string;
  region: string;
  latitude: string | null;
  longitude: string | null;
  status: PortOperationalStatus;
  min_berth_draft_m: string | null;
  anchorage_slot_count: number;
  largest_vessel_recorded: string;
  largest_vessel_loa_m: string | null;
  notes: string;
  logo: string | null;
  is_active: boolean;
  position_count: number;
  position_codes: string[];
  created_at: string;
  updated_at: string;
};

export type PortPayload = {
  code: string;
  name: string;
  commercial_name: string;
  country: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  status: PortOperationalStatus;
  min_berth_draft_m: number | null;
  anchorage_slot_count: number;
  largest_vessel_recorded: string;
  largest_vessel_loa_m: number | null;
  notes: string;
  is_active: boolean;
};

export const PORT_STATUS_OPTIONS: { value: PortOperationalStatus; label: string }[] = [
  { value: "operational", label: "Operativo" },
  { value: "in_development", label: "En desarrollo" },
  { value: "planned_extension", label: "Ampliación proyectada" },
];

export function portStatusLabel(status: PortOperationalStatus): string {
  return PORT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function portDisplayName(port: Port): string {
  if (port.commercial_name) {
    return `${port.name} (${port.commercial_name})`;
  }
  return port.name;
}

export type PositionType = "pier" | "anchorage";

export type Berth = {
  id: number;
  port: number;
  code: string;
  name: string;
  length_m: string | null;
  width_m: string | null;
  walkway_length_m: string | null;
  walkway_width_m: string | null;
  min_draft_m: string | null;
  notes: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Position = {
  id: number;
  port: number;
  port_name: string;
  port_code: string;
  berth: number | null;
  berth_code: string | null;
  code: string;
  position_type: PositionType;
  max_loa_m: string | null;
  min_draft_m: string | null;
  bollard_count: number | null;
  fender_count: number | null;
  out_of_service: boolean;
  effective_from: string | null;
  effective_until: string | null;
  is_projection: boolean;
  notes: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PositionPayload = {
  port: number;
  berth: number | null;
  code: string;
  position_type: PositionType;
  max_loa_m: number | null;
  min_draft_m: number | null;
  bollard_count: number | null;
  fender_count: number | null;
  out_of_service: boolean;
  is_projection: boolean;
  notes: string;
  sort_order: number;
  is_active: boolean;
};

export const POSITION_TYPE_OPTIONS: { value: PositionType; label: string }[] = [
  { value: "pier", label: "Muelle" },
  { value: "anchorage", label: "Fondeo" },
];

export function positionTypeLabel(type: PositionType): string {
  return POSITION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}
