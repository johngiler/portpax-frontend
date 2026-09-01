/** Shared catalog history filters (ports, shipping lines). */

export type CatalogActivityFilterValue = "" | "create" | "update" | "delete";

export type CatalogActivityOperation = "all" | "create" | "update" | "delete";

export const CATALOG_ACTIVITY_TYPE_OPTIONS: {
  value: Exclude<CatalogActivityFilterValue, "">;
  label: string;
}[] = [
  { value: "create", label: "Creación" },
  { value: "update", label: "Actualización" },
  { value: "delete", label: "Eliminación" },
];

export function catalogActivityFilterToApiParams(
  filter: CatalogActivityFilterValue,
): { operation?: CatalogActivityOperation } {
  if (!filter) {
    return {};
  }
  return { operation: filter };
}

export function catalogActivityOperationLabel(action: string): string {
  const childMatch = action.match(
    /^(?:position|berth|bollard|fender|port_image|berth_image|position_image|nesting_rule|loa_recalc_rule|vessel)_(created|updated|deleted)$/,
  );
  const verb = childMatch ? childMatch[1] : action;
  switch (verb) {
    case "created":
      return "Creación";
    case "updated":
      return "Actualización";
    case "deleted":
      return "Eliminación";
    default:
      return action;
  }
}

export function catalogActivityBadge(action: string): string {
  return catalogActivityOperationLabel(action);
}
