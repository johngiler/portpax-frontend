export type UserRole = "admin" | "booking_operator" | "port_operator" | "viewer";

export type ManagedUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role: UserRole | null;
  port_ids: number[];
  avatar: string | null;
  date_joined: string;
  last_login: string | null;
};

export type ManagedUserPayload = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password?: string;
  role: UserRole;
  port_ids: number[];
  is_active: boolean;
};

export type MeProfile = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole | null;
  port_ids: number[] | null;
  avatar: string | null;
};

export type MeProfilePayload = {
  email: string;
  first_name: string;
  last_name: string;
};

export type MeProfileSaveOptions = {
  avatarFile?: File | null;
  removeAvatar?: boolean;
};

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
};

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "booking_operator", label: "Operador de booking" },
  { value: "port_operator", label: "Operador de puerto" },
  { value: "viewer", label: "Solo lectura" },
];

export function userRoleLabel(role: UserRole | null | undefined): string {
  if (!role) return "Sin rol";
  return USER_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}
