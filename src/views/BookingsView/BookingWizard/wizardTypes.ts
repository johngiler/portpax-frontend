import { Anchor, CalendarDays, CheckCircle2, MapPin, Ship } from "lucide-react";
import type { BookingBatchPayload } from "@/types/booking";

export type WizardCreateStatus = NonNullable<BookingBatchPayload["status"]>;

export const BOOKING_WIZARD_STEPS = [
  { id: "port", label: "Puerto", icon: MapPin },
  { id: "line", label: "Naviera", icon: Anchor },
  { id: "vessel", label: "Barco", icon: Ship },
  { id: "dates", label: "Fechas", icon: CalendarDays },
  { id: "review", label: "Confirmar", icon: CheckCircle2 },
] as const;

/** Cards per page in wizard selection grids (naviera, barco, …). */
export const WIZARD_GRID_PAGE_SIZE = 15;

export type BookingWizardStepId = (typeof BOOKING_WIZARD_STEPS)[number]["id"];

export type WizardDateEntry = {
  eta: string;
  etd: string;
  plannedPax: string;
  positionId: number | null;
  positionLabel: string;
  status: WizardCreateStatus;
};

export type BookingWizardForm = {
  portId: number | null;
  shippingLineId: number | null;
  vesselId: number | null;
  callDates: string[];
  /** Per-call schedule / PAX / position / status (edited on Confirmar). */
  dateEntries: Record<string, WizardDateEntry>;
  notes: string;
};

export function emptyDateEntry(
  status: WizardCreateStatus = "h",
): WizardDateEntry {
  return {
    eta: "",
    etd: "",
    plannedPax: "",
    positionId: null,
    positionLabel: "",
    status,
  };
}

/** Keep entries aligned with selected dates; preserve edits for kept dates. */
export function syncDateEntries(
  dates: string[],
  prev: Record<string, WizardDateEntry>,
): Record<string, WizardDateEntry> {
  const next: Record<string, WizardDateEntry> = {};
  for (const d of dates) {
    next[d] = prev[d] ?? emptyDateEntry();
  }
  return next;
}

export const emptyBookingWizardForm = (): BookingWizardForm => ({
  portId: null,
  shippingLineId: null,
  vesselId: null,
  callDates: [],
  dateEntries: {},
  notes: "",
});
