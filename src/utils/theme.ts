const STORAGE_KEY = "portpax-theme";

/** Matches sidebar / layout mobile breakpoint (< md). */
export const THEME_MOBILE_MAX_WIDTH_PX = 767;

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

export function isMobileThemeViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${THEME_MOBILE_MAX_WIDTH_PX}px)`).matches;
}

export function applyThemeToDocument(theme: Theme | null): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const html = document.documentElement;
  // Responsive: always light (ops request — Herman).
  const isDark =
    !isMobileThemeViewport() &&
    (theme === "dark" ||
      (theme !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches));
  html.classList.toggle("dark", isDark);
  html.classList.toggle("light", !isDark);
}

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
