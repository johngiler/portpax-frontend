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

/** Spanish UI — role purpose from PORT_PAX_FUNCIONALIDADES / SPEC (MVP roles only). */
export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin:
    "Acceso total al sistema. Crea y asigna usuarios a puertos; gestiona tarifas, muelles y reglas de negocio.",
  booking_operator:
    "Rol principal de trabajo diario: registra y gestiona calls (crea NR, cambia status, asigna muelles). Acceso por uno o varios puertos.",
  port_operator:
    "Autoriza excepciones operativas (mover un call CL, eslora combinada, fuerza mayor). Cierra la ventana operativa del call en Real (R): datos reales de la escala.",
  viewer:
    "Solo lectura: consulta la información sin capacidad de modificar nada.",
};

export type UserRoleGuideRow = {
  value: UserRole;
  label: string;
  description: string;
};

export const USER_ROLE_GUIDE: UserRoleGuideRow[] = USER_ROLE_OPTIONS.map(
  (option) => ({
    ...option,
    description: USER_ROLE_DESCRIPTIONS[option.value],
  }),
);

export function userRoleLabel(role: UserRole | null | undefined): string {
  if (!role) return "Sin rol";
  return USER_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

export function userRoleDescription(role: UserRole | null | undefined): string {
  if (!role) return "Sin rol asignado; no puede usar la aplicación.";
  return USER_ROLE_DESCRIPTIONS[role] ?? "";
}
