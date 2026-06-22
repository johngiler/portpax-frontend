"use client";

import { FormFieldSelect } from "@/components/ui/FormField";

type CombinedPositionFieldsProps = {
  componentAId: number;
  componentBId: number;
  options: { value: number; label: string }[];
  loading: boolean;
  disabled: boolean;
  error?: string;
  onChangeA: (id: number) => void;
  onChangeB: (id: number) => void;
};

export default function CombinedPositionFields({
  componentAId,
  componentBId,
  options,
  loading,
  disabled,
  error,
  onChangeA,
  onChangeB,
}: CombinedPositionFieldsProps) {
  return (
    <div className="col-span-full space-y-3 rounded-lg border border-[var(--admin-accent)]/20 bg-[var(--admin-accent)]/5 p-3">
      <p className="text-xs text-zinc-600 dark:text-zinc-300">
        Selecciona dos posiciones de muelle cuando la eslora del barco supera la capacidad de una
        sola posición. La eslora, bitas y defensas se calculan a partir de ambas.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormFieldSelect<number>
          label="Posición base 1"
          name="component_a"
          value={componentAId}
          onChange={onChangeA}
          options={options.filter((o) => o.value !== componentBId)}
          optionLabel={loading ? "Cargando…" : "Seleccionar…"}
          emptyValue={0}
          required
          disabled={disabled || loading}
        />
        <FormFieldSelect<number>
          label="Posición base 2"
          name="component_b"
          value={componentBId}
          onChange={onChangeB}
          options={options.filter((o) => o.value !== componentAId)}
          optionLabel={loading ? "Cargando…" : "Seleccionar…"}
          emptyValue={0}
          required
          disabled={disabled || loading}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
