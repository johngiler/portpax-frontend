import type { PortBollard, PortFender } from "@/types/catalog";
import { bollardTypeLabel } from "@/types/catalog";

export function formatPortBollardLabel(bollard: PortBollard): string {
  const typeLabel = bollard.label.trim() || bollardTypeLabel(bollard.bollard_type);
  return `${bollard.quantity}× ${bollard.capacity_t} t · ${typeLabel}`;
}

export function formatPortFenderLabel(fender: PortFender): string {
  return `${fender.quantity}× ${fender.fender_type}`;
}
