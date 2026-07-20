"use client";

import { CalendarClock, Mail, MapPin, Shield, UserRound } from "lucide-react";
import EntityThumb from "@/components/ui/EntityThumb";
import type { ManagedUser } from "@/types/accounts";
import { userRoleLabel } from "@/types/accounts";

type UserRowDetailProps = {
  user: ManagedUser;
  portLabels: string[];
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("es", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function MetaCard({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200/70 bg-white/90 p-3.5 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/70">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        {label}
      </div>
      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{children}</div>
    </div>
  );
}

export default function UserRowDetail({ user, portLabels }: UserRowDetailProps) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");

  return (
    <div className="w-full rounded-2xl border border-[var(--admin-accent)]/15 bg-gradient-to-br from-white via-white to-[var(--admin-accent)]/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:from-zinc-900 dark:via-zinc-900 dark:to-[var(--admin-accent)]/[0.08] sm:p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 items-center gap-4">
          <EntityThumb
            src={user.avatar}
            label={fullName || user.username}
            size="xl"
            className="ring-4 ring-[var(--admin-accent)]/10"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {fullName || user.username}
            </p>
            <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
              @{user.username}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-[var(--admin-accent)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--admin-accent)]">
                {userRoleLabel(user.role)}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  user.is_active
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {user.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetaCard icon={Mail} label="Correo">
            <span className="break-all">{user.email || "—"}</span>
          </MetaCard>
          <MetaCard icon={Shield} label="Rol">
            {userRoleLabel(user.role)}
          </MetaCard>
          <MetaCard icon={UserRound} label="Estado">
            {user.is_active ? "Cuenta activa" : "Cuenta inactiva"}
          </MetaCard>
          <MetaCard icon={CalendarClock} label="Alta">
            {formatDateTime(user.date_joined)}
          </MetaCard>
          <MetaCard icon={CalendarClock} label="Último acceso">
            {user.last_login
              ? formatDateTime(user.last_login)
              : "Nunca ha iniciado sesión"}
          </MetaCard>
          <MetaCard icon={MapPin} label="Puertos">
            {user.role === "admin" ? (
              <span className="text-zinc-500">Todos los puertos</span>
            ) : portLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {portLabels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex rounded-lg bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-zinc-400">Sin puertos asignados</span>
            )}
          </MetaCard>
        </div>
      </div>
    </div>
  );
}
