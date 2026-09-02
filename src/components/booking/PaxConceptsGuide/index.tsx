"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import Modal from "@/components/ui/Modal";
import {
  PAX_CONCEPTS_GUIDE,
  PAX_REPORTS_BASIS_GUIDE,
} from "./paxConceptsGuide";

type PaxConceptsGuideToggleProps = {
  onOpen: () => void;
  className?: string;
};

export function PaxConceptsGuideToggle({
  onOpen,
  className = "",
}: PaxConceptsGuideToggleProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      title="Reglas de Cap. máx. / real / planificado"
      aria-label="Reglas de Cap. máx., PAX real y planificado"
      className={[
        "inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-[var(--admin-accent)]/10 hover:text-[var(--admin-accent)]",
        className,
      ].join(" ")}
    >
      <CircleHelp className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
    </button>
  );
}

type PaxConceptsGuideModalProps = {
  open: boolean;
  onClose: () => void;
  /** Include Base PAX row (reports filter only). */
  includeReportsBasis?: boolean;
};

export function PaxConceptsGuideModal({
  open,
  onClose,
  includeReportsBasis = false,
}: PaxConceptsGuideModalProps) {
  const rows = includeReportsBasis
    ? [...PAX_CONCEPTS_GUIDE, PAX_REPORTS_BASIS_GUIDE]
    : PAX_CONCEPTS_GUIDE;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reglas PAX"
      panelClassName="max-w-lg"
      footer={
        <div className="flex w-full justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-[var(--admin-surface-muted)] dark:text-zinc-200"
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="overflow-hidden rounded-lg border border-[var(--admin-border)]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/70 dark:bg-zinc-900/80">
              <th className="whitespace-nowrap px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
                Campo
              </th>
              <th className="px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
                Descripción
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[var(--admin-border)]/70 last:border-0"
              >
                <td className="whitespace-nowrap px-3 py-2 align-top font-medium text-zinc-800 dark:text-zinc-100">
                  {row.name}
                </td>
                <td className="px-3 py-2 leading-snug text-zinc-600 dark:text-zinc-400">
                  {row.rule}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export default function PaxConceptsGuideButton({
  className = "",
  includeReportsBasis = false,
}: {
  className?: string;
  includeReportsBasis?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PaxConceptsGuideToggle
        onOpen={() => setOpen(true)}
        className={className}
      />
      <PaxConceptsGuideModal
        open={open}
        onClose={() => setOpen(false)}
        includeReportsBasis={includeReportsBasis}
      />
    </>
  );
}
