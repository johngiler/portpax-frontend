"use client";

import { CalendarDays } from "lucide-react";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import Skeleton from "@/components/ui/Skeleton";
import type {
  BookingsTabQuery,
  CalendarViewModeQuery,
} from "@/lib/viewFilterQuery";

type BookingsViewSkeletonProps = {
  /** Full page (Suspense / catalogs). Tab body only when loading list/calendar/availability. */
  variant?: "page" | BookingsTabQuery;
  /** How many port chart placeholders (availability only). */
  availabilityCards?: number;
  /** Calendar body layout when variant is calendar. */
  calendarMode?: CalendarViewModeQuery;
};

function TabsSkeleton() {
  return (
    <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/50 p-1 dark:bg-zinc-900/40">
      {Array.from({ length: 4 }).map((_, i) => (
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

function MonthlyCalendarSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-700">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={`h-${i}`}
            className="h-8 rounded-none bg-zinc-50 dark:bg-zinc-900"
          />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={`c-${i}`}
            className="min-h-[7rem] space-y-2 bg-white p-2 dark:bg-zinc-900"
          >
            <Skeleton className="h-4 w-6 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-3/4 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyCalendarSkeleton() {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[48rem] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
        <div className="grid grid-cols-[7rem_repeat(7,minmax(0,1fr))] gap-px bg-zinc-200 dark:bg-zinc-700">
          <Skeleton className="h-12 rounded-none bg-zinc-50 dark:bg-zinc-900" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={`wd-${i}`}
              className="h-12 rounded-none bg-zinc-50 dark:bg-zinc-900"
            />
          ))}
          {Array.from({ length: 4 }).map((_, row) => (
            <div key={`row-${row}`} className="contents">
              <div className="bg-white p-2 dark:bg-zinc-900">
                <Skeleton className="h-5 w-14 rounded" />
              </div>
              {Array.from({ length: 7 }).map((_, col) => (
                <div
                  key={`cell-${row}-${col}`}
                  className="min-h-[5.5rem] space-y-2 bg-white p-2 dark:bg-zinc-900"
                >
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="h-9 w-2/3 rounded-md" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnnualCalendarSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="space-y-2 rounded-xl border border-zinc-200/80 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <Skeleton className="h-4 w-28 rounded" />
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 35 }).map((_, d) => (
              <Skeleton key={d} className="aspect-square rounded-sm" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarSkeleton({ mode }: { mode: CalendarViewModeQuery }) {
  if (mode === "weekly") return <WeeklyCalendarSkeleton />;
  if (mode === "annual") return <AnnualCalendarSkeleton />;
  return <MonthlyCalendarSkeleton />;
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
  calendarMode,
}: {
  tab: BookingsTabQuery;
  availabilityCards: number;
  calendarMode: CalendarViewModeQuery;
}) {
  if (tab === "calendar") return <CalendarSkeleton mode={calendarMode} />;
  if (tab === "availability") {
    return <AvailabilitySkeleton cards={availabilityCards} />;
  }
  return <ListSkeleton />;
}

export default function BookingsViewSkeleton({
  variant = "page",
  availabilityCards = 2,
  calendarMode = "monthly",
}: BookingsViewSkeletonProps) {
  if (variant !== "page") {
    return (
      <BodySkeleton
        tab={variant}
        availabilityCards={availabilityCards}
        calendarMode={calendarMode}
      />
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
