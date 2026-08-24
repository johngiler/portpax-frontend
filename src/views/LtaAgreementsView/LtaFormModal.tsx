"use client";

import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import DefaultButton from "@/components/buttons/DefaultButton";
import LtaBookingWindowPanel from "@/components/lta/LtaBookingWindowPanel";
import LtaBookingPolicyGuideTable, {
  LtaBookingPolicyGuideToggle,
} from "@/components/lta/LtaBookingPolicyGuideTable";
import {
  FormField,
  FormFieldMultiSelect,
  FormFieldSelect,
} from "@/components/ui/FormField";
import FormSection from "@/components/ui/FormSection";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { submitModalForm } from "@/lib/apiFormErrors";
import { positionShortCode } from "@/lib/positionCode";
import { fetchPositions } from "@/services/catalogs/positionService";
import { fetchAllVessels } from "@/services/catalogs/vesselService";
import type { Port } from "@/types/catalog";
import type { ShippingLine, Vessel } from "@/types/cruise";
import {
  LTA_BOOKING_POLICY_OPTIONS,
  LTA_WEEKDAY_OPTIONS,
  type LongTermAgreement,
  type LongTermAgreementPayload,
  type LongTermAgreementSaveOptions,
  type LtaBookingPolicy,
} from "@/types/lta";

export type LtaFormMode = "create" | "edit";

export type LtaFormSubmitData = {
  payload: LongTermAgreementPayload;
  options?: LongTermAgreementSaveOptions;
};

type LtaFormModalProps = {
  open: boolean;
  mode: LtaFormMode;
  initial?: LongTermAgreement | null;
  ports: Port[];
  shippingLines: ShippingLine[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: LtaFormSubmitData) => Promise<void>;
};

type FormState = LongTermAgreementPayload;
type FieldErrors = Partial<Record<keyof FormState, string>>;

function emptyForm(): FormState {
  return {
    code: "",
    name: "",
    port: 0,
    shipping_line: 0,
    all_vessels: false,
    vessel_ids: [],
    position_ids: [],
    weekdays: [],
    interval_days: null,
    cadence_anchor: null,
    min_packs: null,
    advance_months_min: 18,
    advance_months_max: 32,
    booking_policy: "standard",
    lta_depth_blocks: 2,
    reserve_foreign_slots: true,
    valid_from: null,
    valid_until: null,
    is_active: true,
    notes: "",
  };
}

function toForm(row: LongTermAgreement): FormState {
  return {
    code: row.code,
    name: row.name,
    port: row.port,
    shipping_line: row.shipping_line,
    all_vessels: row.all_vessels,
    vessel_ids: row.vessel_ids,
    position_ids: row.position_ids,
    weekdays: row.weekdays,
    interval_days: row.interval_days,
    cadence_anchor: row.cadence_anchor,
    min_packs: row.min_packs,
    advance_months_min: row.advance_months_min,
    advance_months_max: row.advance_months_max,
    booking_policy: row.booking_policy ?? "standard",
    lta_depth_blocks: row.lta_depth_blocks ?? 2,
    reserve_foreign_slots: row.reserve_foreign_slots ?? true,
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    is_active: row.is_active,
    notes: row.notes,
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.port) errors.port = "Requerido";
  if (!form.shipping_line) errors.shipping_line = "Requerido";
  if (!form.all_vessels && form.vessel_ids.length === 0) {
    errors.vessel_ids = "Selecciona barcos o marca todos";
  }
  if (form.advance_months_min > form.advance_months_max) {
    errors.advance_months_min = "Debe ser ≤ máximo";
  }
  const hasInterval = form.interval_days != null && form.interval_days > 0;
  const hasAnchor = Boolean(form.cadence_anchor);
  if (hasInterval !== hasAnchor) {
    errors.interval_days = "Cadencia y fecha ancla van juntas";
    errors.cadence_anchor = "Cadencia y fecha ancla van juntas";
  }
  return errors;
}

export default function LtaFormModal({
  open,
  mode,
  initial,
  ports,
  shippingLines,
  saving,
  onClose,
  onSubmit,
}: LtaFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [positions, setPositions] = useState<{ id: number; code: string; port_code: string }[]>(
    [],
  );
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [removeContract, setRemoveContract] = useState(false);
  const [policyGuideOpen, setPolicyGuideOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? toForm(initial) : emptyForm());
    setErrors({});
    setSubmitError(null);
    setContractFile(null);
    setRemoveContract(false);
    setPolicyGuideOpen(false);
  }, [open, initial]);

  useEffect(() => {
    if (!open || !form.shipping_line) {
      setVessels([]);
      return;
    }
    let cancelled = false;
    fetchAllVessels({ shipping_line: form.shipping_line })
      .then((rows) => {
        if (!cancelled) setVessels(rows.filter((v) => v.is_active));
      })
      .catch(() => {
        if (!cancelled) setVessels([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, form.shipping_line]);

  useEffect(() => {
    if (!open || !form.port) {
      setPositions([]);
      return;
    }
    let cancelled = false;
    fetchPositions({ port: form.port, pageSize: 100 })
      .then((res) => {
        if (!cancelled) {
          setPositions(
            res.results
              .filter((p) => p.is_active && !p.is_combined)
              .map((p) => ({ id: p.id, code: p.code, port_code: p.port_code })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setPositions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, form.port]);

  const portOptions = useMemo(
    () => ports.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
    [ports],
  );
  const lineOptions = useMemo(
    () =>
      shippingLines.map((l) => ({
        value: l.id,
        label: l.name,
        logoUrl: l.logo ?? undefined,
      })),
    [shippingLines],
  );
  const vesselOptions = useMemo(
    () => vessels.map((v) => ({ value: v.id, label: v.name })),
    [vessels],
  );
  const positionOptions = useMemo(
    () =>
      positions.map((p) => ({
        value: p.id,
        label: positionShortCode(p.port_code, p.code),
      })),
    [positions],
  );

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "port") {
        next.position_ids = [];
      }
      if (key === "shipping_line") {
        next.vessel_ids = [];
        next.all_vessels = false;
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setSubmitError(null);

    await submitModalForm(
      () =>
        onSubmit({
          payload: {
            ...form,
            vessel_ids: form.all_vessels ? [] : form.vessel_ids,
            min_packs: form.min_packs || null,
            valid_from: form.valid_from || null,
            valid_until: form.valid_until || null,
          },
          options: {
            contractFile: contractFile ?? undefined,
            removeContract: removeContract || undefined,
          },
        }),
      {
        setSubmitError,
        fallback: "No se pudo guardar el acuerdo LTA.",
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title={mode === "create" ? "Nuevo acuerdo LTA" : "Editar acuerdo LTA"}
      panelClassName="max-w-7xl w-[min(96vw,80rem)]"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            Cancelar
          </button>
          <DefaultButton type="submit" form="lta-form" disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </DefaultButton>
        </div>
      }
    >
      <form id="lta-form" onSubmit={(e) => void handleSubmit(e)}>
        <ModalFormError message={submitError} />

        <div className="space-y-4">
          <FormSection
            title="Puerto y naviera"
            description="Alcance geográfico y titular del acuerdo."
          >
            <FormFieldSelect<number>
              label="Puerto"
              name="lta_port"
              value={form.port}
              onChange={(v) => patch("port", v)}
              options={portOptions}
              emptyValue={0}
              required
              error={errors.port}
            />
            <FormFieldSelect<number>
              label="Naviera"
              name="lta_line"
              value={form.shipping_line}
              onChange={(v) => patch("shipping_line", v)}
              options={lineOptions}
              emptyValue={0}
              showLogo
              logoKind="shipping_line"
              required
              error={errors.shipping_line}
            />
          </FormSection>

          <FormSection
            title="Slots operativos"
            description="Barcos, posiciones y días cubiertos por el contrato."
            columns={1}
          >
            <label className="-mt-1 mb-1 flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={form.all_vessels}
                onChange={(e) => patch("all_vessels", e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
              />
              Todos los barcos de la naviera
            </label>
            {!form.all_vessels ? (
              <FormFieldMultiSelect<number>
                label="Barcos"
                name="lta_vessels"
                value={form.vessel_ids}
                onChange={(v) => patch("vessel_ids", v)}
                options={vesselOptions}
                error={errors.vessel_ids}
              />
            ) : null}
            <FormFieldMultiSelect<number>
              label="Posiciones"
              name="lta_positions"
              value={form.position_ids}
              onChange={(v) => patch("position_ids", v)}
              options={positionOptions}
              placeholder="Opcional — ej. P1"
            />
            <FormFieldMultiSelect<number>
              label="Días de la semana"
              name="lta_weekdays"
              value={form.weekdays}
              onChange={(v) => patch("weekdays", v)}
              options={LTA_WEEKDAY_OPTIONS}
              placeholder="Vacío = todos los días"
            />
          </FormSection>

          <FormSection
            title="Cadencia"
            description="Ritmo de escalas (ej. MSC cada 15 días desde una fecha ancla). Vacío = sin filtro."
          >
            <FormField
              label="Cadencia (días)"
              name="lta_interval_days"
              type="number"
              min={1}
              value={form.interval_days != null ? String(form.interval_days) : ""}
              onChange={(v) => {
                const raw = String(v).trim();
                patch("interval_days", raw === "" ? null : Number(raw) || null);
              }}
              placeholder="Ej. 15"
              error={errors.interval_days}
            />
            <FormField
              label="Fecha ancla"
              name="lta_cadence_anchor"
              type="date"
              value={form.cadence_anchor ?? ""}
              onChange={(v) => patch("cadence_anchor", String(v) || null)}
              error={errors.cadence_anchor}
            />
          </FormSection>

          <FormSection
            title="Mapa de bloques"
            description="Elige hasta qué bloque de zona LTA cubre el acuerdo (desde el primero LTA). Luego fija vigencia y política."
            columns={1}
          >
            <LtaBookingWindowPanel
              validFrom={form.valid_from}
              validUntil={form.valid_until}
              bookingPolicy={form.booking_policy}
              ltaDepthBlocks={form.lta_depth_blocks}
              onDepthChange={(depth) => patch("lta_depth_blocks", depth)}
            />
          </FormSection>

          <FormSection
            title="Política y vigencia"
            description="Vigencia del contrato comercial. La política define cómo se usan los bloques LTA seleccionados."
          >
            <div className="sm:col-span-2">
              <FormFieldSelect<LtaBookingPolicy>
                label="Política de ventana"
                name="lta_booking_policy"
                value={form.booking_policy}
                onChange={(v) => patch("booking_policy", v)}
                options={LTA_BOOKING_POLICY_OPTIONS}
                labelEnd={
                  <LtaBookingPolicyGuideToggle
                    open={policyGuideOpen}
                    onToggle={() => setPolicyGuideOpen((v) => !v)}
                  />
                }
              />
            </div>
            {policyGuideOpen ? (
              <div className="sm:col-span-2">
                <LtaBookingPolicyGuideTable />
              </div>
            ) : null}
            <FormField
              label="Vigente desde"
              name="lta_from"
              type="date"
              value={form.valid_from ?? ""}
              onChange={(v) => patch("valid_from", String(v) || null)}
            />
            <FormField
              label="Vigente hasta"
              name="lta_until"
              type="date"
              value={form.valid_until ?? ""}
              onChange={(v) => patch("valid_until", String(v) || null)}
            />
            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={form.reserve_foreign_slots}
                  onChange={(e) => patch("reserve_foreign_slots", e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
                />
                Reservar slot (día + posición) frente a otras navieras en zona LTA
              </label>
            </div>
          </FormSection>

          <FormSection title="Contrato" description="Compromiso comercial y adjunto." columns={1}>
            <FormField
              label="Mínimo de PAX"
              name="lta_min_pax"
              type="number"
              value={form.min_packs != null ? String(form.min_packs) : ""}
              onChange={(v) => {
                const raw = String(v).trim();
                patch("min_packs", raw ? Number(raw) : null);
              }}
            />
            <div>
              <label
                htmlFor="lta_contract"
                className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
              >
                Archivo (PDF / DOC, opcional)
              </label>
              {initial?.contract_file_url && !removeContract && !contractFile ? (
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                  <a
                    href={initial.contract_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--admin-accent)] hover:underline"
                  >
                    {initial.contract_file_name ?? "Ver contrato"}
                  </a>
                  <ConfirmDeleteButton
                    deleteLabel="el archivo del contrato"
                    onDelete={() => setRemoveContract(true)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    ariaLabel="Quitar contrato"
                    title="Quitar contrato"
                  />
                </div>
              ) : null}
              {contractFile ? (
                <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">
                  Nuevo archivo:{" "}
                  <span className="font-medium">{contractFile.name}</span>
                </p>
              ) : null}
              {removeContract && !contractFile ? (
                <p className="mb-2 text-xs text-amber-700 dark:text-amber-400">
                  El contrato actual se eliminará al guardar.
                </p>
              ) : null}
              <input
                id="lta_contract"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setContractFile(file);
                  if (file) setRemoveContract(false);
                }}
                className="block w-full cursor-pointer text-sm text-zinc-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[var(--admin-accent)]/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--admin-accent)]"
              />
            </div>
            <FormField
              label="Notas"
              name="lta_notes"
              value={form.notes}
              onChange={(v) => patch("notes", String(v))}
            />
          </FormSection>

          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/30">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => patch("is_active", e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
              />
              Acuerdo activo
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
