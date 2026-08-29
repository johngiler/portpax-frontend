"use client";

import { BarChart3, TrendingUp } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import Skeleton from "@/components/ui/Skeleton";
import { reportMatrix, reportViewSectionBody } from "@/components/reports/reportMatrixStyles";

function ReportMatrixTableSkeleton() {
  return (
    <div className={reportMatrix.shellNested}>
      <Skeleton className="h-[4.25rem] w-full rounded-none" />
      <div className="space-y-2 p-3 sm:p-4">
        <Skeleton className="h-8 w-full rounded-md" />
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-7 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

function ReportMatrixGroupSkeleton() {
  return (
    <div className={reportMatrix.sectionGroup}>
      <div className={reportMatrix.sectionGroupHeader}>
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-4 w-40 max-w-full rounded" />
        </div>
      </div>
      <div className={reportMatrix.sectionGroupBody}>
        <ReportMatrixTableSkeleton />
        <ReportMatrixTableSkeleton />
      </div>
    </div>
  );
}

type ReportMatrixContentSkeletonProps = {
  sectionCount?: number;
};

export function ReportMatrixContentSkeleton({
  sectionCount = 2,
}: ReportMatrixContentSkeletonProps) {
  return (
    <ViewSection
      icon={BarChart3}
      title="Cargando reporte…"
      description="Obteniendo matrices de calls y PAX."
      bodyClassName={reportViewSectionBody}
    >
      <div className="space-y-6">
        {Array.from({ length: sectionCount }).map((_, index) => (
          <ReportMatrixGroupSkeleton key={index} />
        ))}
      </div>
    </ViewSection>
  );
}

export function ReportTrendsContentSkeleton() {
  return (
    <div className="space-y-4">
      <ViewSection
        icon={TrendingUp}
        title="Cargando trends…"
        description="Obteniendo ships, PAX y crecimiento por naviera."
        bodyClassName={reportViewSectionBody}
      >
        <div className={reportMatrix.sectionGroup}>
          <div className={reportMatrix.sectionGroupHeader}>
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-14 rounded" />
              <Skeleton className="h-4 w-36 max-w-full rounded" />
            </div>
          </div>
          <div className={reportMatrix.sectionGroupBody}>
            <ReportMatrixTableSkeleton />
          </div>
        </div>
      </ViewSection>

      <ViewSection
        icon={TrendingUp}
        title="Cargando growth…"
        description="Variación interanual de PAX por naviera."
        bodyClassName={reportViewSectionBody}
      >
        <div className={reportMatrix.sectionGroup}>
          <div className={reportMatrix.sectionGroupHeader}>
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-14 rounded" />
              <Skeleton className="h-4 w-36 max-w-full rounded" />
            </div>
          </div>
          <div className={reportMatrix.sectionGroupBody}>
            <ReportMatrixTableSkeleton />
          </div>
        </div>
      </ViewSection>
    </div>
  );
}
