"use client";

import { Fragment } from "react";
import ViewSection from "@/components/layout/ViewSection";
import EmptyState from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";
import type { CumplimientoRealReport } from "@/services/bookings/bookingService";

type Props = {
  data: CumplimientoRealReport;
  onClearFilters?: () => void;
};

export default function CumplimientoRealSection({
  data,
  onClearFilters,
}: Props) {
  if (data.lines.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        filtered
        title="Sin PAX en el rango"
        description="No hay reservas con PAX en el período o filtros seleccionados. Ajusta el rango o el puerto."
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <ViewSection
      icon={FileText}
      title="Cumplimiento (REAL)"
      description={data.note}
    >
      <div className="overflow-x-auto px-5 py-4 sm:px-6">
        <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-zinc-500">
                <th className="py-2 pr-3">Naviera</th>
                {data.years.map((y) => (
                  <th key={y} className="py-2 pr-3 text-right" colSpan={2}>
                    {y}
                  </th>
                ))}
                <th className="py-2 text-right">Total PAX</th>
              </tr>
              <tr className="text-[10px] uppercase tracking-wide text-zinc-400">
                <th className="py-1 pr-3" />
                {data.years.map((y) => (
                  <Fragment key={y}>
                    <th className="py-1 pr-2 text-right">Pax</th>
                    <th className="py-1 pr-3 text-right">%</th>
                  </Fragment>
                ))}
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {data.lines.map((row) => (
                <tr
                  key={row.shipping_line_id}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="py-2.5 pr-3">{row.name}</td>
                  {row.by_year.map((cell) => (
                    <Fragment key={`${row.shipping_line_id}-${cell.year}`}>
                      <td className="py-2.5 pr-2 text-right tabular-nums">
                        {cell.pax ? cell.pax.toLocaleString("es-MX") : "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">
                        {cell.pax ? `${cell.share_pct}%` : "—"}
                      </td>
                    </Fragment>
                  ))}
                  <td className="py-2.5 text-right font-medium tabular-nums">
                    {row.total_pax.toLocaleString("es-MX")}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-zinc-200 font-semibold dark:border-zinc-700">
                <td className="py-2.5 pr-3">TOTAL</td>
                {data.year_totals.map((yt) => (
                  <Fragment key={yt.year}>
                    <td className="py-2.5 pr-2 text-right tabular-nums">
                      {yt.pax ? yt.pax.toLocaleString("es-MX") : "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">
                      {yt.pax ? "100%" : "—"}
                    </td>
                  </Fragment>
                ))}
                <td className="py-2.5 text-right tabular-nums">
                  {data.grand_total_pax.toLocaleString("es-MX")}
                </td>
              </tr>
            </tbody>
          </table>
      </div>
    </ViewSection>
  );
}
