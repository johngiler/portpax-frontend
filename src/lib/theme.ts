/**
 * Tema claro/oscuro: persistencia en localStorage y aplicación de clase en <html>.
 * El layout inyecta un script que aplica el tema guardado antes del primer paint.
 */

const STORAGE_KEY = "portpax-theme";

export type Theme = "light" | "dark";

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s === "dark" || s === "light" ? s : null;
  } catch {
    return null;
  }
}

export function setStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

/** Aplica la clase en document.documentElement (solo en cliente). Si theme es null, usa la preferencia del sistema. */
export function applyThemeToDocument(theme: Theme | null): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const html = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme !== "light" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  html.classList.toggle("dark", isDark);
  html.classList.toggle("light", !isDark);
}

/** Devuelve el tema efectivo según la clase en html o la preferencia del sistema. */
export function getResolvedTheme(): Theme {
  if (typeof document === "undefined" || typeof window === "undefined")
    return "light";
  const html = document.documentElement;
  if (html.classList.contains("dark")) return "dark";
  if (html.classList.contains("light")) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
