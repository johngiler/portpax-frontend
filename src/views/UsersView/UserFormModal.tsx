"use client";

import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import {
  FormField,
  FormFieldMultiSelect,
  FormFieldSelect,
} from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { submitModalForm } from "@/lib/apiFormErrors";
import type { ManagedUser, ManagedUserPayload, UserRole } from "@/types/accounts";
import { USER_ROLE_OPTIONS } from "@/types/accounts";
import RolesGuideTable, { RolesGuideToggle } from "./RolesGuidePanel";

export type UserFormMode = "create" | "edit";

type UserFormModalProps = {
  open: boolean;
  mode: UserFormMode;
  initial?: ManagedUser | null;
  portOptions: { value: number; label: string; logoUrl?: string | null }[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: ManagedUserPayload) => Promise<void>;
};

type FormState = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: UserRole | "";
  port_ids: number[];
  is_active: boolean;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function emptyForm(): FormState {
  return {
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "booking_operator",
    port_ids: [],
    is_active: true,
  };
}

function userToForm(user: ManagedUser): FormState {
  return {
    username: user.username,
    email: user.email ?? "",
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    password: "",
    role: user.role ?? "booking_operator",
    port_ids: user.port_ids ?? [],
    is_active: user.is_active,
  };
}

function validate(form: FormState, mode: UserFormMode): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.username.trim()) errors.username = "Requerido";
  if (!form.role) errors.role = "Requerido";
  if (mode === "create" && !form.password) errors.password = "Requerido";
  if (form.password && form.password.length < 8) {
    errors.password = "Mínimo 8 caracteres";
  }
  if (form.role && form.role !== "admin" && form.port_ids.length === 0) {
    errors.port_ids = "Selecciona al menos un puerto";
  }
  return errors;
}

export default function UserFormModal({
  open,
  mode,
  initial,
  portOptions,
  saving,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rolesGuideOpen, setRolesGuideOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? userToForm(initial) : emptyForm());
    setErrors({});
    setSubmitError(null);
    setRolesGuideOpen(false);
  }, [open, initial]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "role" && value === "admin") {
        next.port_ids = [];
      }
      return next;
    });
    setErrors((prev) => {
      if (!prev[key] && !(key === "role" && prev.port_ids)) return prev;
      const next = { ...prev };
      delete next[key];
      if (key === "role") delete next.port_ids;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form, mode);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (!form.role) return;

    const payload: ManagedUserPayload = {
      username: form.username.trim(),
      email: form.email.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      role: form.role,
      port_ids: form.role === "admin" ? [] : form.port_ids,
      is_active: form.is_active,
    };
    if (form.password) {
      payload.password = form.password;
    }

    await submitModalForm(() => onSubmit(payload), {
      fallback:
        mode === "create" ? "No se pudo crear el usuario." : "No se pudo guardar el usuario.",
      setSubmitError,
      setFieldErrors: setErrors,
    });
  }

  const title = mode === "create" ? "Nuevo usuario" : "Editar usuario";
  const isAdminRole = form.role === "admin";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-lg"
      footer={
        <div className="flex w-full justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer rounded-md border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-[var(--admin-surface-muted)] disabled:opacity-50 dark:text-zinc-200"
          >
            Cancelar
          </button>
          <DefaultButton type="submit" form="user-form" disabled={saving}>
            {saving ? "Guardando…" : mode === "create" ? "Crear usuario" : "Guardar cambios"}
          </DefaultButton>
        </div>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-1">
        <ModalFormError message={submitError} />
        <FormField
          label="Usuario"
          name="username"
          value={form.username}
          onChange={(v) => setField("username", String(v))}
          required
          error={errors.username}
          disabled={saving}
        />
        <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
          <FormField
            label="Nombre"
            name="first_name"
            value={form.first_name}
            onChange={(v) => setField("first_name", String(v))}
            error={errors.first_name}
            disabled={saving}
          />
          <FormField
            label="Apellido"
            name="last_name"
            value={form.last_name}
            onChange={(v) => setField("last_name", String(v))}
            error={errors.last_name}
            disabled={saving}
          />
        </div>
        <FormField
          label="Correo"
          name="email"
          type="email"
          value={form.email}
          onChange={(v) => setField("email", String(v))}
          error={errors.email}
          disabled={saving}
        />
        <FormField
          label={mode === "create" ? "Contraseña" : "Nueva contraseña (opcional)"}
          name="password"
          type="password"
          value={form.password}
          onChange={(v) => setField("password", String(v))}
          required={mode === "create"}
          error={errors.password}
          disabled={saving}
          placeholder={mode === "edit" ? "Dejar en blanco para no cambiar" : undefined}
        />
        <FormFieldSelect<UserRole | "">
          label="Rol"
          name="role"
          value={form.role}
          onChange={(v) => setField("role", v)}
          options={USER_ROLE_OPTIONS}
          required
          error={errors.role}
          disabled={saving}
          labelEnd={
            <RolesGuideToggle
              open={rolesGuideOpen}
              onToggle={() => setRolesGuideOpen((prev) => !prev)}
            />
          }
        />
        {rolesGuideOpen && <RolesGuideTable />}
        {!isAdminRole && (
          <FormFieldMultiSelect<number>
            label="Puertos asignados"
            name="port_ids"
            value={form.port_ids}
            onChange={(v) => setField("port_ids", v)}
            options={portOptions}
            placeholder="Seleccionar puertos…"
            error={errors.port_ids}
            disabled={saving}
            showLogo
            logoKind="port"
          />
        )}
        {isAdminRole && (
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
            El administrador tiene acceso a todos los puertos.
          </p>
        )}
        <label className="mb-1 flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setField("is_active", e.target.checked)}
            disabled={saving}
            className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
          />
          Usuario activo
        </label>
      </form>
    </Modal>
  );
}
