"use client";

import { Plus, Trash2 } from "lucide-react";
import Select from "react-select";
import { buildCatalogSelectStyles, errorClass, inputClass, labelClass } from "@/components/ui/FormField";

export type InventoryRow = {
  key: string;
  inventoryId: number;
  quantity: number | null;
};

type InventoryOption = {
  value: number;
  label: string;
};

type PositionInventoryRowsProps = {
  label: string;
  rows: InventoryRow[];
  options: InventoryOption[];
  selectPlaceholder: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  onChange: (rows: InventoryRow[]) => void;
};

function createRow(): InventoryRow {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    inventoryId: 0,
    quantity: null,
  };
}

export function rowsFromAllocations(
  items: Array<{ port_bollard?: number; port_fender?: number; quantity: number }>,
  field: "port_bollard" | "port_fender",
): InventoryRow[] {
  return items.map((item) => ({
    key: `${field}-${item[field]}-${item.quantity}`,
    inventoryId: item[field] ?? 0,
    quantity: item.quantity,
  }));
}

export function allocationsFromBollardRows(rows: InventoryRow[]): Array<{ port_bollard: number; quantity: number }> {
  return rows
    .filter((row) => row.inventoryId > 0 && row.quantity != null && row.quantity > 0)
    .map((row) => ({
      port_bollard: row.inventoryId,
      quantity: row.quantity as number,
    }));
}

export function allocationsFromFenderRows(rows: InventoryRow[]): Array<{ port_fender: number; quantity: number }> {
  return rows
    .filter((row) => row.inventoryId > 0 && row.quantity != null && row.quantity > 0)
    .map((row) => ({
      port_fender: row.inventoryId,
      quantity: row.quantity as number,
    }));
}

export default function PositionInventoryRows({
  label,
  rows,
  options,
  selectPlaceholder,
  disabled = false,
  error,
  className = "",
  onChange,
}: PositionInventoryRowsProps) {
  const styles = buildCatalogSelectStyles<number>(Boolean(error));

  function updateRow(key: string, patch: Partial<InventoryRow>) {
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeRow(key: string) {
    onChange(rows.filter((row) => row.key !== key));
  }

  function addRow() {
    onChange([...rows, createRow()]);
  }

  return (
    <div className={`w-full ${className}`}>
      <p className={`${labelClass} mb-2`}>{label}</p>

      <div className="space-y-2">
        {rows.map((row) => {
          const selected =
            row.inventoryId > 0
              ? (options.find((option) => option.value === row.inventoryId) ?? null)
              : null;

          return (
            <div key={row.key} className="flex flex-wrap items-start gap-2">
              <div className="w-28 shrink-0">
                <label className="sr-only">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  disabled={disabled}
                  value={row.quantity ?? ""}
                  onChange={(event) =>
                    updateRow(row.key, {
                      quantity: event.target.value === "" ? null : Number(event.target.value),
                    })
                  }
                  placeholder="Cant."
                  className={`${inputClass} px-3 py-2.5 text-center`}
                  aria-label="Cantidad"
                />
              </div>

              <div className="min-w-[10rem] flex-1 basis-[10rem]">
                <label className="sr-only">{label}</label>
                <Select<InventoryOption, false>
                  value={selected}
                  options={options}
                  onChange={(option) =>
                    updateRow(row.key, { inventoryId: option?.value ?? 0 })
                  }
                  styles={styles}
                  isClearable
                  isDisabled={disabled}
                  placeholder={selectPlaceholder}
                  menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                  menuPosition="fixed"
                />
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={() => removeRow(row.key)}
                className="mt-0.5 flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-zinc-200/80 text-zinc-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-zinc-700 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                aria-label="Eliminar línea"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={addRow}
        className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:border-[var(--admin-accent)]/40 hover:text-[var(--admin-accent)] disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        Agregar línea
      </button>

      {error ? (
        <p className={errorClass} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
