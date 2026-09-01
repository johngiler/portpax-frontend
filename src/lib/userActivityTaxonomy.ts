import {
  CATALOG_ACTIVITY_TYPE_OPTIONS,
  type CatalogActivityFilterValue,
  type CatalogActivityOperation,
} from "@/lib/catalogActivityTaxonomy";

/** User history type filter. Empty = all. */
export type UserActivityFilterValue =
  | CatalogActivityFilterValue
  | "login";

export type UserActivityOperation = CatalogActivityOperation | "login";

export const USER_ACTIVITY_TYPE_OPTIONS: {
  value: Exclude<UserActivityFilterValue, "">;
  label: string;
}[] = [
  ...CATALOG_ACTIVITY_TYPE_OPTIONS,
  { value: "login", label: "Inicio de sesión" },
];

export function userActivityFilterToApiParams(
  filter: UserActivityFilterValue,
): { operation?: UserActivityOperation } {
  if (!filter) {
    return {};
  }
  return { operation: filter };
}

export function userActivityBadge(action: string): string {
  switch (action) {
    case "created":
      return "Creación";
    case "updated":
      return "Actualización";
    case "deleted":
      return "Eliminación";
    case "login":
      return "Inicio de sesión";
    default:
      return action;
  }
}

export type { CatalogActivityFilterValue, CatalogActivityOperation };
