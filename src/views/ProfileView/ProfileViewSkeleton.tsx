import ViewPageHeader from "@/components/layout/ViewPageHeader";
import ViewSection from "@/components/layout/ViewSection";
import { KeyRound, UserCircle } from "lucide-react";

export default function ProfileViewSkeleton() {
  return (
    <>
      <ViewPageHeader
        icon={UserCircle}
        title="Mi perfil"
        description="Actualiza tu información personal y tu contraseña."
      />
      <div className="flex flex-col gap-6">
        <ViewSection
          icon={UserCircle}
          title="Información personal"
          description="Nombre, correo y datos de tu cuenta."
        >
          <div className="mx-auto max-w-xl space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800" />
            ))}
          </div>
        </ViewSection>
        <ViewSection
          icon={KeyRound}
          title="Cambiar contraseña"
          description="Usa una contraseña segura de al menos 8 caracteres."
        >
          <div className="mx-auto max-w-xl space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800" />
            ))}
          </div>
        </ViewSection>
      </div>
    </>
  );
}
