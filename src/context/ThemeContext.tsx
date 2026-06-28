import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeSettings {
  theme: Theme;
  notifications: boolean;
  soundEnabled: boolean;
  compactMode: boolean;
  sidebarCollapsed: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: "small" | "normal" | "large";
  language: string;
}

const STORAGE_KEY = "eec-settings-v2";

const defaultSettings: ThemeSettings = {
  theme: "light",
  notifications: true,
  soundEnabled: true,
  compactMode: false,
  sidebarCollapsed: false,
  reducedMotion: false,
  highContrast: false,
  fontSize: "normal",
  language: "en",
};

function loadSettings(): ThemeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...defaultSettings };
}

function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (isDark) {
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
  } else {
    root.removeAttribute("data-theme");
    root.style.colorScheme = "light";
  }
}

interface ThemeContextValue {
  settings: ThemeSettings;
  isDark: boolean;
  setTheme: (t: Theme) => void;
  setNotifications: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  setCompactMode: (v: boolean) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setFontSize: (v: ThemeSettings["fontSize"]) => void;
  setLanguage: (v: string) => void;
  resetSettings: () => void;
  updateSetting: <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  }
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    const s = loadSettings();
    applyThemeToDOM(s.theme);
    if (s.compactMode) document.documentElement.setAttribute("data-compact", "true");
    return s;
  });

  const isDark =
    settings.theme === "dark" ||
    (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    applyThemeToDOM(settings.theme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (settings.theme === "system") applyThemeToDOM("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

  const update = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "compactMode") {
        if (value) document.documentElement.setAttribute("data-compact", "true");
        else document.documentElement.removeAttribute("data-compact");
      }
      return next;
    });
  };

  const resetSettings = () => {
    setSettings({ ...defaultSettings });
    document.documentElement.removeAttribute("data-compact");
  };

  return (
    <ThemeContext.Provider
      value={{
        settings,
        isDark,
        setTheme: (t) => update("theme", t),
        setNotifications: (v) => update("notifications", v),
        setSoundEnabled: (v) => update("soundEnabled", v),
        setCompactMode: (v) => update("compactMode", v),
        setSidebarCollapsed: (v) => update("sidebarCollapsed", v),
        setReducedMotion: (v) => update("reducedMotion", v),
        setHighContrast: (v) => update("highContrast", v),
        setFontSize: (v) => update("fontSize", v),
        setLanguage: (v) => update("language", v),
        resetSettings,
        updateSetting: update,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
    }
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}
