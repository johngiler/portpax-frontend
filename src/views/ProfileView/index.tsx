"use client";

import { KeyRound, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import ViewSection from "@/components/layout/ViewSection";
import FormErrorAlert from "@/components/ui/FormErrorAlert";
import FormSuccessAlert from "@/components/ui/FormSuccessAlert";
import { FormField } from "@/components/ui/FormField";
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage, submitModalForm } from "@/lib/apiFormErrors";
import {
  changeMyPassword,
  fetchMeProfile,
  updateMeProfile,
} from "@/services/accounts/userService";
import type { MeProfile } from "@/types/accounts";
import { userRoleLabel } from "@/types/accounts";
import ProfileAvatarField from "./ProfileAvatarField";
import ProfileViewSkeleton from "./ProfileViewSkeleton";

type ProfileFieldErrors = Partial<
  Record<"email" | "first_name" | "last_name" | "avatar", string>
>;

type PasswordFieldErrors = Partial<
  Record<"current_password" | "new_password" | "confirm_password", string>
>;

export default function ProfileView() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileErrors, setProfileErrors] = useState<ProfileFieldErrors>({});
  const [profileSubmitError, setProfileSubmitError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<PasswordFieldErrors>({});
  const [passwordSubmitError, setPasswordSubmitError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setViewError(null);
      try {
        const me = await fetchMeProfile();
        if (cancelled) return;
        setProfile(me);
        setEmail(me.email ?? "");
        setFirstName(me.first_name ?? "");
        setLastName(me.last_name ?? "");
        setAvatarFile(null);
        setRemoveAvatar(false);
        setAvatarPreview(me.avatar ?? null);
      } catch (err) {
        if (!cancelled) {
          setViewError(getApiErrorMessage(err, "No se pudo cargar el perfil."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    if (removeAvatar) {
      setAvatarPreview(null);
      return;
    }
    setAvatarPreview(profile?.avatar ?? null);
  }, [avatarFile, removeAvatar, profile?.avatar]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErrors({});
    setProfileSuccess(null);
    setProfileSubmitError(null);
    setPasswordSuccess(null);
    setSavingProfile(true);
    const ok = await submitModalForm(
      async () => {
        const updated = await updateMeProfile(
          {
            email: email.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
          {
            avatarFile,
            removeAvatar,
          },
        );
        setProfile(updated);
        setAvatarFile(null);
        setRemoveAvatar(false);
        setAvatarPreview(updated.avatar ?? null);
        await refreshUser();
        setProfileSuccess("Datos actualizados correctamente.");
      },
      {
        fallback: "No se pudieron guardar los datos.",
        setSubmitError: setProfileSubmitError,
        setFieldErrors: setProfileErrors,
      },
    );
    if (!ok) setProfileSuccess(null);
    setSavingProfile(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const errors: PasswordFieldErrors = {};
    if (!currentPassword) errors.current_password = "Requerido";
    if (!newPassword) errors.new_password = "Requerido";
    else if (newPassword.length < 8) errors.new_password = "Mínimo 8 caracteres";
    if (newPassword !== confirmPassword) {
      errors.confirm_password = "Las contraseñas no coinciden";
    }
    setPasswordErrors(errors);
    setPasswordSubmitError(null);
    setPasswordSuccess(null);
    setProfileSuccess(null);
    if (Object.keys(errors).length > 0) return;

    setSavingPassword(true);
    const ok = await submitModalForm(
      async () => {
        await changeMyPassword({
          current_password: currentPassword,
          new_password: newPassword,
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordSuccess("Contraseña actualizada correctamente.");
      },
      {
        fallback: "No se pudo cambiar la contraseña.",
        setSubmitError: setPasswordSubmitError,
        setFieldErrors: setPasswordErrors,
      },
    );
    if (!ok) setPasswordSuccess(null);
    setSavingPassword(false);
  }

  if (loading) {
    return <ProfileViewSkeleton />;
  }

  return (
    <>
      <ViewPageHeader
        icon={UserCircle}
        title="Mi perfil"
        description="Actualiza tu información personal y tu contraseña."
      />

      {viewError && <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />}

      <div className="flex flex-col gap-6">
        <ViewSection
          icon={UserCircle}
          title="Información personal"
          description="Foto, nombre, correo y datos de tu cuenta."
        >
          <form onSubmit={handleSaveProfile} className="mx-auto max-w-xl space-y-1">
            <FormErrorAlert message={profileSubmitError} />
            <FormSuccessAlert
              message={profileSuccess}
              onDismiss={() => setProfileSuccess(null)}
            />
            <ProfileAvatarField
              label={
                profile
                  ? [firstName, lastName].filter(Boolean).join(" ") ||
                    profile.username
                  : "?"
              }
              previewUrl={avatarPreview}
              disabled={savingProfile}
              onFileChange={(file) => {
                setAvatarFile(file);
                setRemoveAvatar(false);
              }}
              onRemove={() => {
                setAvatarFile(null);
                setRemoveAvatar(true);
              }}
              canRemove={Boolean(avatarPreview)}
            />
            <FormField
              label="Usuario"
              name="username"
              value={profile?.username ?? ""}
              onChange={() => {}}
              disabled
            />
            <FormField
              label="Rol"
              name="role"
              value={userRoleLabel(profile?.role)}
              onChange={() => {}}
              disabled
            />
            <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
              <FormField
                label="Nombre"
                name="first_name"
                value={firstName}
                onChange={(v) => setFirstName(String(v))}
                error={profileErrors.first_name}
                disabled={savingProfile}
              />
              <FormField
                label="Apellido"
                name="last_name"
                value={lastName}
                onChange={(v) => setLastName(String(v))}
                error={profileErrors.last_name}
                disabled={savingProfile}
              />
            </div>
            <FormField
              label="Correo"
              name="email"
              type="email"
              value={email}
              onChange={(v) => setEmail(String(v))}
              error={profileErrors.email}
              disabled={savingProfile}
            />
            <div className="flex justify-end pt-2">
              <DefaultButton type="submit" disabled={savingProfile}>
                {savingProfile ? "Guardando…" : "Guardar cambios"}
              </DefaultButton>
            </div>
          </form>
        </ViewSection>

        <ViewSection
          icon={KeyRound}
          title="Cambiar contraseña"
          description="Usa una contraseña segura de al menos 8 caracteres."
        >
          <form onSubmit={handleChangePassword} className="mx-auto max-w-xl space-y-1">
            <FormErrorAlert message={passwordSubmitError} />
            <FormSuccessAlert
              message={passwordSuccess}
              onDismiss={() => setPasswordSuccess(null)}
            />
            <FormField
              label="Contraseña actual"
              name="current_password"
              type="password"
              value={currentPassword}
              onChange={(v) => setCurrentPassword(String(v))}
              required
              error={passwordErrors.current_password}
              disabled={savingPassword}
            />
            <FormField
              label="Nueva contraseña"
              name="new_password"
              type="password"
              value={newPassword}
              onChange={(v) => setNewPassword(String(v))}
              required
              error={passwordErrors.new_password}
              disabled={savingPassword}
            />
            <FormField
              label="Confirmar nueva contraseña"
              name="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(v) => setConfirmPassword(String(v))}
              required
              error={passwordErrors.confirm_password}
              disabled={savingPassword}
            />
            <div className="flex justify-end pt-2">
              <DefaultButton type="submit" disabled={savingPassword}>
                {savingPassword ? "Guardando…" : "Actualizar contraseña"}
              </DefaultButton>
            </div>
          </form>
        </ViewSection>
      </div>
    </>
  );
}
