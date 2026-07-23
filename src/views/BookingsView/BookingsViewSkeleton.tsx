"use client";

import { CalendarDays } from "lucide-react";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import Skeleton from "@/components/ui/Skeleton";
import type { BookingsTabQuery } from "@/lib/viewFilterQuery";

type BookingsViewSkeletonProps = {
  /** Full page (Suspense / catalogs). Tab body only when loading list/calendar/availability. */
  variant?: "page" | BookingsTabQuery;
  /** How many port chart placeholders (availability only). */
  availabilityCards?: number;
};

function TabsSkeleton() {
  return (
    <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/50 p-1 dark:bg-zinc-900/40">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-28 rounded-lg sm:w-36" />
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <div className="h-14 w-14 rounded-xl bg-zinc-200/80 dark:bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 rounded bg-zinc-200/80 dark:bg-zinc-800" />
            <div className="h-3 w-64 rounded bg-zinc-200/60 dark:bg-zinc-800/80" />
            <div className="h-3 w-32 rounded bg-zinc-200/60 dark:bg-zinc-800/80" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 px-1">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-5 w-40 rounded" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <Skeleton className="h-[28rem] w-full rounded-xl" />
    </div>
  );
}

function AvailabilitySkeleton({ cards }: { cards: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-64 rounded" />
          <Skeleton className="h-4 w-96 max-w-full rounded" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function BodySkeleton({
  tab,
  availabilityCards,
}: {
  tab: BookingsTabQuery;
  availabilityCards: number;
}) {
  if (tab === "calendar") return <CalendarSkeleton />;
  if (tab === "availability") {
    return <AvailabilitySkeleton cards={availabilityCards} />;
  }
  return <ListSkeleton />;
}

export default function BookingsViewSkeleton({
  variant = "page",
  availabilityCards = 2,
}: BookingsViewSkeletonProps) {
  if (variant !== "page") {
    return (
      <BodySkeleton tab={variant} availabilityCards={availabilityCards} />
    );
  }

  return (
    <>
      <ViewPageHeader
        icon={CalendarDays}
        title="Reservas"
        description="Solicitudes de escala por puerto, naviera y barco."
      />
      <TabsSkeleton />
      <ListSkeleton />
    </>
  );
}
