"use client";

import { Scale } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import SectionAddButton from "@/components/buttons/SectionAddButton";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import ViewSection from "@/components/layout/ViewSection";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  deletePositionLoaRecalcRule,
  fetchPositionLoaRecalcRules,
  updatePositionLoaRecalcRule,
} from "@/services/catalogs/positionLoaRecalcRuleService";
import {
  deletePositionNestingRule,
  fetchPositionNestingRules,
  updatePositionNestingRule,
} from "@/services/catalogs/positionNestingRuleService";
import type {
  PortDetail,
  PositionLoaRecalcRule,
  PositionNestingRule,
} from "@/types/catalog";
import BerthingRuleModal from "./BerthingRuleModal";

type PortBerthingRulesSectionProps = {
  port: PortDetail;
  canWrite?: boolean;
};

type RuleRow =
  | { kind: "filo"; rule: PositionNestingRule }
  | { kind: "loa_recalc"; rule: PositionLoaRecalcRule };

export default function PortBerthingRulesSection({
  port,
  canWrite = true,
}: PortBerthingRulesSectionProps) {
  const [rows, setRows] = useState<RuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [filo, recalc] = await Promise.all([
        fetchPositionNestingRules(port.id),
        fetchPositionLoaRecalcRules(port.id),
      ]);
      setRows([
        ...filo.map((rule) => ({ kind: "filo" as const, rule })),
        ...recalc.map((rule) => ({ kind: "loa_recalc" as const, rule })),
      ]);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudieron cargar las reglas de atraque."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [port.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggle(row: RuleRow) {
    setError(null);
    try {
      if (row.kind === "filo") {
        await updatePositionNestingRule(row.rule.id, { is_active: !row.rule.is_active });
      } else {
        await updatePositionLoaRecalcRule(row.rule.id, { is_active: !row.rule.is_active });
      }
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo actualizar la regla."));
    }
  }

  async function handleDelete(row: RuleRow) {
    setError(null);
    try {
      if (row.kind === "filo") {
        await deletePositionNestingRule(row.rule.id);
      } else {
        await deletePositionLoaRecalcRule(row.rule.id);
      }
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo eliminar la regla."));
    }
  }

  return (
    <ViewSection
      icon={Scale}
      title="Reglas de atraque"
      description="Criterios del puerto: first-in / last-out y recálculo de slora en posiciones combinadas."
      actions={
        canWrite ? (
          <SectionAddButton label="Agregar regla" onClick={() => setModalOpen(true)} />
        ) : undefined
      }
    >
      {error ? <FormErrorAlert message={error} className="mb-3" /> : null}

      {loading ? (
        <p className="px-5 py-4 text-sm text-zinc-500 sm:px-6">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="px-5 py-4 text-sm text-zinc-500 sm:px-6">Sin reglas de atraque.</p>
      ) : (
        <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
          {rows.map((row) => (
            <li
              key={`${row.kind}-${row.rule.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6"
            >
              <RuleRowSummary row={row} />
              {canWrite ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleToggle(row)}
                    className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {row.rule.is_active ? "Desactivar" : "Activar"}
                  </button>
                  <ConfirmDeleteButton
                    deleteLabel={deleteLabel(row)}
                    onDelete={() => void handleDelete(row)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <BerthingRuleModal
        open={modalOpen}
        port={port}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </ViewSection>
  );
}

function RuleRowSummary({ row }: { row: RuleRow }) {
  if (row.kind === "filo") {
    const rule = row.rule;
    return (
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          First-in / last-out
        </p>
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
    );
  }

  const rule = row.rule;
  const pair = rule.component_labels.join(" ↔ ");
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        Recalcular slora
      </p>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {rule.combined_position_label}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500">
        {[
          rule.combined_max_loa_m ? `Máx. ${rule.combined_max_loa_m} m` : null,
          `Sep. ${rule.min_separation_m} m`,
          pair || null,
          rule.is_active ? "Activa" : "Inactiva",
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>
  );
}

function deleteLabel(row: RuleRow): string {
  if (row.kind === "filo") {
    return `la regla ${row.rule.outer_position_label} → ${row.rule.inner_position_label}`;
  }
  return `la regla ${row.rule.combined_position_label}`;
}
