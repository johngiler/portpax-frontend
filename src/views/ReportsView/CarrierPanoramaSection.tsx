"use client";

import { Fragment } from "react";
import ViewSection from "@/components/layout/ViewSection";
import EmptyState from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";
import type { CarrierPanoramaReport } from "@/services/bookings/bookingService";

type Props = {
  data: CarrierPanoramaReport;
  onClearFilters?: () => void;
};

export default function CarrierPanoramaSection({
  data,
  onClearFilters,
}: Props) {
  if (data.ports.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        filtered
        title="Sin calls de esta naviera"
        description={`No hay escalas de ${data.shipping_line.name} en el rango seleccionado. Ajusta las fechas o la naviera.`}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <div className="space-y-4">
      <ViewSection
        icon={FileText}
        title={`Panorama — ${data.shipping_line.name}`}
        description={data.note}
      >
        <div className="overflow-x-auto px-5 py-4 sm:px-6">
          <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-zinc-500">
                  <th className="py-2 pr-3">Puerto</th>
                  {data.years.map((y) => (
                    <th key={y} className="py-2 pr-3 text-right" colSpan={2}>
                      {y}
                    </th>
                  ))}
                  <th className="py-2 pr-3 text-right">Calls</th>
                  <th className="py-2 text-right">PAX</th>
                </tr>
                <tr className="text-[10px] uppercase tracking-wide text-zinc-400">
                  <th className="py-1 pr-3" />
                  {data.years.map((y) => (
                    <Fragment key={y}>
                      <th className="py-1 pr-2 text-right">Calls</th>
                      <th className="py-1 pr-3 text-right">Pax</th>
                    </Fragment>
                  ))}
                  <th className="py-1 pr-3" />
                  <th className="py-1" />
                </tr>
              </thead>
              <tbody>
                {data.ports.map((row) => (
                  <tr
                    key={row.port_id}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="py-2.5 pr-3">{row.name}</td>
                    {row.by_year.map((cell) => (
                      <Fragment key={`${row.port_id}-${cell.year}`}>
                        <td className="py-2.5 pr-2 text-right tabular-nums">
                          {cell.calls || "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          {cell.pax ? cell.pax.toLocaleString("es-MX") : "—"}
                        </td>
                      </Fragment>
                    ))}
                    <td className="py-2.5 pr-3 text-right font-medium tabular-nums">
                      {row.total_calls}
                    </td>
                    <td className="py-2.5 text-right font-medium tabular-nums">
                      {row.total_pax.toLocaleString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </ViewSection>
    </div>
  );
}
