"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import type { Booking } from "@/types/booking";
import BookingsList from "@/views/BookingsView/BookingsList";

type DashboardUpcomingSectionProps = {
  bookings: Booking[];
  dateFrom: string;
  dateTo: string;
};

export default function DashboardUpcomingSection({
  bookings,
  dateFrom,
  dateTo,
}: DashboardUpcomingSectionProps) {
  return (
    <ViewSection
      icon={CalendarDays}
      title="Escalas en el período"
      description={`${dateFrom} → ${dateTo}`}
      actions={
        <Link
          href="/bookings"
          className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-[var(--admin-accent)] transition-colors hover:text-[var(--admin-accent)]/80"
        >
          Ver reservas
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      }
    >
      <BookingsList bookings={bookings} />
    </ViewSection>
  );
}
