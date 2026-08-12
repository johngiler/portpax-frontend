"use client";

import { useEffect, useMemo, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { positionShortCode } from "@/lib/positionCode";
import { createPositionLoaRecalcRule } from "@/services/catalogs/positionLoaRecalcRuleService";
import { createPositionNestingRule } from "@/services/catalogs/positionNestingRuleService";
import type { PortDetail } from "@/types/catalog";
import { BERTHING_RULE_KINDS, type BerthingRuleKind } from "./kinds";

type BerthingRuleModalProps = {
  open: boolean;
  port: PortDetail;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export default function BerthingRuleModal({
  open,
  port,
  onClose,
  onSaved,
}: BerthingRuleModalProps) {
  const pierOptions = useMemo(
    () =>
      port.positions
        .filter((p) => p.is_active && p.position_type === "pier" && !p.is_combined)
        .map((p) => ({
          value: p.id,
          label: positionShortCode(port.code, p.code),
        })),
    [port],
  );

  const combinedOptions = useMemo(
    () =>
      port.positions
        .filter((p) => p.is_active && p.is_combined)
        .map((p) => ({
          value: p.id,
          label: `${positionShortCode(port.code, p.code)}${
            p.max_loa_m ? ` · máx. ${p.max_loa_m} m` : ""
          }`,
        })),
    [port],
  );

  const [kind, setKind] = useState<BerthingRuleKind>("filo");
  const [outerId, setOuterId] = useState(pierOptions[0]?.value ?? 0);
  const [innerId, setInnerId] = useState(pierOptions[1]?.value ?? 0);
  const [enforceEta, setEnforceEta] = useState(true);
  const [enforceEtd, setEnforceEtd] = useState(true);
  const [combinedId, setCombinedId] = useState(combinedOptions[0]?.value ?? 0);
  const [minSeparation, setMinSeparation] = useState<number | "">(15);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function resetFields(nextKind: BerthingRuleKind) {
    setKind(nextKind);
    setOuterId(pierOptions[0]?.value ?? 0);
    setInnerId(pierOptions[1]?.value ?? 0);
    setEnforceEta(true);
    setEnforceEtd(true);
    setCombinedId(combinedOptions[0]?.value ?? 0);
    setMinSeparation(15);
    setFieldErrors({});
    setSubmitError(null);
  }

  useEffect(() => {
    if (open) resetFields("filo");
  }, [open]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (kind === "filo") {
      if (!outerId) next.outer = "Selecciona la posición de entrada.";
      if (!innerId) next.inner = "Selecciona la posición de fondo.";
      if (outerId && innerId && outerId === innerId) {
        next.inner = "Entrada y fondo deben ser distintas.";
      }
    } else {
      if (!combinedId) next.combined = "Selecciona una posición combinada.";
      if (minSeparation === "" || Number.isNaN(Number(minSeparation))) {
        next.separation = "Indica la separación mínima.";
      } else if (Number(minSeparation) < 0) {
        next.separation = "La separación no puede ser negativa.";
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
        await createPositionNestingRule({
          port: port.id,
          outer_position: outerId,
          inner_position: innerId,
          enforce_eta: enforceEta,
          enforce_etd: enforceEtd,
          is_active: true,
        });
      } else {
        await createPositionLoaRecalcRule({
          port: port.id,
          combined_position: combinedId,
          min_separation_m: Number(minSeparation),
          is_active: true,
        });
      }
      await onSaved();
      onClose();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "No se pudo guardar la regla."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      title="Agregar regla de atraque"
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
          onChange={(value) => resetFields(value)}
          options={[...BERTHING_RULE_KINDS]}
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
              label="Posición combinada"
              name="loa_recalc_combined"
              value={combinedId}
              onChange={setCombinedId}
              options={combinedOptions}
              error={fieldErrors.combined}
              required
            />
            <FormField
              label="Separación mínima (m)"
              name="loa_recalc_sep"
              type="number"
              min={0}
              step="0.5"
              value={minSeparation}
              onChange={(v) => setMinSeparation(v === "" ? "" : Number(v))}
              error={fieldErrors.separation}
              required
            />
          </>
        )}
      </div>
    </Modal>
  );
}
