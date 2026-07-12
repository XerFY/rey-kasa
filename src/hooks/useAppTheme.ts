import { useEffect } from "react";

import type { ThemeMode } from "../types/AppSettings";

function resolveTheme(
  theme: ThemeMode
): "light" | "dark" {
  if (theme !== "system") {
    return theme;
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light";
}

export function useAppTheme(
  theme: ThemeMode
): void {
  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    function applyTheme() {
      const resolvedTheme =
        resolveTheme(theme);

      document.documentElement.setAttribute(
        "data-theme",
        resolvedTheme
      );

      document.documentElement.style.colorScheme =
        resolvedTheme;

      localStorage.setItem(
        "rey-kasa-theme",
        theme
      );
    }

    applyTheme();

    mediaQuery.addEventListener(
      "change",
      applyTheme
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        applyTheme
      );
    };
  }, [theme]);
}