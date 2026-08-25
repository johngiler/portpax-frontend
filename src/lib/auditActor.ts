/** Display name for audit / history actors. */

export const SYSTEM_ACTOR_LABEL = "Sistema";

/** Select value for system-authored events (no human user). */
export const HISTORY_ACTOR_SYSTEM = "system";

/** Select empty value = all authors. */
export const HISTORY_ACTOR_ALL = "";

export type HistoryActivityActor = {
  id: number;
  label: string;
};

export type HistoryActorsResponse = {
  results: HistoryActivityActor[];
  has_system: boolean;
};

/** User label, or "Sistema" when the event has no human actor. */
export function formatAuditActorDisplay(
  value: string | null | undefined,
): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || SYSTEM_ACTOR_LABEL;
}

/** Options for Autor filter: Sistema (if any) + users with ≥1 history row. */
export function historyActorSelectOptions(
  actors: HistoryActivityActor[],
  hasSystem: boolean,
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  if (hasSystem) {
    options.push({ value: HISTORY_ACTOR_SYSTEM, label: SYSTEM_ACTOR_LABEL });
  }
  for (const actor of actors) {
    options.push({ value: String(actor.id), label: actor.label });
  }
  return options;
}
