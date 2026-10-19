"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyThemeToDocument,
  getResolvedTheme,
  getStoredTheme,
  isMobileThemeViewport,
  setStoredTheme,
  THEME_MOBILE_MAX_WIDTH_PX,
  type Theme,
} from "@/utils/theme";

export function useTheme(): {
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
} {
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() =>
    typeof document !== "undefined" ? getResolvedTheme() : "light"
  );

  useEffect(() => {
    const stored = getStoredTheme();
    applyThemeToDocument(stored);
    setResolvedTheme(getResolvedTheme());

    const mq = window.matchMedia(
      `(max-width: ${THEME_MOBILE_MAX_WIDTH_PX}px)`,
    );
    const onViewportChange = () => {
      applyThemeToDocument(getStoredTheme());
      setResolvedTheme(getResolvedTheme());
    };
    mq.addEventListener("change", onViewportChange);
    return () => mq.removeEventListener("change", onViewportChange);
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    setStoredTheme(theme);
    applyThemeToDocument(theme);
    setResolvedTheme(getResolvedTheme());
  }, []);

  const toggleTheme = useCallback(() => {
    if (isMobileThemeViewport()) return;
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  }, [resolvedTheme, setTheme]);

  return { resolvedTheme, setTheme, toggleTheme };
}
