import type { BookingActivityItem } from "@/services/bookings/bookingActivityService";
import type { LtaActivityItem } from "@/services/bookings/ltaActivityService";
import type { PortActivityItem } from "@/services/catalogs/portActivityService";
import type { ShippingLineActivityItem } from "@/services/catalogs/shippingLineActivityService";
import type { UserActivityItem } from "@/services/accounts/userActivityService";
import type { AuditHistoryRow } from "@/types/audit";

const PORT_CHILD_ACTION_RE =
  /^(?:position|berth|bollard|fender|port_image|berth_image|position_image|nesting_rule|loa_recalc_rule)_(?:created|updated|deleted)$/;

export function portActivityPortTitle(item: Pick<PortActivityItem, "port_code" | "port_name">): string {
  const code = item.port_code?.trim();
  const name = item.port_name?.trim();
  if (code && name && name.toLowerCase() !== code.toLowerCase()) {
    return `${name} · ${code}`;
  }
  return name || code || "Puerto";
}

function summaryIncludesPort(summary: string, portTitle: string): boolean {
  const haystack = summary.toLowerCase();
  return portTitle
    .split("·")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .some((part) => haystack.includes(part));
}

export function portActivityHeadline(item: PortActivityItem): string {
  const portTitle = portActivityPortTitle(item);
  switch (item.action) {
    case "created":
      return `Creó ${portTitle}`;
    case "updated":
      return `Modificó ${portTitle}`;
    case "deleted":
      return `Eliminó ${portTitle}`;
    default: {
      const summary = item.summary?.trim();
      if (!summary) return portTitle;
      if (
        PORT_CHILD_ACTION_RE.test(item.action) &&
        portTitle !== "Puerto" &&
        !summaryIncludesPort(summary, portTitle)
      ) {
        return `${summary} · ${portTitle}`;
      }
      return summary;
    }
  }
}

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
    summary: portActivityHeadline(item),
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
