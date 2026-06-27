import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ChevronLeft, Settings as SettingsIcon, Palette, Bell, Monitor, Shield, RotateCcw, Sun, Moon, Volume2, VolumeX, Check, Keyboard, Save } from "lucide-react";

type SettingsTab = "appearance" | "notifications" | "display" | "privacy" | "reset";

interface Settings {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  notifications: boolean;
  emailNotifications: boolean;
  soundEffects: boolean;
  compactMode: boolean;
  showOnlineStatus: boolean;
  allowDataCollection: boolean;
  keyboardShortcuts: boolean;
  autoSave: boolean;
  language: string;
}

const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  fontSize: "medium",
  notifications: true,
  emailNotifications: true,
  soundEffects: false,
  compactMode: false,
  showOnlineStatus: true,
  allowDataCollection: false,
  keyboardShortcuts: true,
  autoSave: true,
  language: "en",
};

const TABS: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "display", label: "Display", icon: Monitor },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "reset", label: "Reset", icon: RotateCcw },
];

export default function SettingsPage() {
  useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem("eec-settings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("eec-settings", JSON.stringify(settings));
    } catch {
      /* no-op */
    }
  }, [settings]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SettingsIcon className="w-5 h-5 text-teal-500" />
            <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">Preferences</span>
          </div>
          <h1 className="font-barlow-condensed text-3xl font-bold text-gray-900 tracking-wide">
            SETTINGS
          </h1>
          <p className="text-gray-500 text-sm mt-1">Customize your EEC experience</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Saved indicator */}
      {saved && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-xl shadow-glow-teal animate-fade-in">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Settings saved</span>
        </div>
      )}

      <div className="flex gap-6">
        {/* Tabs */}
        <div className="w-48 shrink-0">
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-glass overflow-hidden">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? "bg-teal-50 text-teal-700 border-l-2 border-teal-500"
                    : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass p-6">
            {activeTab === "appearance" && (
              <AppearanceTab settings={settings} updateSetting={updateSetting} />
            )}
            {activeTab === "notifications" && (
              <NotificationsTab settings={settings} updateSetting={updateSetting} />
            )}
            {activeTab === "display" && (
              <DisplayTab settings={settings} updateSetting={updateSetting} />
            )}
            {activeTab === "privacy" && (
              <PrivacyTab settings={settings} updateSetting={updateSetting} />
            )}
            {activeTab === "reset" && (
              <ResetTab settings={settings} updateSetting={updateSetting} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AppearanceTab({ settings, updateSetting }: { settings: Settings; updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {(["light", "dark", "system"] as const).map(theme => (
            <button
              key={theme}
              onClick={() => updateSetting("theme", theme)}
              className={`p-4 rounded-xl border-2 transition-all ${
                settings.theme === theme
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                {theme === "light" ? <Sun className="w-6 h-6 text-amber-500" /> :
                 theme === "dark" ? <Moon className="w-6 h-6 text-indigo-500" /> :
                 <Monitor className="w-6 h-6 text-gray-500" />}
                <span className="text-sm font-medium capitalize">{theme}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide mb-4">Font Size</h3>
        <div className="flex gap-3">
          {(["small", "medium", "large"] as const).map(size => (
            <button
              key={size}
              onClick={() => updateSetting("fontSize", size)}
              className={`px-6 py-2 rounded-lg border-2 transition-all ${
                settings.fontSize === size
                  ? "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-sm font-medium capitalize">{size}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsTab({ settings, updateSetting }: { settings: Settings; updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide mb-4">Notifications</h3>
      <ToggleRow
        label="In-app notifications"
        description="Show notifications within the application"
        value={settings.notifications}
        onChange={v => updateSetting("notifications", v)}
      />
      <ToggleRow
        label="Email notifications"
        description="Receive email alerts for critical updates"
        value={settings.emailNotifications}
        onChange={v => updateSetting("emailNotifications", v)}
      />
      <ToggleRow
        label="Sound effects"
        description="Play sound for notifications and interactions"
        value={settings.soundEffects}
        onChange={v => updateSetting("soundEffects", v)}
        icon={settings.soundEffects ? Volume2 : VolumeX}
      />
    </div>
  );
}

function DisplayTab({ settings, updateSetting }: { settings: Settings; updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide mb-4">Display</h3>
      <ToggleRow
        label="Compact mode"
        description="Reduce spacing for denser information display"
        value={settings.compactMode}
        onChange={v => updateSetting("compactMode", v)}
      />
      <ToggleRow
        label="Keyboard shortcuts"
        description="Enable keyboard shortcuts for quick navigation"
        value={settings.keyboardShortcuts}
        onChange={v => updateSetting("keyboardShortcuts", v)}
        icon={Keyboard}
      />
      <ToggleRow
        label="Auto-save"
        description="Automatically save form data"
        value={settings.autoSave}
        onChange={v => updateSetting("autoSave", v)}
        icon={Save}
      />
    </div>
  );
}

function PrivacyTab({ settings, updateSetting }: { settings: Settings; updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide mb-4">Privacy</h3>
      <ToggleRow
        label="Show online status"
        description="Let others see when you are online"
        value={settings.showOnlineStatus}
        onChange={v => updateSetting("showOnlineStatus", v)}
      />
      <ToggleRow
        label="Allow data collection"
        description="Help improve EEC by sharing anonymous usage data"
        value={settings.allowDataCollection}
        onChange={v => updateSetting("allowDataCollection", v)}
      />
    </div>
  );
}

function ResetTab({ settings, updateSetting }: { settings: Settings; updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void }) {
  const handleReset = () => {
    try {
      localStorage.removeItem("eec-settings");
    } catch {
      /* no-op */
    }
    Object.keys(DEFAULT_SETTINGS).forEach(key => {
      updateSetting(key as keyof Settings, DEFAULT_SETTINGS[key as keyof Settings]);
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="font-barlow-condensed font-semibold text-lg text-gray-900 tracking-wide mb-4">Reset Settings</h3>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800 font-medium mb-3">
          This will reset all your settings to their default values.
        </p>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, value, onChange, icon: Icon }: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-all ${value ? "bg-gradient-teal shadow-glow-teal" : "bg-gray-300"} relative`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${value ? "translate-x-5" : "translate-x-1"}`} />
      </button>
    </div>
  );
}
