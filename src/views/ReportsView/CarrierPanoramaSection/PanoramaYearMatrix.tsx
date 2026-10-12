"use client";

import { Fragment } from "react";
import ReportEntityLabel from "@/components/reports/ReportEntityLabel";
import { reportMatrix } from "@/components/reports/reportMatrixStyles";
import type { CarrierPanoramaReport } from "@/services/bookings/bookingService";

type Props = {
  data: CarrierPanoramaReport;
};

function formatNum(value: number): string {
  if (!value) return "0";
  return value.toLocaleString("es-MX");
}

function periodColumns(data: CarrierPanoramaReport): {
  key: string;
  label: string;
}[] {
  if (data.periods && data.periods.length > 0) {
    return data.periods.map((period) => ({
      key: period.key,
      label: period.label,
    }));
  }
  return (data.years ?? []).map((year) => ({
    key: `year-${year}`,
    label: String(year),
  }));
}

function cellMap(
  cells:
    | { period_key?: string; label?: string; year?: number; calls: number; pax: number }[]
    | undefined,
): Map<string, { calls: number; pax: number }> {
  const map = new Map<string, { calls: number; pax: number }>();
  for (const cell of cells ?? []) {
    const key =
      cell.period_key ||
      (cell.label ? `label:${cell.label}` : "") ||
      (cell.year != null ? `year-${cell.year}` : "");
    if (!key) continue;
    map.set(key, { calls: cell.calls, pax: cell.pax });
    if (cell.label) map.set(`label:${cell.label}`, { calls: cell.calls, pax: cell.pax });
  }
  return map;
}

export default function PanoramaYearMatrix({ data }: Props) {
  const columns = periodColumns(data);

  return (
    <div className={reportMatrix.shell}>
      <div className={reportMatrix.scroll}>
        <table className={reportMatrix.table}>
          <thead>
            <tr>
              <th rowSpan={2} className={reportMatrix.cornerHeader}>
                Puerto
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  colSpan={2}
                  className={reportMatrix.monthHeader}
                >
                  {col.label}
                </th>
              ))}
              <th colSpan={2} className={reportMatrix.totalHeader}>
                Total
              </th>
            </tr>
            <tr>
              {columns.map((col) => (
                <Fragment key={`${col.key}-sub`}>
                  <th className={reportMatrix.subHeader}>Arribos</th>
                  <th className={reportMatrix.subHeader}>PAX</th>
                </Fragment>
              ))}
              <th className={reportMatrix.subHeader}>Arribos</th>
              <th className={reportMatrix.subHeader}>PAX</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, index) => {
              const alt = index % 2 === 1;
              const byPeriod = cellMap(row.by_period ?? row.by_year);
              return (
                <tr key={row.port_id}>
                  <th
                    scope="row"
                    className={alt ? reportMatrix.rowLabelAlt : reportMatrix.rowLabel}
                  >
                    <ReportEntityLabel
                      name={row.port_name}
                      logo={row.logo}
                      logoKind="port"
                    />
                  </th>
                  {columns.map((col) => {
                    const cell =
                      byPeriod.get(col.key) ||
                      byPeriod.get(`label:${col.label}`) ||
                      { calls: 0, pax: 0 };
                    return (
                      <Fragment key={`${row.port_id}-${col.key}`}>
                        <td
                          className={alt ? reportMatrix.dataCellAlt : reportMatrix.dataCell}
                        >
                          {formatNum(cell.calls)}
                        </td>
                        <td
                          className={alt ? reportMatrix.dataCellAlt : reportMatrix.dataCell}
                        >
                          {formatNum(cell.pax)}
                        </td>
                      </Fragment>
                    );
                  })}
                  <td className={reportMatrix.totalDataCell}>
                    {formatNum(row.total_calls)}
                  </td>
                  <td className={reportMatrix.totalDataCell}>
                    {formatNum(row.total_pax)}
                  </td>
                </tr>
              );
            })}
            <tr>
              <th scope="row" className={reportMatrix.totalRowLabel}>
                Total
              </th>
              {columns.map((col) => {
                const totalsMap = cellMap(
                  data.totals.by_period ?? data.totals.by_year,
                );
                const cell =
                  totalsMap.get(col.key) ||
                  totalsMap.get(`label:${col.label}`) ||
                  { calls: 0, pax: 0 };
                return (
                  <Fragment key={`total-${col.key}`}>
                    <td className={reportMatrix.totalDataCell}>
                      {formatNum(cell.calls)}
                    </td>
                    <td className={reportMatrix.totalDataCell}>
                      {formatNum(cell.pax)}
                    </td>
                  </Fragment>
                );
              })}
              <td className={reportMatrix.totalDataCell}>
                {formatNum(data.totals.total_calls)}
              </td>
              <td className={reportMatrix.totalDataCell}>
                {formatNum(data.totals.total_pax)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
