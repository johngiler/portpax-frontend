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
        description="Vista operativa del año seleccionado."
      />
      <Skeleton className="mb-6 h-24 w-full rounded-2xl" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[130px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-64 rounded-2xl" />
        ))}
      </div>
    </>
  );
}
