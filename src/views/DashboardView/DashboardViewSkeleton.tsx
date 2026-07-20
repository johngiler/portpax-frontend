"use client";

import { LayoutDashboard } from "lucide-react";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import Skeleton from "@/components/ui/Skeleton";

export default function DashboardViewSkeleton() {
  return (
    <>
      <ViewPageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="KPIs operativos del período, cola de acción, próximos 30 días y ocupación por puerto."
      />
      <Skeleton className="mb-6 h-24 w-full rounded-2xl" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`kpi-${index}`} className="h-[150px] rounded-2xl" />
        ))}
      </div>
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="mb-6 h-56 w-full rounded-2xl" />
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`chart-${index}`} className="h-64 rounded-2xl" />
        ))}
      </div>
    </>
  );
}
