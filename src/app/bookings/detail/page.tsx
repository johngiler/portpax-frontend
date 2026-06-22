import { Suspense } from "react";
import BookingDetailView from "@/views/BookingsView/BookingDetailView";
import BookingDetailSkeleton from "@/views/BookingsView/BookingDetailView/BookingDetailSkeleton";

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<BookingDetailSkeleton />}>
      <BookingDetailView />
    </Suspense>
  );
}
