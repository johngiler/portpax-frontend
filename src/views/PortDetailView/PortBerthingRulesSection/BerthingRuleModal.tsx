"use client";

import { useEffect, useMemo, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { positionShortCode } from "@/lib/positionCode";
import {
  createPositionLoaRecalcRule,
  updatePositionLoaRecalcRule,
} from "@/services/catalogs/positionLoaRecalcRuleService";
import {
  createPositionNestingRule,
  updatePositionNestingRule,
} from "@/services/catalogs/positionNestingRuleService";
import type {
  PortDetail,
  PositionLoaRecalcRule,
  PositionNestingRule,
} from "@/types/catalog";
import { BERTHING_RULE_KINDS, type BerthingRuleKind } from "./kinds";

export type BerthingRuleEditing =
  | { kind: "filo"; rule: PositionNestingRule }
  | { kind: "loa_recalc"; rule: PositionLoaRecalcRule };

type BerthingRuleModalProps = {
  open: boolean;
  port: PortDetail;
  editing?: BerthingRuleEditing | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

function numOrEmpty(value: string | number | null | undefined): number | "" {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  return Number.isNaN(n) ? "" : n;
}

export default function BerthingRuleModal({
  open,
  port,
  editing = null,
  onClose,
  onSaved,
}: BerthingRuleModalProps) {
  const isEdit = editing != null;

  const pierOptions = useMemo(() => {
    const base = port.positions.filter(
      (p) => p.position_type === "pier" && !p.is_combined && p.is_active,
    );
    const byId = new Map(base.map((p) => [p.id, p]));
    if (editing?.kind === "filo") {
      for (const id of [editing.rule.outer_position, editing.rule.inner_position]) {
        const pos = port.positions.find((p) => p.id === id);
        if (pos && !byId.has(id)) byId.set(id, pos);
      }
    }
    if (editing?.kind === "loa_recalc") {
      for (const id of [editing.rule.position_a, editing.rule.position_b]) {
        const pos = port.positions.find((p) => p.id === id);
        if (pos && !byId.has(id)) byId.set(id, pos);
      }
    }
    return [...byId.values()].map((p) => ({
      value: p.id,
      label: positionShortCode(port.code, p.code),
    }));
  }, [port, editing]);

  const [kind, setKind] = useState<BerthingRuleKind>("filo");
  const [outerId, setOuterId] = useState(0);
  const [innerId, setInnerId] = useState(0);
  const [enforceEta, setEnforceEta] = useState(true);
  const [enforceEtd, setEnforceEtd] = useState(true);
  const [positionAId, setPositionAId] = useState(0);
  const [positionBId, setPositionBId] = useState(0);
  const [maxLoa, setMaxLoa] = useState<number | "">(580);
  const [separation, setSeparation] = useState<number | "">(15);
  const [yellowFrom, setYellowFrom] = useState<number | "">(581);
  const [redFrom, setRedFrom] = useState<number | "">(621);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function resetCreateFields(nextKind: BerthingRuleKind) {
    setKind(nextKind);
    setOuterId(pierOptions[0]?.value ?? 0);
    setInnerId(pierOptions[1]?.value ?? pierOptions[0]?.value ?? 0);
    setEnforceEta(true);
    setEnforceEtd(true);
    setPositionAId(pierOptions[0]?.value ?? 0);
    setPositionBId(pierOptions[1]?.value ?? pierOptions[0]?.value ?? 0);
    setMaxLoa(580);
    setSeparation(15);
    setYellowFrom(581);
    setRedFrom(621);
    setFieldErrors({});
    setSubmitError(null);
  }

  function hydrateFromEditing(row: BerthingRuleEditing) {
    setKind(row.kind);
    setFieldErrors({});
    setSubmitError(null);
    if (row.kind === "filo") {
      setOuterId(row.rule.outer_position);
      setInnerId(row.rule.inner_position);
      setEnforceEta(row.rule.enforce_eta);
      setEnforceEtd(row.rule.enforce_etd);
      return;
    }
    setPositionAId(row.rule.position_a);
    setPositionBId(row.rule.position_b);
    setMaxLoa(numOrEmpty(row.rule.max_loa_m));
    setSeparation(numOrEmpty(row.rule.separation_m));
    setYellowFrom(numOrEmpty(row.rule.yellow_from_m));
    setRedFrom(numOrEmpty(row.rule.red_from_m));
  }

  useEffect(() => {
    if (!open) return;
    if (editing) hydrateFromEditing(editing);
    else resetCreateFields("filo");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per open/edit target
  }, [open, editing?.kind, editing?.rule.id]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (kind === "filo") {
      if (!outerId) next.outer = "Selecciona la posición de entrada.";
      if (!innerId) next.inner = "Selecciona la posición de fondo.";
      if (outerId && innerId && outerId === innerId) {
        next.inner = "Entrada y fondo deben ser distintas.";
      }
    } else {
      if (!positionAId) next.positionA = "Selecciona la primera posición.";
      if (!positionBId) next.positionB = "Selecciona la segunda posición.";
      if (positionAId && positionBId && positionAId === positionBId) {
        next.positionB = "Las dos posiciones deben ser distintas.";
      }
      if (maxLoa === "" || Number(maxLoa) <= 0) {
        next.maxLoa = "Indica la eslora máxima combinada.";
      }
      if (separation === "" || Number.isNaN(Number(separation))) {
        next.separation = "Indica la separación entre barcos.";
      } else if (Number(separation) < 0) {
        next.separation = "La separación no puede ser negativa.";
      }
      if (yellowFrom === "" || Number.isNaN(Number(yellowFrom))) {
        next.yellow = "Indica el umbral amarillo.";
      }
      if (redFrom === "" || Number.isNaN(Number(redFrom))) {
        next.red = "Indica el umbral rojo.";
      }
      if (
        maxLoa !== "" &&
        yellowFrom !== "" &&
        Number(yellowFrom) <= Number(maxLoa)
      ) {
        next.yellow = "El amarillo debe ser mayor que la eslora máxima combinada (verde).";
      }
      if (
        yellowFrom !== "" &&
        redFrom !== "" &&
        Number(yellowFrom) >= Number(redFrom)
      ) {
        next.red = "El rojo debe ser mayor que el amarillo.";
      }
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setSubmitError(null);
    try {
      if (kind === "filo") {
        const payload = {
          port: port.id,
          outer_position: outerId,
          inner_position: innerId,
          enforce_eta: enforceEta,
          enforce_etd: enforceEtd,
          is_active: editing?.kind === "filo" ? editing.rule.is_active : true,
        };
        if (editing?.kind === "filo") {
          await updatePositionNestingRule(editing.rule.id, payload);
        } else {
          await createPositionNestingRule(payload);
        }
      } else {
        const payload = {
          port: port.id,
          position_a: positionAId,
          position_b: positionBId,
          max_loa_m: Number(maxLoa),
          separation_m: Number(separation),
          yellow_from_m: Number(yellowFrom),
          red_from_m: Number(redFrom),
          is_active:
            editing?.kind === "loa_recalc" ? editing.rule.is_active : true,
        };
        if (editing?.kind === "loa_recalc") {
          await updatePositionLoaRecalcRule(editing.rule.id, payload);
        } else {
          await createPositionLoaRecalcRule(payload);
        }
      }
      await onSaved();
      onClose();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "No se pudo guardar la regla."));
    } finally {
      setSaving(false);
    }
  }

  const positionALabel =
    pierOptions.find((o) => o.value === positionAId)?.label ?? "A";
  const positionBLabel =
    pierOptions.find((o) => o.value === positionBId)?.label ?? "B";
  const maxCombinedLoaLabel = `Eslora máxima combinada (${positionALabel}+${positionBLabel}) (m)`;

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      title={isEdit ? "Editar regla de atraque" : "Agregar regla de atraque"}
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
          <DefaultButton type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </DefaultButton>
        </div>
      }
    >
      <div className="space-y-4">
        <ModalFormError message={submitError} />
        <FormFieldSelect<BerthingRuleKind>
          label="Tipo de regla"
          name="berthing_rule_kind"
          value={kind}
          onChange={(value) => {
            if (isEdit) return;
            resetCreateFields(value);
          }}
          options={[...BERTHING_RULE_KINDS]}
          disabled={isEdit}
          required
        />

        {kind === "filo" ? (
          <>
            <FormFieldSelect<number>
              label="Posición entrada (first-in)"
              name="nesting_outer"
              value={outerId}
              onChange={setOuterId}
              options={pierOptions}
              error={fieldErrors.outer}
              required
            />
            <FormFieldSelect<number>
              label="Posición fondo (last-out)"
              name="nesting_inner"
              value={innerId}
              onChange={setInnerId}
              options={pierOptions}
              error={fieldErrors.inner}
              required
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={enforceEta}
                onChange={(e) => setEnforceEta(e.target.checked)}
                className="rounded border-zinc-300"
              />
              Exigir ETA fondo ≥ ETA entrada
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={enforceEtd}
                onChange={(e) => setEnforceEtd(e.target.checked)}
                className="rounded border-zinc-300"
              />
              Exigir ETD fondo ≤ ETD entrada (last-out)
            </label>
          </>
        ) : (
          <>
            <FormFieldSelect<number>
              label="Posición A"
              name="loa_recalc_a"
              value={positionAId}
              onChange={setPositionAId}
              options={pierOptions}
              error={fieldErrors.positionA}
              required
            />
            <FormFieldSelect<number>
              label="Posición B"
              name="loa_recalc_b"
              value={positionBId}
              onChange={setPositionBId}
              options={pierOptions}
              error={fieldErrors.positionB}
              required
            />
            <FormField
              label={maxCombinedLoaLabel}
              name="loa_recalc_max"
              type="number"
              min={0}
              step="0.5"
              value={maxLoa}
              onChange={(v) => setMaxLoa(v === "" ? "" : Number(v))}
              error={fieldErrors.maxLoa}
              required
            />
            <FormField
              label="Separación entre barcos (m)"
              name="loa_recalc_sep"
              type="number"
              min={0}
              step="0.5"
              value={separation}
              onChange={(v) => setSeparation(v === "" ? "" : Number(v))}
              error={fieldErrors.separation}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Semáforo amarillo desde (m)"
                name="loa_recalc_yellow"
                type="number"
                min={0}
                step="1"
                value={yellowFrom}
                onChange={(v) => setYellowFrom(v === "" ? "" : Number(v))}
                error={fieldErrors.yellow}
                required
              />
              <FormField
                label="Semáforo rojo desde (m)"
                name="loa_recalc_red"
                type="number"
                min={0}
                step="1"
                value={redFrom}
                onChange={(v) => setRedFrom(v === "" ? "" : Number(v))}
                error={fieldErrors.red}
                required
              />
            </div>
            <p className="text-xs text-zinc-500">
              Verde: suma &lt; amarillo · Amarillo: hasta rojo · Rojo: desde el umbral
              rojo. Solo avisos (no bloquean).
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
