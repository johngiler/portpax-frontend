"use client";

import { AlertTriangle, CheckCircle2, PencilLine, Ship } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type {
  ShippingLineImportItem,
  ShippingLineImportResult,
} from "@/services/catalogs/shippingLineImportExportService";

type ShippingLinesImportResultModalProps = {
  open: boolean;
  result: ShippingLineImportResult | null;
  onClose: () => void;
};

function kindLabel(kind: ShippingLineImportItem["kind"]): string {
  return kind === "shipping_line" ? "Naviera" : "Barco";
}

function ResultList({
  title,
  items,
  empty,
  variant,
}: {
  title: string;
  items: ShippingLineImportItem[];
  empty: string;
  variant: "created" | "invalid";
}) {
  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
        <span className="ml-1.5 font-normal text-zinc-500 dark:text-zinc-400">
          ({items.length})
        </span>
      </h3>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {empty}
        </p>
      ) : (
        <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <li
              key={`${item.kind}-${item.row}-${item.id ?? "new"}`}
              className={[
                "rounded-lg border px-3 py-2 text-xs",
                variant === "created"
                  ? "border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/30"
                  : "border-amber-200/80 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/30",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {item.label || item.name || "Sin nombre"}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {kindLabel(item.kind)} · fila {item.row}
                  {item.id != null ? ` · id ${item.id}` : ""}
                </span>
              </div>
              {variant === "invalid" && item.errors?.length ? (
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-amber-800 dark:text-amber-300">
                  {item.errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ShippingLinesImportResultModal({
  open,
  result,
  onClose,
}: ShippingLinesImportResultModalProps) {
  if (!result) return null;

  const stats = [
    {
      label: "Actualizados",
      value: result.updated_count,
      icon: PencilLine,
      className:
        "border-sky-200/80 bg-sky-50/70 text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-100",
    },
    {
      label: "Creados",
      value: result.created_count,
      icon: CheckCircle2,
      className:
        "border-emerald-200/80 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100",
    },
    {
      label: "Inválidos",
      value: result.invalid_count,
      icon: AlertTriangle,
      className:
        "border-amber-200/80 bg-amber-50/70 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100",
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Resultado de la importación"
      panelClassName="max-w-2xl"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-md bg-[var(--admin-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Cerrar
        </button>
      }
    >
      <div className="mb-4 flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
        <Ship
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--admin-accent)]"
          strokeWidth={2}
          aria-hidden
        />
        <p>
          Navieras: {result.shipping_lines.updated_count} actualizadas,{" "}
          {result.shipping_lines.created_count} creadas,{" "}
          {result.shipping_lines.invalid_count} inválidas. Barcos:{" "}
          {result.vessels.updated_count} actualizados,{" "}
          {result.vessels.created_count} creados,{" "}
          {result.vessels.invalid_count} inválidos.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${stat.className}`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">
                  {stat.label}
                </p>
                <p className="text-xl font-semibold tabular-nums">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ResultList
          title="Creados"
          items={result.created}
          empty="No se creó ningún registro."
          variant="created"
        />
        <ResultList
          title="Inválidos"
          items={result.invalid}
          empty="Ninguna fila inválida."
          variant="invalid"
        />
      </div>
    </Modal>
  );
}
