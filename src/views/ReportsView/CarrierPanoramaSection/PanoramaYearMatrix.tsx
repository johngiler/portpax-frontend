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

export default function PanoramaYearMatrix({ data }: Props) {
  const years = data.years;

  return (
    <div className={reportMatrix.shell}>
      <div className={reportMatrix.scroll}>
        <table className={reportMatrix.table}>
          <thead>
            <tr>
              <th rowSpan={2} className={reportMatrix.cornerHeader}>
                Puerto
              </th>
              {years.map((year) => (
                <th
                  key={year}
                  colSpan={2}
                  className={reportMatrix.monthHeader}
                >
                  {year}
                </th>
              ))}
              <th colSpan={2} className={reportMatrix.totalHeader}>
                Total
              </th>
            </tr>
            <tr>
              {years.map((year) => (
                <Fragment key={`${year}-sub`}>
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
              const byYear = new Map(row.by_year.map((cell) => [cell.year, cell]));
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
                  {years.map((year) => {
                    const cell = byYear.get(year);
                    return (
                      <Fragment key={`${row.port_id}-${year}`}>
                        <td
                          className={alt ? reportMatrix.dataCellAlt : reportMatrix.dataCell}
                        >
                          {formatNum(cell?.calls ?? 0)}
                        </td>
                        <td
                          className={alt ? reportMatrix.dataCellAlt : reportMatrix.dataCell}
                        >
                          {formatNum(cell?.pax ?? 0)}
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
              {data.totals.by_year.map((cell) => (
                <Fragment key={`total-${cell.year}`}>
                  <td className={reportMatrix.totalDataCell}>
                    {formatNum(cell.calls)}
                  </td>
                  <td className={reportMatrix.totalDataCell}>
                    {formatNum(cell.pax)}
                  </td>
                </Fragment>
              ))}
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
