import type { BookingActivityItem } from "@/services/bookings/bookingActivityService";
import type { LtaActivityItem } from "@/services/bookings/ltaActivityService";
import type { PortActivityItem } from "@/services/catalogs/portActivityService";
import type { ShippingLineActivityItem } from "@/services/catalogs/shippingLineActivityService";
import type { UserActivityItem } from "@/services/accounts/userActivityService";
import type { AuditHistoryRow } from "@/types/audit";

export function bookingActivityToRow(
  item: BookingActivityItem,
  index: number,
): AuditHistoryRow {
  return {
    key:
      item.audit_id != null
        ? `audit-${item.audit_id}`
        : `booking-${item.booking_id}-${item.occurred_at}-${index}`,
    action: item.action,
    summary: item.summary,
    changes: item.changes ?? {},
    actorDisplay: item.user_display,
    occurredAt: item.occurred_at,
  };
}

export function portActivityToRow(
  item: PortActivityItem,
  index: number,
): AuditHistoryRow {
  return {
    key:
      item.audit_id != null
        ? `audit-${item.audit_id}`
        : `port-${item.port_id}-${item.occurred_at}-${index}`,
    action: item.action,
    summary: item.summary,
    changes: item.changes,
    actorDisplay: item.actor_display,
    occurredAt: item.occurred_at,
  };
}

export function shippingLineActivityToRow(
  item: ShippingLineActivityItem,
  index: number,
): AuditHistoryRow {
  return {
    key:
      item.audit_id != null
        ? `audit-${item.audit_id}`
        : `line-${item.shipping_line_id}-${item.occurred_at}-${index}`,
    action: item.action,
    summary: item.summary,
    changes: item.changes,
    actorDisplay: item.actor_display,
    occurredAt: item.occurred_at,
  };
}

export function ltaActivityToRow(
  item: LtaActivityItem,
  index: number,
): AuditHistoryRow {
  return {
    key:
      item.audit_id != null
        ? `audit-${item.audit_id}`
        : `lta-${item.agreement_id}-${item.occurred_at}-${index}`,
    action: item.action,
    summary: item.summary,
    changes: item.changes,
    actorDisplay: item.actor_display,
    occurredAt: item.occurred_at,
  };
}

export function userActivityToRow(
  item: UserActivityItem,
  index: number,
): AuditHistoryRow {
  return {
    key:
      item.audit_id != null
        ? `audit-${item.audit_id}`
        : `user-${item.subject_id}-${item.occurred_at}-${index}`,
    action: item.action,
    summary: item.summary,
    changes: item.changes,
    actorDisplay: item.actor_display,
    occurredAt: item.occurred_at,
  };
}

export function entityAuditEntryToRow(entry: {
  id: number;
  action: string;
  summary: string;
  changes: Record<string, unknown>;
  user_display: string | null;
  created_at: string;
}): AuditHistoryRow {
  return {
    key: `audit-${entry.id}`,
    action: entry.action,
    summary: entry.summary,
    changes: entry.changes,
    actorDisplay: entry.user_display,
    occurredAt: entry.created_at,
  };
}
