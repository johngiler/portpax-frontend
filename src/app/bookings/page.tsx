import { Suspense } from "react";
import BookingsView from "@/views/BookingsView";
import BookingsViewSkeleton from "@/views/BookingsView/BookingsViewSkeleton";

export default function BookingsPage() {
  return (
    <Suspense fallback={<BookingsViewSkeleton />}>
      <BookingsView />
    </Suspense>
  );
}
