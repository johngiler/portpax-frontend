/** Presence payload from the notifications WebSocket. */

export type PresenceStatus = "active" | "idle";

export type OnlineUser = {
  id: number;
  display_name: string;
  username: string;
  role: string;
  role_label: string;
  avatar: string | null;
  status?: PresenceStatus | string;
  last_seen?: string | null;
};

export type PresencePayload = {
  action?: "snapshot" | "join" | "leave" | "update" | string;
  users?: OnlineUser[];
};

/** Idle after 5 minutes without interaction; hidden tab counts as idle. */
export const PRESENCE_IDLE_MS = 5 * 60 * 1000;
