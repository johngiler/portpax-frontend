"use client";

import { KeyRound, UserCircle } from "lucide-react";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import ViewSection from "@/components/layout/ViewSection";
import Skeleton, { SkeletonCircle, SkeletonLoader } from "@/components/ui/Skeleton";

function FieldSkeleton() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-4 w-20 rounded" />
      <SkeletonLoader className="h-10 w-full rounded-md" />
    </div>
  );
}

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
          description="Foto, nombre, correo y datos de tu cuenta."
        >
          <div className="mx-auto max-w-xl space-y-4">
            <div className="mb-5 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
              <SkeletonCircle className="h-24 w-24 shrink-0" />
              <div className="flex w-full max-w-xs flex-col gap-2">
                <Skeleton className="h-4 w-28 rounded" />
                <SkeletonLoader className="h-10 w-full rounded-md" />
                <Skeleton className="h-3 w-48 rounded" />
              </div>
            </div>
            <FieldSkeleton />
            <FieldSkeleton />
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <FieldSkeleton />
            <div className="flex justify-end pt-2">
              <SkeletonLoader className="h-10 w-36 rounded-md" />
            </div>
          </div>
        </ViewSection>

        <ViewSection
          icon={KeyRound}
          title="Cambiar contraseña"
          description="Usa una contraseña segura de al menos 8 caracteres."
        >
          <div className="mx-auto max-w-xl space-y-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <div className="flex justify-end pt-2">
              <SkeletonLoader className="h-10 w-44 rounded-md" />
            </div>
          </div>
        </ViewSection>
      </div>
    </>
  );
}
