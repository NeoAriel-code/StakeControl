export const THEME_STORAGE_KEY = "stakecontrol-theme";

export type Theme = "light" | "dark";

const themeListeners = new Set<() => void>();

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}

export function getSystemTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(storedTheme) ? storedTheme : null;
}

export function getThemeFromDocument(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function getServerThemeSnapshot(): Theme {
  return "light";
}

export function resolveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  root.classList.toggle("dark", theme === "dark");
}

export function persistTheme(theme: Theme) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function emitThemeChange() {
  for (const listener of themeListeners) {
    listener();
  }
}

export function subscribeToTheme(listener: () => void) {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
}
