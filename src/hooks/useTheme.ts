"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyThemeToDocument,
  getResolvedTheme,
  getStoredTheme,
  setStoredTheme,
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
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    setStoredTheme(theme);
    applyThemeToDocument(theme);
    setResolvedTheme(theme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  }, [resolvedTheme, setTheme]);

  return { resolvedTheme, setTheme, toggleTheme };
}
