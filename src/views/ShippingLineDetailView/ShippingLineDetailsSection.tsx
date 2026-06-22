"use client";

import { Building2 } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import type { ShippingLineDetail } from "@/types/cruise";
import { shippingLineStatusLabel } from "@/types/cruise";

type ShippingLineDetailsSectionProps = {
  line: ShippingLineDetail;
};

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-950/50">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

export default function ShippingLineDetailsSection({ line }: ShippingLineDetailsSectionProps) {
  return (
    <ViewSection
      icon={Building2}
      title="Datos de la naviera"
      description="Marca operativa y grupo corporativo del catálogo de cruceros."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DetailItem label="Código" value={line.code} />
        <DetailItem label="Marca" value={line.name} />
        <DetailItem label="Grupo" value={line.group_name} />
        <DetailItem label="Estado" value={shippingLineStatusLabel(line.is_active)} />
      </div>
    </ViewSection>
  );
}
