"use client";

import { CalendarDays } from "lucide-react";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import BookingWizard from "./BookingWizard";

export default function NewBookingView() {
  return (
    <>
      <ViewPageHeader
        icon={CalendarDays}
        title="Nueva reserva"
        description="Paquete de escalas: puerto, naviera, barco y varias fechas en una acción."
      />
      <BookingWizard />
    </>
  );
}
