"use client";

import Modal from "@/components/ui/Modal";
import { REPORT_GUIDE } from "./reportGuide";

type ReportGuideToggleProps = {
  onOpen: () => void;
};

export function ReportGuideToggle({ onOpen }: ReportGuideToggleProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium text-[var(--admin-accent)] transition-colors hover:underline"
    >
      Ver guía
    </button>
  );
}

type ReportGuideModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ReportGuideModal({ open, onClose }: ReportGuideModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Guía de reportes"
      panelClassName="max-w-2xl"
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
      <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
        Qué muestra cada reporte operativo y qué filtros o export necesita. Alcance actual:
        bookings reales del sistema (sin proyección ni garantías).
      </p>
      <div className="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/60 dark:bg-zinc-900/50">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--admin-border)] bg-white/70 dark:bg-zinc-900/80">
              <th className="whitespace-nowrap px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
                Reporte
              </th>
              <th className="px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
                Para qué sirve
              </th>
              <th className="px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
                Notas
              </th>
            </tr>
          </thead>
          <tbody>
            {REPORT_GUIDE.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[var(--admin-border)]/70 last:border-0"
              >
                <td className="whitespace-nowrap px-3 py-2 align-top font-medium text-zinc-800 dark:text-zinc-100">
                  {row.name}
                </td>
                <td className="px-3 py-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {row.description}
                </td>
                <td className="px-3 py-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {row.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
