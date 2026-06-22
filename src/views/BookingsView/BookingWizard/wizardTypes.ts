import { Anchor, CalendarDays, CheckCircle2, MapPin, Ship } from "lucide-react";

export const BOOKING_WIZARD_STEPS = [
  { id: "port", label: "Puerto", icon: MapPin },
  { id: "line", label: "Naviera", icon: Anchor },
  { id: "vessel", label: "Barco", icon: Ship },
  { id: "dates", label: "Fechas", icon: CalendarDays },
  { id: "review", label: "Confirmar", icon: CheckCircle2 },
] as const;

export type BookingWizardStepId = (typeof BOOKING_WIZARD_STEPS)[number]["id"];

export type BookingWizardForm = {
  portId: number | null;
  shippingLineId: number | null;
  vesselId: number | null;
  callDates: string[];
  notes: string;
};

export const emptyBookingWizardForm = (): BookingWizardForm => ({
  portId: null,
  shippingLineId: null,
  vesselId: null,
  callDates: [],
  notes: "",
});
