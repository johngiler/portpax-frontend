import { Suspense } from "react";
import ShippingLineDetailView from "@/views/ShippingLineDetailView";
import ShippingLineDetailSkeleton from "@/views/ShippingLineDetailView/ShippingLineDetailSkeleton";

export default function ShippingLineDetailPage() {
  return (
    <Suspense fallback={<ShippingLineDetailSkeleton />}>
      <ShippingLineDetailView />
    </Suspense>
  );
}
