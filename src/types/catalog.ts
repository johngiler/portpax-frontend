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
  fender_count: number | null;
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
  fender_count: number | null;
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

export function portDisplayName(port: Pick<Port, "name" | "commercial_name">): string {
  if (port.commercial_name) {
    return `${port.name} (${port.commercial_name})`;
  }
  return port.name;
}

export type BollardType =
  | "standard"
  | "t_head"
  | "quick_release"
  | "single_bitt"
  | "other";

export type PortBollard = {
  id: number;
  port: number;
  capacity_t: number;
  bollard_type: BollardType;
  bollard_type_display: string;
  quantity: number;
  label: string;
  sort_order: number;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PortBollardPayload = {
  port: number;
  capacity_t: number;
  bollard_type: BollardType;
  quantity: number;
  label: string;
  sort_order: number;
  notes: string;
  is_active: boolean;
};

export const BOLLARD_TYPE_OPTIONS: { value: BollardType; label: string }[] = [
  { value: "standard", label: "Estándar" },
  { value: "t_head", label: "T-head" },
  { value: "quick_release", label: "Quick release" },
  { value: "single_bitt", label: "Single bitt" },
  { value: "other", label: "Otro" },
];

export function bollardTypeLabel(type: BollardType): string {
  return BOLLARD_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export type PortFender = {
  id: number;
  port: number;
  fender_type: string;
  quantity: number;
  sort_order: number;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PortFenderPayload = {
  port: number;
  fender_type: string;
  quantity: number;
  sort_order: number;
  notes: string;
  is_active: boolean;
};

export const DEFAULT_FENDER_TYPE_OPTIONS = [
  "Estándar",
  "Celular",
  "Cono",
  "D",
  "Arch",
];

export type PortImage = {
  id: number;
  port: number;
  image: string;
  caption: string;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
};

export type PositionImage = {
  id: number;
  position: number;
  image: string;
  caption: string;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
};

export type PositionDetail = Position & {
  images: PositionImage[];
  cover_image: string | null;
};

export type PortDetail = Port & {
  bollard_total: number;
  fender_total: number;
  berths: BerthDetail[];
  positions: PositionDetail[];
  bollards: PortBollard[];
  fenders: PortFender[];
  images: PortImage[];
};

export function formatCoord(value: string | null): string {
  if (value == null || value === "") return "—";
  return value;
}

export function formatMeters(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return `${value} m`;
}

export function formatLargestVessel(
  port: Pick<Port, "largest_vessel_recorded" | "largest_vessel_loa_m">,
): string | null {
  if (port.largest_vessel_recorded && port.largest_vessel_loa_m) {
    return `${port.largest_vessel_recorded} · ${port.largest_vessel_loa_m} m LOA`;
  }
  if (port.largest_vessel_recorded) return port.largest_vessel_recorded;
  return null;
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
  latitude: string | null;
  longitude: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BerthImage = {
  id: number;
  berth: number;
  image: string;
  caption: string;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
};

export type BerthDetail = Berth & {
  images: BerthImage[];
  cover_image: string | null;
};

export type BerthPayload = {
  port: number;
  code: string;
  name: string;
  length_m: number | null;
  width_m: number | null;
  walkway_length_m: number | null;
  walkway_width_m: number | null;
  min_draft_m: number | null;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  sort_order: number;
  is_active: boolean;
};

export type PositionComponentRef = {
  id: number;
  code: string;
};

export type Position = {
  id: number;
  port: number;
  port_name: string;
  port_code: string;
  short_code: string;
  berth: number | null;
  berth_code: string | null;
  code: string;
  position_type: PositionType;
  max_loa_m: string | null;
  min_draft_m: string | null;
  port_bollard_ids: number[];
  port_fender_ids: number[];
  bollard_count: number | null;
  fender_count: number | null;
  effective_from: string | null;
  effective_until: string | null;
  notes: string;
  latitude: string | null;
  longitude: string | null;
  sort_order: number;
  is_active: boolean;
  is_combined: boolean;
  component_positions: PositionComponentRef[];
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
  port_bollard_ids: number[];
  port_fender_ids: number[];
  bollard_count: number | null;
  fender_count: number | null;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  sort_order: number;
  is_active: boolean;
  component_position_ids?: number[] | null;
};

export const POSITION_TYPE_OPTIONS: { value: PositionType; label: string }[] = [
  { value: "pier", label: "Muelle" },
  { value: "anchorage", label: "Fondeo" },
];

export function positionTypeLabel(type: PositionType): string {
  return POSITION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}
