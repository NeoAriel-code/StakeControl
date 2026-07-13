"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import {
  applyTheme,
  emitThemeChange,
  getServerThemeSnapshot,
  getStoredTheme,
  getSystemTheme,
  getThemeFromDocument,
  persistTheme,
  subscribeToTheme,
  type Theme,
} from "@/lib/theme";

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeFromDocument,
    getServerThemeSnapshot
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleStorage = () => {
      emitThemeChange();
    };

    const handleMediaChange = () => {
      if (!getStoredTheme()) {
        applyTheme(getSystemTheme());
        emitThemeChange();
      }
    };

    window.addEventListener("storage", handleStorage);
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const isDark = theme === "dark";

  function handleToggleTheme() {
    const nextTheme: Theme = isDark ? "light" : "dark";
    applyTheme(nextTheme);
    persistTheme(nextTheme);
    emitThemeChange();
  }

  return (
    <button
      type="button"
      onClick={handleToggleTheme}
      className="theme-toggle"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
