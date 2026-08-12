export const BERTHING_RULE_KINDS = [
  { value: "filo", label: "First-in / last-out" },
  { value: "loa_recalc", label: "Recalcular slora" },
] as const;

export type BerthingRuleKind = (typeof BERTHING_RULE_KINDS)[number]["value"];
