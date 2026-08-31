export type EntityAuditEntry = {
  id: number;
  action: string;
  summary: string;
  changes: Record<string, unknown>;
  user_display: string | null;
  created_at: string;
};

export type AuditHistoryRow = {
  key: string;
  action: string;
  summary: string;
  changes: Record<string, unknown>;
  actorDisplay: string | null;
  occurredAt: string;
};
