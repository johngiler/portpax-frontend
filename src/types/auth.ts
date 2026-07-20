export type LoginResponse = {
  access: string;
  refresh: string;
};

export type UserRole = "admin" | "booking_operator" | "port_operator" | "viewer";

export type UserMe = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  /** null = all ports (admin); otherwise allowed port IDs */
  port_ids?: number[] | null;
  avatar?: string | null;
};

/** Full name → email → username */
export function userDisplayName(user: {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  username: string;
}): string {
  const name = [user.first_name, user.last_name]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ");
  if (name) return name;
  const email = (user.email ?? "").trim();
  if (email) return email;
  return user.username;
}
