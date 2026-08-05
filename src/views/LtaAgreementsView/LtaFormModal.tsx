"use client";

import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import DefaultButton from "@/components/buttons/DefaultButton";
import {
  FormField,
  FormFieldMultiSelect,
  FormFieldSelect,
} from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { submitModalForm } from "@/lib/apiFormErrors";
import { positionShortCode } from "@/lib/positionCode";
import { fetchPositions } from "@/services/catalogs/positionService";
import { fetchAllVessels } from "@/services/catalogs/vesselService";
import type { Port } from "@/types/catalog";
import type { ShippingLine, Vessel } from "@/types/cruise";
import {
  LTA_WEEKDAY_OPTIONS,
  type LongTermAgreement,
  type LongTermAgreementPayload,
  type LongTermAgreementSaveOptions,
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
    all_vessels: true,
    vessel_ids: [],
    position_ids: [],
    weekdays: [],
    interval_days: null,
    cadence_anchor: null,
    min_packs: null,
    advance_months_min: 18,
    advance_months_max: 32,
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
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    is_active: row.is_active,
    notes: row.notes,
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.code.trim()) errors.code = "Requerido";
  if (!form.name.trim()) errors.name = "Requerido";
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

  useEffect(() => {
    if (!open) return;
    setForm(initial ? toForm(initial) : emptyForm());
    setErrors({});
    setSubmitError(null);
    setContractFile(null);
    setRemoveContract(false);
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
        next.all_vessels = true;
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    await submitModalForm(
      () =>
        onSubmit({
          payload: {
            ...form,
            code: form.code.trim(),
            name: form.name.trim(),
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
      panelClassName="max-w-2xl"
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
      <form id="lta-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-1">
        {submitError ? <ModalFormError message={submitError} /> : null}
        <div className="grid gap-x-4 sm:grid-cols-2">
          <FormField
            label="Código"
            name="lta_code"
            value={form.code}
            onChange={(v) => patch("code", String(v))}
            required
            error={errors.code}
          />
          <FormField
            label="Nombre"
            name="lta_name"
            value={form.name}
            onChange={(v) => patch("name", String(v))}
            required
            error={errors.name}
          />
        </div>
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
        <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={form.all_vessels}
            onChange={(e) => patch("all_vessels", e.target.checked)}
            className="rounded border-zinc-300"
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
        <div className="grid gap-x-4 sm:grid-cols-2">
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
            label="Fecha ancla de cadencia"
            name="lta_cadence_anchor"
            type="date"
            value={form.cadence_anchor ?? ""}
            onChange={(v) => patch("cadence_anchor", String(v) || null)}
            error={errors.cadence_anchor}
          />
        </div>
        <p className="mb-4 -mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          Cadencia MSC: cada N días desde la fecha ancla (ej. 15 días desde el
          primer arribo). Vacío = sin filtro de ritmo.
        </p>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <FormField
            label="Antelación mín. (meses, ref.)"
            name="lta_adv_min"
            type="number"
            value={String(form.advance_months_min)}
            onChange={(v) => patch("advance_months_min", Number(v) || 0)}
            error={errors.advance_months_min}
          />
          <FormField
            label="Antelación máx. (meses, ref.)"
            name="lta_adv_max"
            type="number"
            value={String(form.advance_months_max)}
            onChange={(v) => patch("advance_months_max", Number(v) || 0)}
          />
        </div>
        <p className="mb-4 -mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          La validación de reserva usa ventanas Winter/Summer (actual / general /
          LTA cubierta). Estos meses quedan como referencia en el acuerdo.
        </p>
        <div className="grid gap-x-4 sm:grid-cols-2">
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
        </div>
        <FormField
          label="Mínimo de packs"
          name="lta_packs"
          type="number"
          value={form.min_packs != null ? String(form.min_packs) : ""}
          onChange={(v) => {
            const raw = String(v).trim();
            patch("min_packs", raw ? Number(raw) : null);
          }}
        />
        <div className="mb-4">
          <label
            htmlFor="lta_contract"
            className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
          >
            Contrato (PDF / DOC, opcional)
          </label>
          {initial?.contract_file_url && !removeContract && !contractFile ? (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950/40">
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
              Nuevo archivo: <span className="font-medium">{contractFile.name}</span>
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
        <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => patch("is_active", e.target.checked)}
            className="rounded border-zinc-300"
          />
          Acuerdo activo
        </label>
      </form>
    </Modal>
  );
}
