"use client";

import { useMemo } from "react";
import { FormField, FormFieldMultiSelect, FormFieldSelect } from "@/components/ui/FormField";
import {
  useActiveShippingLinesCatalog,
  useShippingLineGroupsCatalog,
} from "@/hooks/swr/useCatalogs";
import type { BookingRecapScope } from "@/services/bookings/bulkImportService";

type RecapPasteScopeFieldsProps = {
  value: BookingRecapScope;
  onChange: (next: BookingRecapScope) => void;
  disabled?: boolean;
  errors?: {
    groups?: string;
    lines?: string;
    dateFrom?: string;
    dateTo?: string;
  };
};

export default function RecapPasteScopeFields({
  value,
  onChange,
  disabled = false,
  errors,
}: RecapPasteScopeFieldsProps) {
  const { groups } = useShippingLineGroupsCatalog(true);
  const { lines } = useActiveShippingLinesCatalog(true);

  const groupIds = value.shipping_line_group_ids ?? [];
  const lineIds = value.shipping_line_ids ?? [];
  const dateFrom = value.date_from ?? "";
  const dateTo = value.date_to ?? "";

  const groupOptions = useMemo(
    () =>
      groups.map((g) => ({
        value: g.id,
        label: g.name,
      })),
    [groups],
  );

  const lineOptions = useMemo(() => {
    const groupSet = new Set(groupIds);
    return lines
      .filter((line) => groupSet.size === 0 || groupSet.has(line.group))
      .map((line) => ({
        value: line.id,
        label: line.name,
        logoUrl: line.logo,
      }));
  }, [lines, groupIds]);

  const primaryGroupId = groupIds[0] ?? 0;

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormFieldSelect<number>
          label="Grupo de naviera"
          name="recap_scope_group"
          value={primaryGroupId}
          onChange={(id) => {
            const nextGroup = Number(id) > 0 ? [Number(id)] : [];
            onChange({
              ...value,
              shipping_line_group_ids: nextGroup,
              shipping_line_ids: [],
            });
          }}
          options={groupOptions}
          optionLabel="Todos los grupos"
          emptyValue={0}
          compact
          disabled={disabled}
          error={errors?.groups}
        />
        <FormFieldMultiSelect<number>
          label="Naviera"
          name="recap_scope_lines"
          value={lineIds}
          onChange={(ids) =>
            onChange({
              ...value,
              shipping_line_ids: ids,
            })
          }
          options={lineOptions}
          placeholder={
            primaryGroupId > 0
              ? "Todas las navieras del grupo"
              : "Todas las navieras"
          }
          compact
          showLogo
          logoKind="shipping_line"
          disabled={disabled}
          error={errors?.lines}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label="Desde"
          name="recap_scope_from"
          type="date"
          value={dateFrom}
          onChange={(v) =>
            onChange({
              ...value,
              date_from: String(v || ""),
            })
          }
          compact
          disabled={disabled}
          error={errors?.dateFrom}
        />
        <FormField
          label="Hasta"
          name="recap_scope_to"
          type="date"
          value={dateTo}
          onChange={(v) =>
            onChange({
              ...value,
              date_to: String(v || ""),
            })
          }
          compact
          disabled={disabled}
          error={errors?.dateTo}
        />
      </div>
    </div>
  );
}

export function emptyRecapScope(): BookingRecapScope {
  return {
    shipping_line_group_ids: [],
    shipping_line_ids: [],
    date_from: "",
    date_to: "",
  };
}

/** Optional delimiters — only validate range order when both dates are set. */
export function validateRecapScope(scope: BookingRecapScope): {
  ok: boolean;
  errors: NonNullable<RecapPasteScopeFieldsProps["errors"]>;
} {
  const errors: NonNullable<RecapPasteScopeFieldsProps["errors"]> = {};
  const from = (scope.date_from ?? "").trim();
  const to = (scope.date_to ?? "").trim();
  if (from && to && from > to) {
    errors.dateTo = "Hasta debe ser posterior o igual a Desde.";
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
