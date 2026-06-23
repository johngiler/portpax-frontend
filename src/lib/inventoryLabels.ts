import type { PortBollard, PortFender } from "@/types/catalog";
import { bollardTypeLabel } from "@/types/catalog";

export function formatPortBollardLabel(bollard: PortBollard): string {
  const typeLabel = bollard.label.trim() || bollardTypeLabel(bollard.bollard_type);
  return `${bollard.quantity}× ${bollard.capacity_t} t · ${typeLabel}`;
}

export function formatPortBollardOptionLabel(bollard: PortBollard): string {
  return formatPortBollardLabel(bollard);
}

export function formatPortFenderLabel(fender: PortFender): string {
  return `${fender.quantity}× ${fender.fender_type}`;
}

export function formatPortFenderOptionLabel(fender: PortFender): string {
  return formatPortFenderLabel(fender);
}

export function formatPositionBollardAllocationLabel(
  bollard: PortBollard,
  quantity: number,
): string {
  const typeLabel = bollard.label.trim() || bollardTypeLabel(bollard.bollard_type);
  return `${quantity}× ${bollard.capacity_t} t · ${typeLabel}`;
}

export function formatPositionFenderAllocationLabel(
  fender: PortFender,
  quantity: number,
): string {
  return `${quantity}× ${fender.fender_type}`;
}
