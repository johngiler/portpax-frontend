"use client";

import { CalendarDays, Plus } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import {
  BOOKINGS_FILTERED_EMPTY_DESCRIPTION,
  BOOKINGS_FILTERED_EMPTY_TITLE,
  BOOKINGS_LIST_EMPTY_DESCRIPTION,
  BOOKINGS_LIST_EMPTY_TITLE,
} from "./bookingsEmptyCopy";

type BookingsEmptyStateProps = {
  variant: "empty" | "filtered";
  onClearFilters?: () => void;
};

export default function BookingsEmptyState({
  variant,
  onClearFilters,
}: BookingsEmptyStateProps) {
  const isFiltered = variant === "filtered";

  return (
    <EmptyState
      icon={CalendarDays}
      filtered={isFiltered}
      title={isFiltered ? BOOKINGS_FILTERED_EMPTY_TITLE : BOOKINGS_LIST_EMPTY_TITLE}
      description={
        isFiltered
          ? BOOKINGS_FILTERED_EMPTY_DESCRIPTION
          : BOOKINGS_LIST_EMPTY_DESCRIPTION
      }
      primaryAction={{
        label: "Crear reserva",
        href: "/bookings/new",
        icon: Plus,
      }}
      onClearFilters={onClearFilters}
    />
  );
}
