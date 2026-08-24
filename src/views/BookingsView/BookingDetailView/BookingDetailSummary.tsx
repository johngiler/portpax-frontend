"use client";

import { Anchor, CalendarDays, MapPin, Pencil, Ship } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DefaultButton from "@/components/buttons/DefaultButton";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import {
  useActivePortsCatalog,
  useActiveShippingLinesCatalog,
  useActiveVesselsCatalog,
} from "@/hooks/swr/useCatalogs";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { sanitizeReturnTo } from "@/lib/safeReturnTo";
import { updateBooking } from "@/services/bookings/bookingService";
import { bookingDetailHref, type Booking } from "@/types/booking";
import { portDisplayName } from "@/types/catalog";

type SummaryItemProps = {
  icon: typeof MapPin;
  label: string;
  children: ReactNode;
};

function SummaryItem({ icon: Icon, label, children }: SummaryItemProps) {
  return (
    <div className="flex gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {children}
        </div>
      </div>
    </div>
  );
}

type BookingDetailSummaryProps = {
  booking: Booking;
  canWrite?: boolean;
  onUpdated: (booking: Booking) => void;
};

export default function BookingDetailSummary({
  booking,
  canWrite = true,
  onUpdated,
}: BookingDetailSummaryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));

  const [editing, setEditing] = useState(false);
  const [portId, setPortId] = useState(booking.port);
  const [lineId, setLineId] = useState(booking.shipping_line);
  const [vesselId, setVesselId] = useState(booking.vessel);
  const [vesselName, setVesselName] = useState(booking.vessel_name);
  const [callDate, setCallDate] = useState(booking.call_date);
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { ports } = useActivePortsCatalog(editing);
  const { lines } = useActiveShippingLinesCatalog(editing);
  const { vessels, isLoading: vesselsLoading } = useActiveVesselsCatalog(lineId, editing);

  const groupId = booking.shipping_line_group;

  useEffect(() => {
    if (editing) return;
    setPortId(booking.port);
    setLineId(booking.shipping_line);
    setVesselId(booking.vessel);
    setVesselName(booking.vessel_name);
    setCallDate(booking.call_date);
    setNotes(booking.notes ?? "");
  }, [booking, editing]);

  useEffect(() => {
    if (!editing || !lineId || vesselsLoading) return;
    if (vessels.some((vessel) => vessel.id === vesselId)) return;
    const needle = vesselName.trim().toLowerCase();
    const match = vessels.find(
      (vessel) => vessel.name.trim().toLowerCase() === needle,
    );
    setVesselId(match?.id ?? 0);
  }, [editing, lineId, vessels, vesselsLoading, vesselId, vesselName]);

  const portOptions = useMemo(
    () =>
      ports.map((p) => ({
        value: p.id,
        label: portDisplayName(p),
        logoUrl: p.logo,
      })),
    [ports],
  );

  const lineOptions = useMemo(() => {
    const sameGroup = lines.filter((line) =>
      groupId != null ? line.group === groupId : line.id === booking.shipping_line,
    );
    if (!sameGroup.some((line) => line.id === booking.shipping_line)) {
      sameGroup.unshift({
        id: booking.shipping_line,
        code: booking.shipping_line_code,
        name: booking.shipping_line_name,
        group: groupId ?? 0,
        group_name: "",
        logo: booking.shipping_line_logo,
        is_active: true,
        vessel_count: 0,
        created_at: "",
        updated_at: "",
      });
    }
    return sameGroup.map((line) => ({
      value: line.id,
      label: line.name,
      logoUrl: line.logo,
    }));
  }, [lines, groupId, booking]);

  const vesselOptions = useMemo(() => {
    const opts = vessels.map((v) => ({
      value: v.id,
      label: v.name,
      logoUrl: v.logo,
    }));
    if (
      vesselId === booking.vessel &&
      lineId === booking.shipping_line &&
      !opts.some((o) => o.value === booking.vessel)
    ) {
      opts.unshift({
        value: booking.vessel,
        label: booking.vessel_name,
        logoUrl: booking.vessel_logo,
      });
    }
    return opts;
  }, [vessels, vesselId, lineId, booking]);

  const readOnly = !canWrite || booking.status === "c";

  function startEdit() {
    setFormError(null);
    setFieldErrors({});
    setPortId(booking.port);
    setLineId(booking.shipping_line);
    setVesselId(booking.vessel);
    setVesselName(booking.vessel_name);
    setCallDate(booking.call_date);
    setNotes(booking.notes ?? "");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setFormError(null);
    setFieldErrors({});
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!portId) next.port = "Selecciona un puerto.";
    if (!lineId) next.line = "Selecciona una naviera.";
    if (!vesselId) next.vessel = "Selecciona un barco.";
    if (!callDate) next.callDate = "Indica la fecha de escala.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setFormError(null);
    try {
      const updated = await updateBooking(booking.id, {
        port: portId,
        shipping_line: lineId,
        vessel: vesselId,
        call_date: callDate,
        notes,
      });
      onUpdated(updated);
      setEditing(false);
      if (updated.booking_code !== booking.booking_code) {
        router.replace(
          bookingDetailHref(updated, { returnTo }),
        );
      }
    } catch (err) {
      setFormError(
        getApiErrorMessage(
          err,
          "No se pudo actualizar el detalle de la escala.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Detalle de escala
        </h2>
        {!readOnly && !editing ? (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
            Editar
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-4 space-y-4">
          {formError ? <FormErrorAlert message={formError} /> : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <FormFieldSelect<number>
              label="Puerto"
              name="booking_identity_port"
              value={portId}
              onChange={setPortId}
              options={portOptions}
              error={fieldErrors.port}
              compact
              showLogo
              logoKind="port"
              required
            />
            <FormFieldSelect<number>
              label="Naviera"
              name="booking_identity_line"
              value={lineId}
              onChange={(id) => {
                setLineId(id);
              }}
              options={lineOptions}
              error={fieldErrors.line}
              compact
              showLogo
              logoKind="shipping_line"
              required
            />
            <FormFieldSelect<number>
              label="Barco"
              name="booking_identity_vessel"
              value={vesselId}
              onChange={(id) => {
                const selected = vessels.find((vessel) => vessel.id === id);
                setVesselId(id);
                if (selected) setVesselName(selected.name);
              }}
              options={vesselOptions}
              error={fieldErrors.vessel}
              compact
              showLogo
              logoKind="vessel"
              required
              disabled={!lineId}
            />
            <FormField
              label="Fecha de escala"
              name="booking_identity_date"
              type="date"
              value={callDate}
              onChange={setCallDate}
              error={fieldErrors.callDate}
              compact
              required
            />
          </div>
          <div>
            <label
              htmlFor="booking_identity_notes"
              className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
            >
              Notas
            </label>
            <textarea
              id="booking_identity_notes"
              name="booking_identity_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-[var(--admin-border)] bg-gradient-to-b from-white to-[var(--admin-surface-muted)] px-3 py-2 text-xs text-zinc-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] focus:border-[var(--admin-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 dark:border-zinc-700/70 dark:from-zinc-900 dark:to-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={cancelEdit}
              className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              Cancelar
            </button>
            <DefaultButton
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? "Guardando…" : "Guardar"}
            </DefaultButton>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <SummaryItem icon={MapPin} label="Puerto">
              <div className="flex items-center gap-2">
                <CatalogLogoThumb
                  src={booking.port_logo}
                  alt=""
                  size="xs"
                  kind="port"
                />
                <span className="truncate">{booking.port_name}</span>
              </div>
              <p className="mt-0.5 text-xs font-normal text-zinc-500">
                {booking.port_code}
              </p>
            </SummaryItem>
            <SummaryItem icon={Anchor} label="Naviera">
              <div className="flex items-center gap-2">
                <CatalogLogoThumb
                  src={booking.shipping_line_logo}
                  alt=""
                  size="xs"
                  kind="shipping_line"
                />
                <span className="truncate">{booking.shipping_line_name}</span>
              </div>
              <p className="mt-0.5 text-xs font-normal text-zinc-500">
                {booking.shipping_line_code}
              </p>
            </SummaryItem>
            <SummaryItem icon={Ship} label="Barco">
              <div className="flex items-center gap-2">
                <CatalogLogoThumb
                  src={booking.vessel_logo}
                  alt=""
                  size="xs"
                  kind="vessel"
                />
                <span className="truncate">{booking.vessel_name}</span>
              </div>
              {booking.vessel_loa_m ? (
                <p className="mt-0.5 text-xs font-normal text-zinc-500">
                  {Number(booking.vessel_loa_m).toLocaleString("es-MX")} m
                </p>
              ) : null}
            </SummaryItem>
            <SummaryItem icon={CalendarDays} label="Fecha de escala">
              <span>{formatIsoDateLabel(booking.call_date, "long")}</span>
              {booking.position_code ? (
                <p className="mt-0.5 text-xs font-normal text-zinc-500">
                  Posición {booking.position_code}
                </p>
              ) : null}
            </SummaryItem>
          </div>

          {booking.notes ? (
            <div className="mt-4 rounded-xl border border-zinc-200/80 bg-zinc-50/40 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950/30">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Notas
              </p>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                {booking.notes}
              </p>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
