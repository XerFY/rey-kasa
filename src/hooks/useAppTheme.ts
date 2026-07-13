import { useLayoutEffect } from "react";

import type {
  ThemeMode,
} from "../types/AppSettings";

type AppliedTheme =
  Exclude<ThemeMode, "system">;

const storedThemes: ThemeMode[] = [
  "light",
  "dark",
  "emerald",
  "midnight",
  "burgundy",
  "system",
];

const themeColors:
  Record<AppliedTheme, string> = {
    light: "#eef2f6",
    dark: "#171a20",
    emerald: "#0b1714",
    midnight: "#0b1020",
    burgundy: "#1b0f14",
  };

function readStoredTheme():
  ThemeMode | null {
  try {
    const storedTheme =
      localStorage.getItem(
        "rey-kasa-theme"
      );

    return storedThemes.includes(
      storedTheme as ThemeMode
    )
      ? storedTheme as ThemeMode
      : null;
  } catch {
    return null;
  }
}

function resolveTheme(
  theme: ThemeMode
): AppliedTheme {
  if (theme !== "system") {
    return theme;
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light";
}

function isDarkTheme(
  theme: AppliedTheme
): boolean {
  return theme !== "light";
}

export function useAppTheme(
  theme: ThemeMode,
  loading = false
): void {
  useLayoutEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    const selectedTheme =
      loading
        ? readStoredTheme() ?? theme
        : theme;

    function applyTheme() {
      const resolvedTheme =
        resolveTheme(selectedTheme);

      const nativeColorScheme =
        isDarkTheme(resolvedTheme)
          ? "dark"
          : "light";

      document.documentElement.setAttribute(
        "data-theme",
        resolvedTheme
      );

      document.documentElement.style
        .colorScheme =
        nativeColorScheme;

      document
        .querySelector<HTMLMetaElement>(
          'meta[name="theme-color"]'
        )
        ?.setAttribute(
          "content",
          themeColors[resolvedTheme]
        );

      if (!loading) {
        try {
          localStorage.setItem(
            "rey-kasa-theme",
            theme
          );
        } catch {
          // Depolama kapalı olsa da tema çalışır.
        }
      }
    }

    applyTheme();

    if (
      selectedTheme !== "system"
    ) {
      return;
    }

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
  }, [theme, loading]);
}