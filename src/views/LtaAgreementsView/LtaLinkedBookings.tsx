"use client";

import { useMemo, useRef, useState } from "react";
import { Anchor, CalendarRange, ExternalLink, Gauge, Scale } from "lucide-react";
import Link from "next/link";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FormFieldSelect } from "@/components/ui/FormField";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { useLtaLinkedBookings } from "@/hooks/swr/useLtaLinkedBookings";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  BOOKING_DETAIL_LINK_PROPS,
  bookingDetailHref,
  type BookingListItem,
} from "@/types/booking";
import {
  LTA_BOOKING_POLICY_OPTIONS,
  type LtaDateException,
  type LongTermAgreement,
} from "@/types/lta";
import LtaRuleSetChips from "./LtaRuleSetChips";

const RETURN_TO = "/lta";

type OriginFilter = "all" | "rule" | "extra";

const ORIGIN_FILTER_OPTIONS: { value: OriginFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "rule", label: "Según acuerdo" },
  { value: "extra", label: "Extra" },
];

function extraDateSet(exceptions: LtaDateException[] | undefined): Set<string> {
  const out = new Set<string>();
  for (const item of exceptions ?? []) {
    if (item.kind === "include") out.add(item.date);
  }
  return out;
}

function bookingIsExtra(
  booking: BookingListItem,
  extras: Set<string>,
): boolean {
  return extras.has(booking.call_date);
}

function MetaChip({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Anchor;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-xl border border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50/90 px-3 py-2 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950/60">
      {Icon ? (
        <Icon
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--admin-accent)]"
          strokeWidth={2}
          aria-hidden
        />
      ) : null}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          {label}
        </p>
        <p
          className="mt-0.5 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50"
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

type LtaLinkedBookingsProps = {
  agreement: LongTermAgreement;
  /** Only fetch while the accordion row is open. */
  active: boolean;
  canWrite?: boolean;
  generateBusy?: boolean;
  onGenerate?: () => void;
  onRegenerate?: () => void;
  onOpenExceptions?: () => void;
};

export default function LtaLinkedBookings({
  agreement,
  active,
  canWrite = false,
  generateBusy = false,
  onGenerate,
  onRegenerate,
  onOpenExceptions,
}: LtaLinkedBookingsProps) {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const [originFilter, setOriginFilter] = useState<OriginFilter>("all");
  const {
    bookings,
    totalCount,
    hasMore,
    isLoading,
    loadingMore,
    error,
    loadMore,
  } = useLtaLinkedBookings(agreement.id, active);

  const extras = useMemo(
    () => extraDateSet(agreement.date_exceptions),
    [agreement.date_exceptions],
  );

  const filtered = useMemo(() => {
    if (originFilter === "all") return bookings;
    if (originFilter === "extra") {
      return bookings.filter((b) => bookingIsExtra(b, extras));
    }
    return bookings.filter((b) => !bookingIsExtra(b, extras));
  }, [bookings, extras, originFilter]);

  const extraCount = useMemo(
    () => bookings.filter((b) => bookingIsExtra(b, extras)).length,
    [bookings, extras],
  );
  const ruleCount = bookings.length - extraCount;
  const exceptionCount = agreement.date_exceptions?.length ?? 0;
  const hasGenerated = Boolean(agreement.bookings_generated);

  const anchorIso = agreement.cadence_anchor?.slice(0, 10) || null;
  const policyLabel =
    LTA_BOOKING_POLICY_OPTIONS.find((o) => o.value === agreement.booking_policy)
      ?.label ?? agreement.booking_policy;
  const depth = Math.max(1, Number(agreement.lta_depth_blocks) || 1);
  const validityLabel = [
    agreement.valid_from
      ? formatIsoDateLabel(agreement.valid_from, "short")
      : "—",
    agreement.valid_until
      ? formatIsoDateLabel(agreement.valid_until, "short")
      : "—",
  ].join(" → ");

  const errorMessage = error
    ? getApiErrorMessage(error, "No se pudieron cargar las reservas vinculadas.")
    : null;

  const countLabel =
    !isLoading && !errorMessage ? ` (${totalCount})` : "";

  return (
    <div className="mt-4 rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-950/30">
      <div className="mb-4 flex flex-wrap items-start gap-x-3 gap-y-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-700">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Reservas del acuerdo
            <span className="font-medium text-zinc-500">{countLabel}</span>
          </h3>
          <div className="mt-2 flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
              Se generan a partir del set de reglas:
            </span>
            <LtaRuleSetChips agreement={agreement} />
          </div>
        </div>
        {canWrite ? (
          <div className="flex shrink-0 flex-wrap gap-3 sm:ml-auto">
            <button
              type="button"
              disabled={!onOpenExceptions}
              onClick={onOpenExceptions}
              className={[
                "inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100",
                !onOpenExceptions
                  ? "cursor-not-allowed opacity-40 shadow-none"
                  : "cursor-pointer hover:bg-zinc-50 hover:shadow-[0_8px_22px_-14px_rgba(15,23,42,0.35)] dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              Excepciones
              {exceptionCount > 0 ? (
                <span className="rounded-full bg-[var(--admin-accent)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--admin-accent)]">
                  {exceptionCount}
                </span>
              ) : null}
            </button>
            {!hasGenerated ? (
              <DefaultButton
                type="button"
                disabled={generateBusy || !onGenerate}
                onClick={onGenerate}
              >
                {generateBusy ? "En cola…" : "Generar"}
              </DefaultButton>
            ) : (
              <DefaultButton
                type="button"
                disabled={generateBusy || !onRegenerate}
                onClick={onRegenerate}
              >
                {generateBusy ? "En cola…" : "Regenerar"}
              </DefaultButton>
            )}
          </div>
        ) : null}
      </div>

      <div className="mb-4 space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <MetaChip
            icon={CalendarRange}
            label="Vigencia"
            value={validityLabel}
          />
          <MetaChip
            icon={Scale}
            label="Política de ventana"
            value={policyLabel}
          />
          <MetaChip
            icon={Gauge}
            label="Profundidad LTA"
            value={`${depth} ${depth === 1 ? "bloque" : "bloques"}`}
          />
          <MetaChip
            icon={Anchor}
            label="Fecha ancla"
            value={
              anchorIso
                ? formatIsoDateLabel(anchorIso, "short")
                : "Sin ancla"
            }
          />
        </div>

        {!isLoading && bookings.length > 0 ? (
          <div className="flex justify-end">
            <div className="flex flex-nowrap items-center gap-2">
              <label
                htmlFor={`lta_origin_${agreement.id}`}
                className="shrink-0 whitespace-nowrap text-xs font-medium text-zinc-700 dark:text-zinc-200"
              >
                Tipo de regla
              </label>
              <div className="w-40 shrink-0 [&_.mb-3]:mb-0">
                <FormFieldSelect<OriginFilter>
                  label=""
                  name={`lta_origin_${agreement.id}`}
                  value={originFilter}
                  onChange={setOriginFilter}
                  options={ORIGIN_FILTER_OPTIONS}
                  compact
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Cargando reservas…</p>
      ) : errorMessage ? (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm font-normal text-zinc-400">
          Ninguna reserva asignada todavía (se asigna al crear o al pasar a LTA /
          Confirmada LTA).
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm font-normal text-zinc-400">
          {originFilter === "extra"
            ? "Ninguna reserva extra en lo cargado."
            : "Ninguna reserva según acuerdo en lo cargado."}
          {hasMore ? " Carga más para seguir buscando." : null}
        </p>
      ) : (
        <div
          ref={scrollRootRef}
          className="max-h-80 overflow-y-auto overscroll-contain pr-0.5"
        >
          {originFilter !== "all" ? (
            <p className="mb-2 text-[11px] text-zinc-500">
              Mostrando {filtered.length} de {bookings.length} cargadas
              {originFilter === "extra"
                ? ` · ${extraCount} extra`
                : ` · ${ruleCount} según acuerdo`}
              {hasMore ? " (hay más en el acuerdo)" : ""}
            </p>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-[1] bg-white text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
                <tr className="border-b border-zinc-200/80 dark:border-zinc-700">
                  <th className="px-1.5 py-2 font-semibold">Reserva</th>
                  <th className="px-1.5 py-2 font-semibold">Fecha</th>
                  <th className="px-1.5 py-2 font-semibold">Set de reglas</th>
                  <th className="px-1.5 py-2 font-semibold">Tipo de regla</th>
                  <th className="px-1.5 py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => {
                  const isExtra = bookingIsExtra(booking, extras);
                  const isAnchor =
                    Boolean(anchorIso) && booking.call_date === anchorIso;
                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                    >
                      <td className="px-1.5 py-2.5 align-middle">
                        <Link
                          href={bookingDetailHref(booking, {
                            returnTo: RETURN_TO,
                          })}
                          {...BOOKING_DETAIL_LINK_PROPS}
                          className="group inline-flex min-w-0 max-w-[16rem] items-center gap-1.5 font-semibold text-[var(--admin-accent)] hover:underline"
                        >
                          <span className="truncate">{booking.booking_code}</span>
                          <ExternalLink
                            className="h-3 w-3 shrink-0 opacity-60"
                            strokeWidth={2}
                          />
                        </Link>
                      </td>
                      <td
                        className={`whitespace-nowrap px-1.5 py-2.5 align-middle ${
                          isExtra
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-zinc-600 dark:text-zinc-300"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {isAnchor ? (
                            <span
                              className="inline-flex text-[var(--admin-accent)]"
                              title="Fecha ancla de cadencia del acuerdo"
                              aria-label="Fecha ancla de cadencia del acuerdo"
                            >
                              <Anchor className="h-3.5 w-3.5" strokeWidth={2} />
                            </span>
                          ) : null}
                          {formatIsoDateLabel(booking.call_date, "short")}
                        </span>
                      </td>
                      <td className="max-w-[18rem] px-1.5 py-2.5 align-middle">
                        <LtaRuleSetChips
                          agreement={agreement}
                          vesselName={booking.vessel_name}
                          positionCode={booking.position_code}
                        />
                      </td>
                      <td className="px-1.5 py-2.5 align-middle">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isExtra
                              ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                              : "bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]"
                          }`}
                        >
                          {isExtra ? "Extra" : "Según acuerdo"}
                        </span>
                      </td>
                      <td className="px-1.5 py-2.5 align-middle">
                        <BookingStatusBadge status={booking.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <InfiniteScrollFooter
            hasMore={hasMore}
            loading={loadingMore}
            onLoadMore={loadMore}
            loadedCount={bookings.length}
            totalCount={totalCount}
            itemLabel="reservas"
            scrollRootRef={scrollRootRef}
            className="mt-3 sm:mt-4"
          />
        </div>
      )}
    </div>
  );
}
