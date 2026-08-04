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
          className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/80 sm:flex-row sm:items-start sm:gap-4"
        >
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
            <div className="h-14 w-12 shrink-0 rounded-xl bg-zinc-200/80 dark:bg-zinc-800" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-4 w-40 rounded bg-zinc-200/80 dark:bg-zinc-800" />
                <div className="h-5 w-16 rounded-full bg-zinc-200/60 dark:bg-zinc-800/80" />
                <div className="h-6 w-12 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/80" />
              </div>
              <div className="h-3 w-56 rounded bg-zinc-200/60 dark:bg-zinc-800/80" />
            </div>
          </div>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:max-w-[min(100%,28rem)] sm:items-end">
            <div className="flex flex-wrap justify-end gap-2">
              <div className="h-3 w-12 rounded bg-zinc-200/60 dark:bg-zinc-800/80" />
              <div className="h-3 w-20 rounded bg-zinc-200/60 dark:bg-zinc-800/80" />
              <div className="h-3 w-16 rounded bg-zinc-200/60 dark:bg-zinc-800/80" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <div className="h-6 w-40 rounded-md bg-zinc-200/60 dark:bg-zinc-800/80" />
              <div className="h-4 w-4 rounded bg-zinc-200/60 dark:bg-zinc-800/80" />
            </div>
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

/** Mirrors AnnualGrid Excel layout: nav + stacked month blocks (pos × days). */
function AnnualMonthBlockSkeleton({ dayCols = 31 }: { dayCols?: number }) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-3 w-36 rounded" />
      </div>
      <div className="overflow-x-auto p-2">
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `5.5rem repeat(${dayCols}, minmax(2rem, 1fr))`,
            minWidth: `${5.5 + dayCols * 2.25}rem`,
          }}
        >
          <Skeleton className="h-6 rounded-sm" />
          {Array.from({ length: dayCols }).map((_, d) => (
            <Skeleton key={`dh-${d}`} className="h-6 rounded-sm" />
          ))}
          {Array.from({ length: 4 }).map((_, row) => (
            <div key={`r-${row}`} className="contents">
              <Skeleton className="h-8 rounded-sm" />
              {Array.from({ length: dayCols }).map((_, col) => (
                <Skeleton
                  key={`c-${row}-${col}`}
                  className="h-8 rounded-sm"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnnualCalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-9 w-48 rounded-xl" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <AnnualMonthBlockSkeleton key={i} dayCols={i === 1 ? 30 : 31} />
        ))}
      </div>
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
        description="Busca por código de reserva para abrir la escala y descargar el PDF de confirmación."
      />
      <TabsSkeleton />
      <ListSkeleton />
    </>
  );
}
