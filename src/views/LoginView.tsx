"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const inputClass =
  "w-full rounded-md border border-[var(--admin-border)] bg-gradient-to-b from-white to-[var(--admin-surface-muted)] px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] transition-all focus:border-[var(--admin-accent)] focus:from-white focus:to-white focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 dark:border-zinc-700/70 dark:from-zinc-900 dark:to-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:from-zinc-900 dark:focus:to-zinc-900";

export default function LoginView() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      if (!username.trim() || !password) {
        setError("Usuario y contraseña son obligatorios.");
        return;
      }
      setSubmitting(true);
      try {
        await login(username.trim(), password);
        router.replace("/");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
      } finally {
        setSubmitting(false);
      }
    },
    [login, username, password, router]
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--admin-gradient-bg)] px-4 py-8">
      <div
        className="w-full max-w-[400px] rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 shadow-[var(--admin-card-shadow)] transition-shadow duration-300 hover:shadow-[var(--admin-card-shadow-hover)] dark:bg-[var(--admin-surface)]"
        style={{ animation: "page-enter 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}
      >
        {/* Logo vertical: isotype + wordmark */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20">
            <img
              src="/logos/isotype-simple.svg"
              alt=""
              width={80}
              height={80}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="text-zinc-700 dark:text-zinc-300">Port</span>
              <span style={{ color: "var(--admin-accent)" }}>Pax</span>
            </span>
            <span className="mt-1 text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
              Management System
            </span>
          </div>
        </div>

        <h1 className="mb-6 text-center text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Iniciar sesión
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="login-username" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Usuario
            </label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className={inputClass}
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              disabled={submitting}
            />
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary-gradient mt-2 cursor-pointer rounded-md px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105 hover:shadow-[0_8px_22px_-14px_rgba(52,120,181,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
