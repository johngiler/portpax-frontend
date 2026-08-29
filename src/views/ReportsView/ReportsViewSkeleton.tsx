"use client";

import { BarChart3 } from "lucide-react";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import { ReportMatrixContentSkeleton } from "./ReportsContentSkeleton";

export default function ReportsViewSkeleton() {
  return (
    <>
      <ViewPageHeader
        icon={BarChart3}
        title="Reportes"
        description="Matrices operativas de calls y PAX por puerto y naviera."
      />
      <ReportMatrixContentSkeleton />
    </>
  );
}
