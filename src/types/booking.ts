import { toIsoDate } from "@/lib/bookingDates";

/** Status codes aligned with berthing docs (NR/H/CO/CL/LTA/LTD/R/C). */
export type BookingStatus = "nr" | "h" | "co" | "cl" | "lta" | "ltd" | "r" | "c";

export type CancellationReason =
  | "bad_weather"
  | "shipping_line_decision"
  | "itm_decision";

/** List filter: past open bookings (not a stored status) or real status. */
export type BookingListStatusFilter =
  | BookingStatus
  | ""
  | "completed"
  | "action";

export type BookingBadgeStatus = BookingStatus;

export type BookingAuditEntry = {
  id: number;
  action: string;
  summary: string;
  changes: Record<string, unknown>;
  user_display: string | null;
  created_at: string;
};

export type Booking = {
  id: number;
  booking_code: string;
  port: number;
  port_code: string;
  port_name: string;
  port_logo: string | null;
  shipping_line: number;
  shipping_line_code: string;
  shipping_line_name: string;
  shipping_line_logo: string | null;
  vessel: number;
  vessel_name: string;
  vessel_logo: string | null;
  vessel_loa_m: string | null;
  position: number | null;
  position_code: string | null;
  call_date: string;
  eta: string | null;
  etd: string | null;
  eta_real: string | null;
  etd_real: string | null;
  planned_pax: number | null;
  actual_pax: number | null;
  actual_crew: number | null;
  status: BookingStatus;
  status_display: string;
  notes: string;
  cancellation_reason: CancellationReason | "";
  cancellation_reason_display: string;
  cancellation_evidence_url: string | null;
  confirmation_pdf_url: string | null;
  audit_entries: BookingAuditEntry[];
  created_at: string;
  updated_at: string;
};

export type BookingValidationIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
};

export type BookingValidationResult = {
  valid: boolean;
  errors: BookingValidationIssue[];
  warnings: BookingValidationIssue[];
  by_date: Record<
    string,
    { valid: boolean; errors: BookingValidationIssue[]; warnings: BookingValidationIssue[] }
  >;
};

export type PositionSuggestion = {
  id: number;
  code: string;
  position_type: string;
  max_loa_m: string | null;
  occupied: boolean;
  recommended?: boolean;
  warnings: BookingValidationIssue[];
};

export type BookingBatchPayload = {
  port: number;
  shipping_line: number;
  vessel: number;
  call_dates: string[];
  notes?: string;
  eta?: string | null;
  etd?: string | null;
  planned_pax?: number | null;
  /** Preferred pier from availability matrix; falls back to auto-assign. */
  position?: number | null;
};

export type BookingUpdatePayload = {
  status?: BookingStatus;
  position?: number | null;
  eta?: string | null;
  etd?: string | null;
  eta_real?: string | null;
  etd_real?: string | null;
  planned_pax?: number | null;
  actual_pax?: number | null;
  actual_crew?: number | null;
  cancellation_reason?: CancellationReason | null;
  cancellation_evidence?: File | null;
  port_operator_override?: boolean;
  acknowledge_combined_red?: boolean;
  override_reason?: string;
};

export const CANCELLATION_REASON_OPTIONS: {
  value: CancellationReason;
  label: string;
}[] = [
  { value: "bad_weather", label: "Mal tiempo" },
  { value: "shipping_line_decision", label: "Decisión naviera" },
  { value: "itm_decision", label: "Decisión ITM" },
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  nr: "Solicitada",
  h: "En evaluación",
  co: "Confirmada",
  cl: "Confirmada LTA",
  lta: "LTA",
  ltd: "Long Term Deployment",
  r: "Real",
  c: "Cancelada",
};

/**
 * Spanish UI — status meaning from SISTEMA_BERTHING (§6.1) + PORT_PAX_FUNCIONALIDADES /
 * SPEC_DESARROLLADOR (pista general vs LTA). Wording adapted for the guide, not verbatim.
 */
export const BOOKING_STATUS_DESCRIPTIONS: Record<BookingStatus, string> = {
  nr: "Solicitud recibida de la naviera, aún sin evaluar (New Request).",
  h: "En evaluación o en espera (Hold). Pista general (navieras sin LTA); paso opcional si se confirma de inmediato.",
  co: "Confirmado en pista general. Puede reordenarse o moverse si es necesario; también puede cancelarse.",
  cl: "Confirmado bajo LTA — inamovible: no puede desplazarse por otro booking sin autorización de port-operator.",
  lta: "Slot reservado por contrato LTA, pendiente de confirmación formal (no pasa por Hold).",
  ltd: "Despliegue a largo plazo (variante LTA del histórico operativo).",
  r: "Real / completado: el barco atracó; registro cerrado con datos reales de la operación.",
  c: "Cancelado. Puede salir de estados no finales; en LTA/CL puede implicar penalidad según contrato.",
};

export type BookingStatusGuideRow = {
  code: string;
  value: BookingStatus;
  label: string;
  description: string;
};

/** Core statuses in operational order for the guide table. */
export const BOOKING_STATUS_GUIDE: BookingStatusGuideRow[] = [
  { code: "NR", value: "nr", label: BOOKING_STATUS_LABELS.nr, description: BOOKING_STATUS_DESCRIPTIONS.nr },
  { code: "H", value: "h", label: BOOKING_STATUS_LABELS.h, description: BOOKING_STATUS_DESCRIPTIONS.h },
  { code: "CO", value: "co", label: BOOKING_STATUS_LABELS.co, description: BOOKING_STATUS_DESCRIPTIONS.co },
  { code: "CL", value: "cl", label: BOOKING_STATUS_LABELS.cl, description: BOOKING_STATUS_DESCRIPTIONS.cl },
  { code: "LTA", value: "lta", label: BOOKING_STATUS_LABELS.lta, description: BOOKING_STATUS_DESCRIPTIONS.lta },
  { code: "LTD", value: "ltd", label: BOOKING_STATUS_LABELS.ltd, description: BOOKING_STATUS_DESCRIPTIONS.ltd },
  { code: "R", value: "r", label: BOOKING_STATUS_LABELS.r, description: BOOKING_STATUS_DESCRIPTIONS.r },
  { code: "C", value: "c", label: BOOKING_STATUS_LABELS.c, description: BOOKING_STATUS_DESCRIPTIONS.c },
];

/** Extra list-filter buckets (not booking.status values). */
export const BOOKING_STATUS_FILTER_GUIDE: {
  code: string;
  label: string;
  description: string;
}[] = [
  {
    code: "—",
    label: "Requieren acción",
    description:
      "Filtro de lista: solicitudes (NR) y en evaluación (H) con fecha de escala desde hoy.",
  },
  {
    code: "—",
    label: "Completadas (fecha pasada)",
    description:
      "Filtro de lista: escalas no canceladas con fecha de escala pasada, o ya cerradas en Real (R).",
  },
];

export const BOOKING_BADGE_STATUS_LABELS: Record<BookingBadgeStatus, string> = {
  ...BOOKING_STATUS_LABELS,
};

export const BOOKING_STATUS_FILTER_OPTIONS: Array<{
  value: BookingListStatusFilter;
  label: string;
}> = [
  { value: "", label: "Todas" },
  { value: "action", label: "Requieren acción" },
  { value: "nr", label: "Solicitadas" },
  { value: "h", label: "En evaluación" },
  { value: "co", label: "Confirmadas" },
  { value: "cl", label: "Confirmadas LTA" },
  { value: "lta", label: "LTA" },
  { value: "ltd", label: "Long Term Deployment" },
  { value: "r", label: "Reales" },
  { value: "completed", label: "Completadas (fecha pasada)" },
  { value: "c", label: "Canceladas" },
];

export function isBookingListStatusFilter(
  value: string | null | undefined,
): value is BookingListStatusFilter {
  if (value == null) return false;
  return BOOKING_STATUS_FILTER_OPTIONS.some((option) => option.value === value);
}

export function bookingTodayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

/** True when status is R, or open booking with past call_date (legacy list filter). */
export function isBookingCompleted(
  booking: Pick<Booking, "status" | "call_date">,
  todayIso = bookingTodayIso(),
): boolean {
  if (booking.status === "c") return false;
  if (booking.status === "r") return true;
  return booking.call_date < todayIso;
}

export function getBookingBadgeStatus(
  booking: Pick<Booking, "status" | "call_date">,
): BookingBadgeStatus {
  return booking.status;
}

export function bookingBadgeStatusLabel(status: BookingBadgeStatus): string {
  return BOOKING_BADGE_STATUS_LABELS[status] ?? status;
}

export function bookingStatusLabel(status: BookingStatus): string {
  return BOOKING_STATUS_LABELS[status] ?? status;
}

export function bookingNextStatuses(status: BookingStatus): BookingStatus[] {
  switch (status) {
    case "nr":
      return ["h", "co", "c"];
    case "h":
      return ["co", "c"];
    case "co":
    case "cl":
    case "ltd":
      return ["r", "c"];
    case "lta":
      return ["cl", "co", "r", "c"];
    default:
      return [];
  }
}

export function bookingDetailHref(
  booking: Pick<Booking, "booking_code">,
  options?: { returnTo?: string | null },
): string {
  const params = new URLSearchParams();
  params.set("code", booking.booking_code);
  if (options?.returnTo) {
    params.set("returnTo", options.returnTo);
  }
  return `/bookings/detail?${params.toString()}`;
}

/** Prefill wizard from availability (or other entry points). */
export function newBookingHref(options: {
  portId: number;
  callDate: string;
  positionId?: number;
  positionLabel?: string;
  returnTo?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("port", String(options.portId));
  params.set("date", options.callDate);
  if (options.positionId && options.positionId > 0) {
    params.set("position", String(options.positionId));
  }
  if (options.positionLabel?.trim()) {
    params.set("positionLabel", options.positionLabel.trim());
  }
  if (options.returnTo) {
    params.set("returnTo", options.returnTo);
  }
  return `/bookings/new?${params.toString()}`;
}
