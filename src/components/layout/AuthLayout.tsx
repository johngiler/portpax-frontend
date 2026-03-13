"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthOptional } from "@/contexts/AuthContext";
import MainLayout from "./MainLayout";

type AuthLayoutProps = { children: React.ReactNode };

/**
 * Si la ruta es /login: muestra solo children (sin MainLayout).
 * Si no está autenticado: redirige a /login.
 * Si está en /login y autenticado: redirige a /.
 * Si está autenticado: muestra MainLayout con children.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthOptional();
  const isLoginPage = pathname === "/login";
  const loading = auth?.loading ?? true;
  const isAuthenticated = auth?.isAuthenticated ?? false;

  useEffect(() => {
    if (loading) return;
    if (isLoginPage && isAuthenticated) {
      router.replace("/");
      return;
    }
    if (!isLoginPage && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isLoginPage, isAuthenticated, router]);

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

  return <MainLayout>{children}</MainLayout>;
}
