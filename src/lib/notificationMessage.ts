import type { AppNotification } from "@/types/notification";

/** Split stored message into lead text + booking code for smaller code styling. */
export function notificationMessageParts(
  item: AppNotification,
): { lead: string; code: string | null } {
  const code = item.booking_code?.trim();
  if (!code) {
    return { lead: item.message, code: null };
  }

  const message = item.message.trim();
  if (message.endsWith(code)) {
    return { lead: message.slice(0, -code.length).trimEnd(), code };
  }
  if (message.includes(code)) {
    return { lead: message.replace(code, "").replace(/\s+/g, " ").trim(), code };
  }

  return { lead: item.message, code: null };
}
