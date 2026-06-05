import Skeleton, { SkeletonText } from "@/components/ui/Skeleton";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import { LayoutDashboard } from "lucide-react";

/**
 * Skeleton for DashboardView. Update when the view layout changes.
 * Dashboard is static today; keep as reference for API-backed views.
 */
export default function DashboardViewSkeleton() {
  return (
    <>
      <ViewPageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Cargando resumen…"
      />
      <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[130px] rounded-2xl" />
        ))}
      </div>
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/80">
        <Skeleton className="mb-3 h-10 w-10 rounded-xl" />
        <Skeleton className="h-5 w-48 rounded" />
        <SkeletonText className="mt-4" lines={3} />
      </div>
    </>
  );
}
