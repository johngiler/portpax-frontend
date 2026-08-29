"use client";

import CatalogLogoThumb, {
  type CatalogLogoKind,
} from "@/components/ui/CatalogLogoThumb";
import { BarChart3, Ship, Users } from "lucide-react";
import {
  formatMatrixValue,
  matrixMetricTheme,
  reportMatrix,
} from "./reportMatrixStyles";

export type MatrixYearRow = {
  year: number | "total";
  months: number[];
  total: number;
  is_total?: boolean;
};

export type MatrixSection = {
  label: string;
  calls: MatrixYearRow[];
  pax: MatrixYearRow[];
  is_total?: boolean;
  logo?: string | null;
  logo_kind?: CatalogLogoKind;
};

type ReportMatrixTableProps = {
  rowLabelHeader?: string;
  monthLabels: string[];
  rows: MatrixYearRow[];
  metric?: "calls" | "pax";
  nested?: boolean;
};

function MatrixCardHeader({ metric }: { metric: "calls" | "pax" }) {
  const theme = matrixMetricTheme[metric];
  const Icon = metric === "calls" ? Ship : Users;

  return (
    <div
      className={`flex items-center gap-3 border-b px-3 py-3 sm:px-4 ${theme.headerBar}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.iconWrap}`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 leading-tight">
        <p
          className={`text-[11px] font-semibold uppercase tracking-wide ${theme.accent}`}
        >
          {theme.line1}
        </p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {theme.line2}
        </p>
      </div>
    </div>
  );
}

function MatrixSectionHeader({ section }: { section: MatrixSection }) {
  const kicker = section.is_total
    ? "Consolidado"
    : section.logo_kind === "shipping_line"
      ? "Naviera"
      : "Puerto";

  return (
    <div className={reportMatrix.sectionGroupHeader}>
      {section.is_total && !section.logo ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
          <BarChart3 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </div>
      ) : (
        <CatalogLogoThumb
          src={section.logo}
          alt={section.label}
          kind={section.logo_kind ?? "port"}
          size="md"
        />
      )}
      <div className="min-w-0">
        <p className={reportMatrix.sectionGroupKicker}>{kicker}</p>
        <p className={reportMatrix.sectionGroupTitle}>{section.label}</p>
      </div>
    </div>
  );
}

export default function ReportMatrixTable({
  rowLabelHeader = "Año",
  monthLabels,
  rows,
  metric = "calls",
  nested = false,
}: ReportMatrixTableProps) {
  const compact = metric === "pax";

  return (
    <div className={nested ? reportMatrix.shellNested : reportMatrix.shell}>
      <MatrixCardHeader metric={metric} />
      <div className={reportMatrix.scroll}>
        <table className={reportMatrix.table}>
          <thead>
            <tr>
              <th className={reportMatrix.cornerHeader}>{rowLabelHeader}</th>
              {monthLabels.map((month) => (
                <th key={month} className={reportMatrix.monthHeader}>
                  {month}
                </th>
              ))}
              <th className={reportMatrix.totalHeader}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isTotal = row.is_total || row.year === "total";
              const label = isTotal ? "Total" : String(row.year);
              return (
                <tr key={`${row.year}-${idx}`}>
                  <td
                    className={
                      isTotal
                        ? reportMatrix.totalRowLabel
                        : idx % 2 === 0
                          ? reportMatrix.rowLabel
                          : reportMatrix.rowLabelAlt
                    }
                  >
                    {label}
                  </td>
                  {row.months.map((value, monthIdx) => (
                    <td
                      key={`${row.year}-${monthIdx}`}
                      className={
                        isTotal
                          ? reportMatrix.totalDataCell
                          : idx % 2 === 0
                            ? reportMatrix.dataCell
                            : reportMatrix.dataCellAlt
                      }
                    >
                      {formatMatrixValue(value, compact)}
                    </td>
                  ))}
                  <td className={reportMatrix.totalDataCell}>
                    {formatMatrixValue(row.total, compact)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type ReportDualMatrixProps = {
  monthLabels: string[];
  sections: MatrixSection[];
};

export function ReportDualMatrix({
  monthLabels,
  sections,
}: ReportDualMatrixProps) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.label} className={reportMatrix.sectionGroup}>
          <MatrixSectionHeader section={section} />
          <div className={reportMatrix.sectionGroupBody}>
            <ReportMatrixTable
              monthLabels={monthLabels}
              rows={section.calls}
              metric="calls"
              nested
            />
            <ReportMatrixTable
              monthLabels={monthLabels}
              rows={section.pax}
              metric="pax"
              nested
            />
          </div>
        </div>
      ))}
    </div>
  );
}
