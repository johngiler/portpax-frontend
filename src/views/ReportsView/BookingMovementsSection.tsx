"use client";

import useSWR from "swr";
import { GitBranch } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchBookingMovementsReport,
  type BookingMovementsReport,
} from "@/services/bookings/bookingService";
import { ReportMatrixContentSkeleton } from "./ReportsContentSkeleton";

type BookingMovementsSectionProps = {
  enabled: boolean;
  year: number;
};

function formatNum(n: number): string {
  if (!n) return "";
  return n.toLocaleString("es-MX");
}

function cellBorder(extra = ""): string {
  return `border border-zinc-200/80 dark:border-zinc-700/70 ${extra}`.trim();
}

function MonthMatrix({
  monthLabels,
  rows,
  monthTotals,
  grandTotal,
  monthPct,
  avgPerMonth,
}: {
  monthLabels: string[];
  rows: {
    key: string;
    label: string;
    months: number[];
    total: number;
    bold?: boolean;
  }[];
  monthTotals: number[];
  grandTotal: number;
  monthPct: number[];
  avgPerMonth: number;
}) {
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg">
        <table className="min-w-max w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-[var(--admin-accent)] text-white">
              <th
                className={cellBorder(
                  "sticky left-0 z-10 bg-[var(--admin-accent)] px-2 py-2 text-left font-semibold",
                )}
              />
              {monthLabels.map((label) => (
                <th
                  key={label}
                  className={cellBorder(
                    "px-2 py-2 text-center font-semibold capitalize",
                  )}
                >
                  {label}
                </th>
              ))}
              <th
                className={cellBorder(
                  "px-2 py-2 text-center font-semibold",
                )}
              >
                Total general
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className={
                  row.bold
                    ? "bg-sky-50 font-semibold dark:bg-sky-950/40"
                    : "bg-white odd:bg-zinc-50/80 dark:bg-zinc-950/40 dark:odd:bg-zinc-900/40"
                }
              >
                <td
                  className={cellBorder(
                    "sticky left-0 z-10 bg-inherit px-2 py-1.5 whitespace-nowrap",
                  )}
                >
                  {row.label}
                </td>
                {row.months.map((value, idx) => (
                  <td
                    key={`${row.key}-${idx}`}
                    className={cellBorder(
                      "px-2 py-1.5 text-right tabular-nums",
                    )}
                  >
                    {formatNum(value)}
                  </td>
                ))}
                <td
                  className={cellBorder(
                    "px-2 py-1.5 text-right tabular-nums",
                  )}
                >
                  {formatNum(row.total)}
                </td>
              </tr>
            ))}
            <tr className="bg-sky-50 font-semibold dark:bg-sky-950/40">
              <td
                className={cellBorder(
                  "sticky left-0 z-10 bg-sky-50 px-2 py-1.5 dark:bg-sky-950/40",
                )}
              >
                Total general
              </td>
              {monthTotals.map((value, idx) => (
                <td
                  key={`tot-${idx}`}
                  className={cellBorder(
                    "px-2 py-1.5 text-right tabular-nums",
                  )}
                >
                  {formatNum(value)}
                </td>
              ))}
              <td
                className={cellBorder(
                  "px-2 py-1.5 text-right tabular-nums",
                )}
              >
                {formatNum(grandTotal)}
              </td>
            </tr>
            <tr className="bg-white text-zinc-500 dark:bg-zinc-950/40 dark:text-zinc-400">
              <td
                className={cellBorder(
                  "sticky left-0 z-10 bg-inherit px-2 py-1.5",
                )}
              />
              {monthPct.map((pct, idx) => (
                <td
                  key={`pct-${idx}`}
                  className={cellBorder(
                    "px-2 py-1.5 text-center tabular-nums",
                  )}
                >
                  {pct ? `${pct}%` : ""}
                </td>
              ))}
              <td className={cellBorder("px-2 py-1.5")} />
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm font-semibold text-[var(--admin-accent)]">
        Promedio por mes: {avgPerMonth.toLocaleString("es-MX")}
      </p>
    </div>
  );
}

export default function BookingMovementsSection({
  enabled,
  year,
}: BookingMovementsSectionProps) {
  const { data, isLoading, error } = useSWR<BookingMovementsReport>(
    enabled && year > 0
      ? swrKeys.report("booking_movements", String(year))
      : null,
    () => fetchBookingMovementsReport({ year }),
    { keepPreviousData: false },
  );

  const yearMismatch = Boolean(data && data.year !== year);

  if (isLoading || yearMismatch || !data) {
    return <ReportMatrixContentSkeleton sectionCount={2} />;
  }

  if (error) {
    return null;
  }

  const typeRows = data.type_rows.map((row) => ({
    key: row.kind,
    label: row.kind,
    months: row.months,
    total: row.total,
  }));

  const portRows: {
    key: string;
    label: string;
    months: number[];
    total: number;
    bold?: boolean;
  }[] = [];
  for (const block of data.port_blocks) {
    portRows.push({
      key: `port-${block.port_id}`,
      label: block.port_name,
      months: block.months,
      total: block.total,
      bold: true,
    });
    for (const yearRow of block.years) {
      portRows.push({
        key: `port-${block.port_id}-${yearRow.year}`,
        label: String(yearRow.year),
        months: yearRow.months,
        total: yearRow.total,
      });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ViewSection
        icon={GitBranch}
        title={data.title}
        description={`Año ${data.year}`}
      >
        <MonthMatrix
          monthLabels={data.month_labels}
          rows={typeRows}
          monthTotals={data.type_month_totals}
          grandTotal={data.type_grand_total}
          monthPct={data.type_month_pct}
          avgPerMonth={data.type_avg_per_month}
        />
      </ViewSection>
      <ViewSection
        icon={GitBranch}
        title="PAX por puerto y año de escala"
        description={`Año ${data.year}`}
      >
        {portRows.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Sin PAX de movimientos en este año.
          </p>
        ) : (
          <MonthMatrix
            monthLabels={data.month_labels}
            rows={portRows}
            monthTotals={data.pax_month_totals}
            grandTotal={data.pax_grand_total}
            monthPct={data.pax_month_pct}
            avgPerMonth={data.pax_avg_per_month}
          />
        )}
      </ViewSection>
    </div>
  );
}
