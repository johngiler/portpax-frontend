"use client";

import { BarChart3 } from "lucide-react";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import Skeleton from "@/components/ui/Skeleton";

export default function ReportsViewSkeleton() {
  return (
    <>
      <ViewPageHeader
        icon={BarChart3}
        title="Reportes"
        description="Totales, WEEK, panorama por naviera y cumplimiento REAL (sin proyección ni garantías)."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </>
  );
}
