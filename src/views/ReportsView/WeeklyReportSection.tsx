"use client";

import { Fragment } from "react";
import useSWR from "swr";
import { CalendarDays } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import {
  reportMatrix,
  reportViewSectionBody,
} from "@/components/reports/reportMatrixStyles";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchWeeklyReport,
  type WeeklyReport,
} from "@/services/bookings/bookingService";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import ReportsEmptyState from "./ReportsEmptyState";
import { WeeklyReportContentSkeleton } from "./ReportsContentSkeleton";

type Props = {
  enabled: boolean;
  year: number;
  week: number;
  withoutLta: boolean;
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
};

function formatSigned(n: number): string {
  if (!n) return "";
  return n.toLocaleString("es-MX");
}

function formatTotal(n: number): string {
  return n.toLocaleString("es-MX");
}

function WeekBadge({ week }: { week: number }) {
  return (
    <div className="flex min-w-[3.75rem] flex-col items-center justify-center rounded-lg bg-orange-100 px-2.5 py-1.5 text-center dark:bg-orange-950/50">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-800 dark:text-orange-200">
        Sem.
      </span>
      <span className="text-xl font-bold tabular-nums leading-tight text-orange-950 dark:text-orange-50">
        {week}
      </span>
    </div>
  );
}

export default function WeeklyReportSection({
  enabled,
  year,
  week,
  withoutLta,
  hasActiveFilters,
  onClearFilters,
}: Props) {
  const { data, isLoading, error } = useSWR<WeeklyReport>(
    enabled && year > 0 && week > 0
      ? swrKeys.report(
          "weekly_report",
          `${year}|${week}|${withoutLta ? 1 : 0}`,
        )
      : null,
    () => fetchWeeklyReport({ year, week, without_lta: withoutLta }),
    { keepPreviousData: false },
  );

  const mismatch = Boolean(
    data &&
      (data.year !== year ||
        data.week !== week ||
        Boolean(data.without_lta) !== withoutLta),
  );

  if (isLoading || mismatch || !data) {
    return <WeeklyReportContentSkeleton />;
  }

  if (error) {
    return null;
  }

  if (!data.ports.length) {
    return (
      <ReportsEmptyState
        variant={hasActiveFilters ? "weekly_filtered" : "weekly_empty"}
        onClearFilters={onClearFilters}
      />
    );
  }

  const rangeLabel = `${formatIsoDateLabel(data.week_start, "short")} – ${formatIsoDateLabel(data.week_end, "short")}`;

  return (
    <ViewSection
      icon={CalendarDays}
      title={data.report_name || "Reporte Semanal"}
      description={rangeLabel}
      actions={<WeekBadge week={data.week} />}
      bodyClassName={reportViewSectionBody}
    >
      <div className={reportMatrix.shell}>
        <div className={reportMatrix.scroll}>
          <table className={reportMatrix.table}>
            <thead>
              <tr>
                <th className={reportMatrix.cornerHeader}>Puerto</th>
                {data.call_years.map((y) => (
                  <th key={y} className={reportMatrix.monthHeader}>
                    {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.ports.map((port) => (
                <Fragment key={port.port_id}>
                  <tr>
                    <td className="sticky left-0 z-10 border-r border-[var(--admin-accent)]/30 bg-[var(--admin-accent)] px-2.5 py-2 text-left text-xs font-semibold text-white">
                      <div className="flex min-w-0 items-center gap-2">
                        <CatalogLogoThumb
                          src={port.logo}
                          alt={port.port_name}
                          kind="port"
                          size="xs"
                        />
                        <span className="min-w-0 truncate font-medium text-white">
                          {port.port_name}
                        </span>
                      </div>
                    </td>
                    {port.totals.map((value, idx) => (
                      <td
                        key={`t-${port.port_id}-${idx}`}
                        className="border-b border-[var(--admin-accent)]/20 bg-[var(--admin-accent)] px-2 py-2 text-center text-xs font-semibold tabular-nums text-white"
                      >
                        {formatTotal(value)}
                      </td>
                    ))}
                  </tr>
                  {port.metrics.map((metric) => (
                    <tr key={`${port.port_id}-${metric.key}`}>
                      <td className="sticky left-0 z-10 border-r border-zinc-100 bg-white px-2.5 py-1.5 text-left text-xs italic text-sky-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-sky-300">
                        {metric.label}
                      </td>
                      {metric.values.map((value, idx) => (
                        <td
                          key={`m-${port.port_id}-${metric.key}-${idx}`}
                          className="border-b border-zinc-100/80 px-2 py-1.5 text-center tabular-nums text-zinc-700 dark:border-zinc-800/80 dark:text-zinc-200"
                        >
                          {formatSigned(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ViewSection>
  );
}
