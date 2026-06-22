"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const inputClass =
  "w-full rounded-lg border border-[var(--admin-border)] bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:border-[var(--admin-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:placeholder-zinc-500";

const HERO_IMAGES = [
  "/images/login-cruise-bg.png",
  "/images/login-cruise-bg-2.png",
  "/images/login-cruise-bg-3.png",
  "/images/login-cruise-bg-4.png",
] as const;

const HERO_TEXTS = [
  {
    short: "Gestión de cruceros integrada.",
    headline:
      "Toda la gestión de cruceros en una sola app integrada: muellaje, F&B, tours y operaciones en tiempo real.",
    subtitle: "Para puertos y navieras.",
  },
  {
    short: "Operaciones en tiempo real.",
    headline:
      "Muellaje, escalas y pasajeros en un solo lugar. Control total desde el primer atraque hasta el último.",
    subtitle: "Puertos y terminales de cruceros.",
  },
  {
    short: "Una plataforma. Todo el puerto.",
    headline:
      "Desde la terminal hasta el último pasajero. Bienvenido a la gestión portuaria que integra todo.",
    subtitle: "PortPax Management System.",
  },
  {
    short: "Cada escala, bajo control.",
    headline:
      "Cada llegada y salida, cada barco en ruta. Visibilidad total para tu operación portuaria.",
    subtitle: "Mar abierto. Un solo sistema.",
  },
] as const;

const HERO_INTERVAL_MS = 5500;

export default function LoginView() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (searchParams.get("session") === "expired") {
      setError("Tu sesión expiró por inactividad. Inicia sesión de nuevo.");
    }
  }, [searchParams]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion || HERO_IMAGES.length <= 1) return;
    const id = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, HERO_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

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
        setError(
          err instanceof Error ? err.message : "Error al iniciar sesión.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [login, username, password, router],
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative h-44 w-full shrink-0 overflow-hidden lg:hidden">
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src + i}
            className="absolute inset-0 transition-opacity duration-[800ms] ease-in-out"
            style={{ opacity: i === heroIndex ? 1 : 0 }}
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover object-center"
              priority={i === 0}
              sizes="100vw"
            />
          </div>
        ))}
        <div
          className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent"
          aria-hidden
        />
        <div className="absolute bottom-4 left-6 right-6">
          <span className="text-xl font-bold text-white drop-shadow-md">
            <span className="text-white/95">Port</span>
            <span style={{ color: "#93c5fd" }}>Pax</span>
          </span>
          <p
            key={heroIndex}
            className="hero-text-enter mt-0.5 text-sm text-white/90"
          >
            {HERO_TEXTS[heroIndex].short}
          </p>
        </div>
      </div>

      <div className="login-vortex flex min-h-0 w-full flex-1 flex-col items-center justify-center px-6 py-10 lg:min-h-screen lg:w-[58%] lg:max-w-[680px] lg:shrink-0 lg:py-12 lg:px-14">
        <div className="w-full max-w-[420px] rounded-2xl border border-white/80 bg-white/70 p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(52,120,181,0.2),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-sm dark:border-zinc-600/40 dark:bg-zinc-900/50 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_-12px_rgba(59,130,246,0.15)]">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20">
              <img
                src="/logos/isotype.svg"
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

          <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Iniciar sesión
          </h1>
          <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
            Accede a tu cuenta para gestionar operaciones de cruceros.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="login-username"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Usuario
              </label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. admin"
                className={inputClass}
                disabled={submitting}
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
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
              <div
                className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary-gradient mt-1 cursor-pointer rounded-lg px-4 py-3.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.12)] transition-all hover:brightness-105 hover:shadow-[0_6px_20px_-8px_rgba(52,120,181,0.6)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>

      <div className="relative hidden min-h-[320px] w-full flex-1 lg:block">
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src + i}
            className="absolute inset-0 transition-opacity duration-[1000ms] ease-in-out"
            style={{ opacity: i === heroIndex ? 1 : 0 }}
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover object-center"
              priority={i === 0}
              sizes="(max-width: 1024px) 0px, 42vw"
            />
          </div>
        ))}
        <div
          className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/50 to-zinc-950/30"
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col justify-end p-10 lg:p-14">
          <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg lg:text-4xl xl:text-[2.75rem]">
            <span className="text-white/95">Port</span>
            <span style={{ color: "#60a5fa" }}>Pax</span>
          </h2>
          <div key={heroIndex} className="hero-text-enter">
            <p className="mt-4 max-w-[420px] text-lg leading-relaxed text-white/90 drop-shadow-md lg:text-xl">
              {HERO_TEXTS[heroIndex].headline}
            </p>
            <p className="mt-2 text-sm text-white/70">
              {HERO_TEXTS[heroIndex].subtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
