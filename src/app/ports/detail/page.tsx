import { Suspense } from "react";
import PortDetailView from "@/views/PortDetailView";
import PortDetailSkeleton from "@/views/PortDetailView/PortDetailSkeleton";

export default function PortDetailPage() {
  return (
    <Suspense fallback={<PortDetailSkeleton />}>
      <PortDetailView />
    </Suspense>
  );
}
