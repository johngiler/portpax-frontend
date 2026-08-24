"use client";

import { useMemo, useRef } from "react";
import { Ship } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import EmptyState from "@/components/ui/EmptyState";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import Skeleton from "@/components/ui/Skeleton";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { useFirstMatchingCallDate } from "@/hooks/swr/useFirstMatchingCallDate";
import {
  useVesselProximityInfinite,
  type VesselProximityListFilters,
} from "@/hooks/swr/useVesselProximityInfinite";
import type { VesselProximityMatrixCell } from "@/services/bookings/vesselProximityMatrixService";
import type { BookingStatusFilterValue } from "@/types/booking";
import {
  BOOKINGS_FILTERED_EMPTY_DESCRIPTION,
  BOOKINGS_FILTERED_EMPTY_TITLE,
} from "./bookingsEmptyCopy";
import FilteredResultsFromHint from "./FilteredResultsFromHint";
import ProximityMatrixCallCard from "./ProximityMatrixCallCard";

type BookingsVesselProximityPanelProps = {
  shippingLineId: number;
  vesselId: number;
  dateFrom?: string;
  dateTo?: string;
  portId: number;
  statuses: BookingStatusFilterValue[];
  conflictFilters?: Pick<
    VesselProximityListFilters,
    "has_conflict" | "conflict_severity" | "conflict_type"
  >;
  callDates?: string[] | null;
  returnTo: string;
  onClearFilters?: () => void;
};

export default function BookingsVesselProximityPanel({
  shippingLineId,
  vesselId,
  dateFrom,
  dateTo,
  portId,
  statuses,
  conflictFilters = {},
  callDates = null,
  returnTo,
  onClearFilters,
}: BookingsVesselProximityPanelProps) {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const filtersReady = shippingLineId > 0 && vesselId > 0;

  const listFilters = useMemo(
    (): VesselProximityListFilters => ({
      port: portId > 0 ? portId : undefined,
      statuses: statuses.length > 0 ? statuses : undefined,
      ...conflictFilters,
      call_dates: callDates?.length ? callDates : undefined,
    }),
    [portId, statuses, conflictFilters, callDates],
  );

  const {
    data,
    matchedDays,
    loadedDays,
    hasMore,
    isLoading,
    loadingMore,
    error,
    loadMore,
  } = useVesselProximityInfinite(
    vesselId,
    dateFrom,
    dateTo,
    filtersReady && Boolean(dateFrom && dateTo),
    listFilters,
  );

  const proximityEmpty =
    filtersReady &&
    !isLoading &&
    Boolean(dateFrom && dateTo) &&
    (!data || (data.cells.length === 0 && !hasMore));

  const { firstDate: proximityFirstDate } = useFirstMatchingCallDate(
    {
      vessel: vesselId > 0 ? vesselId : undefined,
      shipping_line: shippingLineId > 0 ? shippingLineId : undefined,
      port: portId > 0 ? portId : undefined,
      statuses: statuses.length > 0 ? statuses : undefined,
      ...conflictFilters,
      call_dates: callDates?.length ? callDates : undefined,
    },
    proximityEmpty,
  );

  const cellMap = useMemo(() => {
    const map = new Map<string, VesselProximityMatrixCell[]>();
    if (!data) return map;
    for (const cell of data.cells) {
      const key = `${cell.date}:${cell.port_id}`;
      const bucket = map.get(key) ?? [];
      bucket.push(cell);
      map.set(key, bucket);
    }
    return map;
  }, [data]);

  if (!filtersReady) {
    return (
      <ViewSection
        icon={Ship}
        title="Proximidad barco / puerto"
        description="Selecciona naviera y barco en el panel de filtros y pulsa Aplicar."
      >
        <EmptyState
          icon={Ship}
          title="Faltan naviera y barco"
          description="La naviera y el barco son obligatorios para esta vista."
        />
      </ViewSection>
    );
  }

  if (!dateFrom || !dateTo) {
    return (
      <ViewSection
        icon={Ship}
        title="Proximidad barco / puerto"
        description="Ajusta el rango de fechas en el panel de filtros."
      >
        <EmptyState
          icon={Ship}
          title="Sin rango de fechas"
          description="Ajusta el rango de fechas en el panel de filtros."
        />
      </ViewSection>
    );
  }

  if (isLoading) {
    return (
      <ViewSection icon={Ship} title="Proximidad barco / puerto" description="Cargando matriz…">
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      </ViewSection>
    );
  }

  if (error) {
    return (
      <ViewSection
        icon={Ship}
        title="Proximidad barco / puerto"
        description="No se pudo cargar la matriz de proximidad."
      >
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          No se pudo cargar la matriz. Revisa barco, fechas y permisos de puerto.
        </div>
      </ViewSection>
    );
  }

  const rangeLabel = `${formatIsoDateLabel(dateFrom)} → ${formatIsoDateLabel(dateTo)}`;
  const vesselLabel = data?.vessel_name ?? "Barco";
  const dateRowCount = data?.dates.length ?? 0;
  const matrixScrollClassName =
    dateRowCount > 3
      ? "max-h-[min(42rem,85vh)] overflow-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800"
      : "overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800";

  if (!data || (data.cells.length === 0 && !hasMore)) {
    return (
      <ViewSection
        icon={Ship}
        title="Proximidad barco / puerto"
        description={`${vesselLabel} · ${rangeLabel}`}
      >
        {proximityFirstDate ? (
          <FilteredResultsFromHint
            firstDate={proximityFirstDate}
            className="mb-4"
          />
        ) : (
          <EmptyState
            icon={Ship}
            filtered
            title={BOOKINGS_FILTERED_EMPTY_TITLE}
            description={BOOKINGS_FILTERED_EMPTY_DESCRIPTION}
            onClearFilters={onClearFilters}
          />
        )}
      </ViewSection>
    );
  }

  return (
    <ViewSection
      icon={Ship}
      title="Proximidad barco / puerto"
      description={`${data.vessel_name} · ${data.cells.length} escala${data.cells.length === 1 ? "" : "s"} · ${rangeLabel}`}
    >
      <div ref={scrollRootRef} className={matrixScrollClassName}>
        <table
          className="w-full table-fixed border-separate border-spacing-0 text-left"
          style={{ minWidth: `${136 + data.ports.length * 208}px` }}
        >
          <colgroup>
            <col style={{ width: "136px" }} />
            {data.ports.map((port) => (
              <col key={port.id} style={{ width: "208px" }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-30">
            <tr>
              <th className="sticky left-0 z-40 border-b border-r border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Fecha
                </span>
              </th>
              {data.ports.map((port) => (
                <th
                  key={port.id}
                  className="border-b border-r border-zinc-200 bg-zinc-50 px-2 py-2.5 last:border-r-0 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {port.name}
                    </span>
                    {port.code ? (
                      <p className="mt-1 truncate text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        {port.code}
                      </p>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.dates.map((isoDate) => (
              <tr key={isoDate} className="group">
                <td className="sticky left-0 z-20 border-b border-r border-zinc-200 bg-white px-3 py-3 align-top group-last:border-b-0 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="block whitespace-nowrap text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatIsoDateLabel(isoDate, "short")}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] text-zinc-400">
                    {isoDate}
                  </span>
                </td>
                {data.ports.map((port) => {
                  const cells = cellMap.get(`${isoDate}:${port.id}`) ?? [];
                  return (
                    <td
                      key={port.id}
                      className="border-b border-r border-zinc-200 bg-zinc-50/40 p-2 align-top last:border-r-0 group-last:border-b-0 dark:border-zinc-800 dark:bg-zinc-950/30"
                    >
                      {cells.length === 0 ? null : (
                        <div className="space-y-2">
                          {cells.map((cell) => (
                            <ProximityMatrixCallCard
                              key={cell.booking_id}
                              cell={cell}
                              returnTo={returnTo}
                              spacious={dateRowCount > 3}
                            />
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <InfiniteScrollFooter
          hasMore={hasMore}
          loading={loadingMore}
          onLoadMore={loadMore}
          loadedCount={loadedDays}
          totalCount={matchedDays}
          itemLabel="días con proximidad"
          scrollRootRef={scrollRootRef}
          rootMargin="120px 0px"
          className="mt-0 border-t border-zinc-200/80 py-3 dark:border-zinc-800"
        />
      </div>
    </ViewSection>
  );
}
