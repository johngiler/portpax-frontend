import { apiFetch } from "@/services/apiClient";
import type { ConflictTypeFilterValue } from "@/lib/bookingConflictLabels";
import type {
  BookingConflictHighlights,
  BookingConflictChip,
  BookingStatusFilterValue,
} from "@/types/booking";
import { serializeBookingStatusFilters } from "@/types/booking";

const BASE = "api/bookings/vessel-proximity-matrix/";

export type VesselProximityMatrixIssue = {
  severity: string;
  code: "multi_port_conflict" | "multi_port_proximity" | string;
  message: string;
};

export type VesselProximityMatrixCellStatus = "ok" | "same_day" | "proximity";

export type VesselProximityMatrixCell = {
  date: string;
  port_id: number;
  booking_id: number;
  booking_code: string;
  status: string;
  port_name: string;
  vessel_name: string;
  vessel_logo: string | null;
  shipping_line_name: string;
  loa_m: string | null;
  eta: string | null;
  etd: string | null;
  position_code: string | null;
  conflict_chips: BookingConflictChip[];
  conflict_highlights: BookingConflictHighlights;
  cell_status: VesselProximityMatrixCellStatus;
  issues: VesselProximityMatrixIssue[];
};

export type VesselProximityMatrixPort = {
  id: number;
  name: string;
  code: string;
};

export type VesselProximityMatrixResponse = {
  vessel_id: number;
  vessel_name: string;
  shipping_line_id: number | null;
  shipping_line_name: string;
  date_from: string;
  date_to: string;
  dates: string[];
  ports: VesselProximityMatrixPort[];
  cells: VesselProximityMatrixCell[];
  /** Days with at least one call (paginated mode). */
  matched_days?: number;
  page?: number;
  page_size?: number;
  has_more?: boolean;
};

export type FetchVesselProximityMatrixParams = {
  vessel: number;
  call_date_from?: string;
  call_date_to?: string;
  port?: number;
  statuses?: BookingStatusFilterValue[];
  has_conflict?: boolean;
  conflict_severity?: "yellow" | "red" | "green";
  conflict_type?: ConflictTypeFilterValue;
  /** Discrete ISO dates (imported list). */
  call_dates?: string[];
  page?: number;
  page_size?: number;
};

export async function fetchVesselProximityMatrix(
  params: FetchVesselProximityMatrixParams,
): Promise<VesselProximityMatrixResponse> {
  const query = new URLSearchParams();
  query.set("vessel", String(params.vessel));
  if (params.call_date_from) query.set("call_date_from", params.call_date_from);
  if (params.call_date_to) query.set("call_date_to", params.call_date_to);
  if (params.port) query.set("port", String(params.port));
  const statusCsv =
    params.statuses && params.statuses.length > 0
      ? serializeBookingStatusFilters(params.statuses)
      : "";
  if (statusCsv) query.set("status", statusCsv);
  if (params.has_conflict === true) query.set("has_conflict", "true");
  if (params.has_conflict === false) query.set("has_conflict", "false");
  if (params.conflict_severity) {
    query.set("conflict_severity", params.conflict_severity);
  }
  if (params.conflict_type) {
    query.set("conflict_type", params.conflict_type);
  }
  if (params.call_dates && params.call_dates.length > 0) {
    query.set("call_dates", params.call_dates.join(","));
  }
  if (params.page != null && params.page >= 1) {
    query.set("page", String(params.page));
  }
  if (params.page_size != null && params.page_size >= 1) {
    query.set("page_size", String(params.page_size));
  }
  return apiFetch<VesselProximityMatrixResponse>(`${BASE}?${query.toString()}`);
}
