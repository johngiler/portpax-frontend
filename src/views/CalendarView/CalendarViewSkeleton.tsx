"use client";

import { CalendarRange } from "lucide-react";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import Skeleton from "@/components/ui/Skeleton";

export default function CalendarViewSkeleton() {
  return (
    <>
      <ViewPageHeader
        icon={CalendarRange}
        title="Calendario"
        description="Mapa de ocupación anual por puerto."
      />
      <Skeleton className="mb-4 h-12 w-full max-w-xl rounded-xl" />
      <Skeleton className="h-[48rem] rounded-2xl" />
    </>
  );
}
