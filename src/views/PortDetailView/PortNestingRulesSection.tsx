"use client";

import { ArrowRightLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import SectionAddButton from "@/components/buttons/SectionAddButton";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import DefaultButton from "@/components/buttons/DefaultButton";
import ViewSection from "@/components/layout/ViewSection";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import { FormFieldSelect } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { positionShortCode } from "@/lib/positionCode";
import {
  createPositionNestingRule,
  deletePositionNestingRule,
  fetchPositionNestingRules,
  updatePositionNestingRule,
} from "@/services/catalogs/positionNestingRuleService";
import type { PortDetail, PositionNestingRule } from "@/types/catalog";

type PortNestingRulesSectionProps = {
  port: PortDetail;
  canWrite?: boolean;
};

export default function PortNestingRulesSection({
  port,
  canWrite = true,
}: PortNestingRulesSectionProps) {
  const [rules, setRules] = useState<PositionNestingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [outerId, setOuterId] = useState(0);
  const [innerId, setInnerId] = useState(0);
  const [enforceEta, setEnforceEta] = useState(true);
  const [enforceEtd, setEnforceEtd] = useState(true);

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRules(await fetchPositionNestingRules(port.id));
    } catch (err) {
      setError(
        getApiErrorMessage(err, "No se pudieron cargar las reglas first-in/last-out."),
      );
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [port.id]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setOuterId(pierOptions[0]?.value ?? 0);
    setInnerId(pierOptions[1]?.value ?? 0);
    setEnforceEta(true);
    setEnforceEtd(true);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!outerId || !innerId || outerId === innerId) {
      setError("Selecciona dos posiciones distintas (entrada y fondo).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createPositionNestingRule({
        port: port.id,
        outer_position: outerId,
        inner_position: innerId,
        enforce_eta: enforceEta,
        enforce_etd: enforceEtd,
        is_active: true,
      });
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo guardar la regla."));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(rule: PositionNestingRule) {
    setError(null);
    try {
      await updatePositionNestingRule(rule.id, { is_active: !rule.is_active });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo actualizar la regla."));
    }
  }

  async function handleDelete(rule: PositionNestingRule) {
    setError(null);
    try {
      await deletePositionNestingRule(rule.id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo eliminar la regla."));
    }
  }

  return (
    <ViewSection
      icon={ArrowRightLeft}
      title="First-in / last-out"
      description="Parqueo de doble fondo: la posición entrada debe arribar primero; el fondo no puede llegar antes."
      actions={
        canWrite ? (
          <SectionAddButton label="+ Agregar regla" onClick={openCreate} />
        ) : undefined
      }
    >
      {error ? <FormErrorAlert message={error} className="mb-3" /> : null}

      {loading ? (
        <p className="px-5 py-4 text-sm text-zinc-500 sm:px-6">Cargando…</p>
      ) : rules.length === 0 ? (
        <p className="px-5 py-4 text-sm text-zinc-500 sm:px-6">
          Sin reglas de nesting. Solo aplica en muelles con posiciones de fondo
          (ej. E1 → E2).
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {rule.outer_position_label}
                  <span className="mx-2 font-normal text-zinc-400">→</span>
                  {rule.inner_position_label}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {[
                    rule.enforce_eta ? "ETA fondo ≥ ETA entrada" : null,
                    rule.enforce_etd ? "ETD fondo ≤ ETD entrada" : null,
                    rule.is_active ? "Activa" : "Inactiva",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {canWrite ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleToggle(rule)}
                    className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {rule.is_active ? "Desactivar" : "Activar"}
                  </button>
                  <ConfirmDeleteButton
                    deleteLabel={`la regla ${rule.outer_position_label} → ${rule.inner_position_label}`}
                    onDelete={() => void handleDelete(rule)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        title="Regla first-in / last-out"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => setModalOpen(false)}
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
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Define la posición de entrada (first-in) y la de fondo (last-out).
          </p>
          <FormFieldSelect<number>
            label="Posición entrada (first-in)"
            name="nesting_outer"
            value={outerId}
            onChange={setOuterId}
            options={pierOptions}
            required
          />
          <FormFieldSelect<number>
            label="Posición fondo (last-out)"
            name="nesting_inner"
            value={innerId}
            onChange={setInnerId}
            options={pierOptions}
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
        </div>
      </Modal>
    </ViewSection>
  );
}
