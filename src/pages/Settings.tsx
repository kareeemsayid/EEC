import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import toast from "react-hot-toast";
import {
  Moon,
  Sun,
  Bell,
  BellOff,
  Type,
  Monitor,
  RotateCcw,
  Save,
  Shield,
  Palette,
  Volume2,
  Eye,
  Lock,
} from "lucide-react";

type Theme = "light" | "dark" | "system";
type FontSize = "small" | "medium" | "large";

interface SettingsData {
  theme: Theme;
  fontSize: FontSize;
  notifications: boolean;
  soundEnabled: boolean;
  compactMode: boolean;
}

const defaultSettings: SettingsData = {
  theme: "light",
  fontSize: "medium",
  notifications: true,
  soundEnabled: true,
  compactMode: false,
};

export default function Settings() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>("light");
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("eec-settings");
    if (saved) {
      try {
        const parsed: SettingsData = JSON.parse(saved);
        setTheme(parsed.theme || "light");
        setFontSize(parsed.fontSize || "medium");
        setNotifications(parsed.notifications ?? true);
        setSoundEnabled(parsed.soundEnabled ?? true);
        setCompactMode(parsed.compactMode ?? false);

        // Apply loaded settings
        applyTheme(parsed.theme);
        applyFontSize(parsed.fontSize);
      } catch (e) {
        console.error("Failed to parse saved settings:", e);
      }
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    const isDark =
      newTheme === "dark" ||
      (newTheme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  };

  const applyFontSize = (newSize: FontSize) => {
    const root = document.documentElement;
    const sizes = { small: "14px", medium: "16px", large: "18px" };
    root.style.fontSize = sizes[newSize];
    root.setAttribute("data-font-size", newSize);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    setHasChanges(true);
  };

  const handleFontSizeChange = (newSize: FontSize) => {
    setFontSize(newSize);
    applyFontSize(newSize);
    setHasChanges(true);
  };

  const handleReset = () => {
    setTheme(defaultSettings.theme);
    setFontSize(defaultSettings.fontSize);
    setNotifications(defaultSettings.notifications);
    setSoundEnabled(defaultSettings.soundEnabled);
    setCompactMode(defaultSettings.compactMode);
    setHasChanges(false);
    applyTheme(defaultSettings.theme);
    applyFontSize(defaultSettings.fontSize);
    localStorage.setItem("eec-settings", JSON.stringify(defaultSettings));
    toast.success("Settings reset to defaults");
  };

  const handleSave = () => {
    const settings: SettingsData = {
      theme,
      fontSize,
      notifications,
      soundEnabled,
      compactMode,
    };
    localStorage.setItem("eec-settings", JSON.stringify(settings));
    setHasChanges(false);
    toast.success("Settings saved successfully");
  };

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="w-5 h-5" /> },
    { value: "dark", label: "Dark", icon: <Moon className="w-5 h-5" /> },
    { value: "system", label: "System", icon: <Monitor className="w-5 h-5" /> },
  ];

  const fontSizeOptions: { value: FontSize; label: string; preview: string }[] = [
    { value: "small", label: "Small", preview: "text-sm" },
    { value: "medium", label: "Medium", preview: "text-base" },
    { value: "large", label: "Large", preview: "text-lg" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your application preferences</p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        )}
      </div>

      {/* Appearance */}
      <div className="glass-card bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-teal-600" />
          Appearance
        </h2>

        {/* Theme Selection */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</p>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === option.value
                    ? "border-teal-500 bg-teal-50/50 dark:bg-teal-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    theme === option.value ? "text-teal-600 dark:text-teal-400" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {option.icon}
                </div>
                <span
                  className={`text-sm font-medium ${
                    theme === option.value ? "text-teal-700 dark:text-teal-300" : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Type className="w-4 h-4" />
            Font Size
          </p>
          <div className="grid grid-cols-3 gap-3">
            {fontSizeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFontSizeChange(option.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  fontSize === option.value
                    ? "border-teal-500 bg-teal-50/50 dark:bg-teal-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700"
                }`}
              >
                <span
                  className={`${option.preview} ${
                    fontSize === option.value ? "text-teal-700 dark:text-teal-300" : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Aa
                </span>
                <span
                  className={`text-sm font-medium ${
                    fontSize === option.value ? "text-teal-700 dark:text-teal-300" : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-600" />
          Notifications
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-3">
              {notifications ? (
                <Bell className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Push Notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Receive alerts for case updates and escalations</p>
              </div>
            </div>
            <button
              onClick={() => {
                setNotifications(!notifications);
                setHasChanges(true);
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifications ? "bg-teal-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  notifications ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Sound Alerts</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Play sound for critical notifications</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                setHasChanges(true);
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                soundEnabled ? "bg-teal-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  soundEnabled ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Display Preferences */}
      <div className="glass-card bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-teal-600" />
          Display Preferences
        </h2>

        <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Compact Mode</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Reduce spacing and show more content</p>
          </div>
          <button
            onClick={() => {
              setCompactMode(!compactMode);
              setHasChanges(true);
            }}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              compactMode ? "bg-teal-500" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                compactMode ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="glass-card bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-600" />
          Privacy & Security
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Session Timeout</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Automatically sign out after 15 minutes of inactivity</p>
              </div>
            </div>
            <span className="text-sm text-teal-600 dark:text-teal-400 font-medium">15 min</span>
          </div>

          <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Authentication</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-8">
              You are signed in as <span className="font-medium text-gray-700 dark:text-gray-200">{user?.email}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-8 mt-1">
              Authentication is managed through Microsoft Azure AD.
            </p>
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Reset to Defaults</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Restore all settings to their default values</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-xl transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
}
