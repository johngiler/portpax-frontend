import { Suspense } from "react";
import NewBookingView from "@/views/BookingsView/NewBookingView";
import BookingsViewSkeleton from "@/views/BookingsView/BookingsViewSkeleton";

export default function NewBookingPage() {
  return (
    <Suspense fallback={<BookingsViewSkeleton variant="page" />}>
      <NewBookingView />
    </Suspense>
  );
}
