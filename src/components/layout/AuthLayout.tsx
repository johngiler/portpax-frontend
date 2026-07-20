"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthOptional } from "@/contexts/AuthContext";
import { canAccessPath, roleHomePath } from "@/lib/navAccess";
import MainLayout from "./MainLayout";

type AuthLayoutProps = { children: React.ReactNode };

/**
 * Si la ruta es /login: muestra solo children (sin MainLayout).
 * Si no está autenticado: redirige a /login.
 * Si está en /login y autenticado: redirige al home según rol.
 * Si la ruta no está permitida para el rol: redirige al home del rol.
 * Si está autenticado: muestra MainLayout con children.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const auth = useAuthOptional();
  const isLoginPage = pathname === "/login";
  const loading = auth?.loading ?? true;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const role = auth?.user?.role;
  const home = roleHomePath(role);
  const pathAllowed = canAccessPath(role, pathname);

  useEffect(() => {
    if (loading) return;
    if (isLoginPage && isAuthenticated) {
      router.replace(home);
      return;
    }
    if (!isLoginPage && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!isLoginPage && isAuthenticated && !pathAllowed) {
      router.replace(home);
    }
  }, [loading, isLoginPage, isAuthenticated, pathAllowed, home, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--admin-gradient-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent" />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!pathAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--admin-gradient-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent" />
      </div>
    );
  }

  return <MainLayout>{children}</MainLayout>;
}
