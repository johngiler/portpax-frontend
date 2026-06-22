"use client";

import BookingDateCalendar from "@/components/booking/BookingDateCalendar";

type DatesStepProps = {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
};

export default function DatesStep({ selectedDates, onChange }: DatesStepProps) {
  return (
    <div className="max-w-xl">
      <BookingDateCalendar selectedDates={selectedDates} onChange={onChange} />
    </div>
  );
}
