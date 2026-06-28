import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Palette, Bell, Monitor, Shield, RotateCcw, Sun, Moon, Volume2, VolumeX, Check, Keyboard, Save, Globe, ArrowLeft } from "lucide-react";

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

const TABS: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; description: string }[] = [
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme and font settings" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alert preferences" },
  { id: "display", label: "Display", icon: Monitor, description: "Layout and interface" },
  { id: "privacy", label: "Privacy", icon: Shield, description: "Data and visibility" },
  { id: "reset", label: "Reset", icon: RotateCcw, description: "Restore defaults" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
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
    } catch { /* no-op */ }
  }, [settings]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm font-medium mb-4 transition-colors hover:opacity-80"
          style={{ color: "#64748B" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SettingsIcon className="w-5 h-5" style={{ color: "#00C4B4" }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#00C4B4" }}>
                Customize Your Experience
              </span>
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#0D2B45", letterSpacing: "0.02em" }}>
              SETTINGS
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>
              Personalize your EEC workspace to match your preferences
            </p>
          </div>
        </div>
      </motion.div>

      {/* Saved indicator */}
      {saved && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg"
          style={{ background: "#00C4B4", color: "white" }}
        >
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Settings saved</span>
        </motion.div>
      )}

      {/* Main Layout */}
      <div className="flex gap-6">
        {/* Tabs Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-52 shrink-0"
        >
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {TABS.map((tab, i) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${
                  activeTab === tab.id
                    ? "border-l-2"
                    : "hover:bg-gray-50"
                }`}
                style={{
                  background: activeTab === tab.id ? "rgba(0,196,180,0.08)" : "transparent",
                  borderColor: activeTab === tab.id ? "#00C4B4" : "transparent",
                }}
              >
                <tab.icon
                  className="w-4 h-4 shrink-0"
                  style={{ color: activeTab === tab.id ? "#00C4B4" : "#94A3B8" }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${activeTab === tab.id ? "" : ""}`} style={{ color: activeTab === tab.id ? "#0D2B45" : "#64748B" }}>
                    {tab.label}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: "#94A3B8" }}>{tab.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {activeTab === "appearance" && <AppearanceTab settings={settings} updateSetting={updateSetting} />}
            {activeTab === "notifications" && <NotificationsTab settings={settings} updateSetting={updateSetting} />}
            {activeTab === "display" && <DisplayTab settings={settings} updateSetting={updateSetting} />}
            {activeTab === "privacy" && <PrivacyTab settings={settings} updateSetting={updateSetting} />}
            {activeTab === "reset" && <ResetTab settings={settings} updateSetting={updateSetting} />}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Appearance Tab ─── */
function AppearanceTab({ settings, updateSetting }: { settings: Settings; updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void }) {
  return (
    <div className="space-y-8">
      {/* Theme Section */}
      <SettingsSection icon={Palette} title="Theme" description="Choose your preferred color scheme">
        <div className="grid grid-cols-3 gap-3">
          {(["light", "dark", "system"] as const).map(theme => (
            <button
              key={theme}
              onClick={() => updateSetting("theme", theme)}
              className={`p-5 rounded-xl border-2 transition-all hover:shadow-md ${
                settings.theme === theme ? "border-teal-500" : "border-gray-100 hover:border-gray-200"
              }`}
              style={{ background: settings.theme === theme ? "rgba(0,196,180,0.05)" : "transparent" }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: settings.theme === theme ? "rgba(0,196,180,0.15)" : "rgba(0,0,0,0.05)" }}>
                  {theme === "light" ? <Sun className="w-6 h-6" style={{ color: "#F59E0B" }} /> :
                   theme === "dark" ? <Moon className="w-6 h-6" style={{ color: "#6366F1" }} /> :
                   <Monitor className="w-6 h-6" style={{ color: "#64748B" }} />}
                </div>
                <span className="text-sm font-medium capitalize" style={{ color: "#0D2B45" }}>{theme}</span>
              </div>
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Font Size */}
      <SettingsSection icon={Monitor} title="Font Size" description="Adjust text readability">
        <div className="flex gap-3">
          {(["small", "medium", "large"] as const).map(size => (
            <button
              key={size}
              onClick={() => updateSetting("fontSize", size)}
              className={`px-6 py-3 rounded-xl border-2 font-medium transition-all ${
                settings.fontSize === size ? "border-teal-500" : "border-gray-100 hover:border-gray-200"
              }`}
              style={{
                background: settings.fontSize === size ? "rgba(0,196,180,0.08)" : "transparent",
                color: settings.fontSize === size ? "#00C4B4" : "#64748B",
              }}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Language */}
      <SettingsSection icon={Globe} title="Language" description="Select your preferred language">
        <select
          value={settings.language}
          onChange={(e) => updateSetting("language", e.target.value)}
          className="w-full max-w-xs px-4 py-2.5 rounded-xl border outline-none focus:border-teal-500 transition-colors"
          style={{ borderColor: "#E2E8F0", color: "#0D2B45" }}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>
      </SettingsSection>
    </div>
  );
}

/* ─── Notifications Tab ─── */
function NotificationsTab({ settings, updateSetting }: { settings: Settings; updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void }) {
  return (
    <div className="space-y-6">
      <SettingsSection icon={Bell} title="Notifications" description="Control how you receive alerts">
        <div className="space-y-4">
          <ToggleRow
            icon={Bell}
            label="In-app notifications"
            description="Show notifications within the application"
            value={settings.notifications}
            onChange={v => updateSetting("notifications", v)}
          />
          <ToggleRow
            icon={Sun}
            label="Email notifications"
            description="Receive email alerts for critical updates"
            value={settings.emailNotifications}
            onChange={v => updateSetting("emailNotifications", v)}
          />
          <ToggleRow
            icon={settings.soundEffects ? Volume2 : VolumeX}
            label="Sound effects"
            description="Play sound for notifications and interactions"
            value={settings.soundEffects}
            onChange={v => updateSetting("soundEffects", v)}
          />
        </div>
      </SettingsSection>
    </div>
  );
}

/* ─── Display Tab ─── */
function DisplayTab({ settings, updateSetting }: { settings: Settings; updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void }) {
  return (
    <div className="space-y-6">
      <SettingsSection icon={Monitor} title="Display" description="Customize your interface layout">
        <div className="space-y-4">
          <ToggleRow
            icon={Monitor}
            label="Compact mode"
            description="Reduce spacing for denser information display"
            value={settings.compactMode}
            onChange={v => updateSetting("compactMode", v)}
          />
          <ToggleRow
            icon={Keyboard}
            label="Keyboard shortcuts"
            description="Enable keyboard shortcuts for quick navigation"
            value={settings.keyboardShortcuts}
            onChange={v => updateSetting("keyboardShortcuts", v)}
          />
          <ToggleRow
            icon={Save}
            label="Auto-save"
            description="Automatically save form data"
            value={settings.autoSave}
            onChange={v => updateSetting("autoSave", v)}
          />
        </div>
      </SettingsSection>
    </div>
  );
}

/* ─── Privacy Tab ─── */
function PrivacyTab({ settings, updateSetting }: { settings: Settings; updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void }) {
  return (
    <div className="space-y-6">
      <SettingsSection icon={Shield} title="Privacy" description="Manage your data and visibility">
        <div className="space-y-4">
          <ToggleRow
            icon={Sun}
            label="Show online status"
            description="Let others see when you are online"
            value={settings.showOnlineStatus}
            onChange={v => updateSetting("showOnlineStatus", v)}
          />
          <ToggleRow
            icon={Shield}
            label="Allow data collection"
            description="Help improve EEC by sharing anonymous usage data"
            value={settings.allowDataCollection}
            onChange={v => updateSetting("allowDataCollection", v)}
          />
        </div>
      </SettingsSection>
    </div>
  );
}

/* ─── Reset Tab ─── */
function ResetTab({ settings, updateSetting }: { settings: Settings; updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void }) {
  const handleReset = () => {
    try {
      localStorage.removeItem("eec-settings");
    } catch { /* no-op */ }
    Object.keys(DEFAULT_SETTINGS).forEach(key => {
      updateSetting(key as keyof Settings, DEFAULT_SETTINGS[key as keyof Settings]);
    });
  };

  return (
    <div className="space-y-6">
      <SettingsSection icon={RotateCcw} title="Reset Settings" description="Restore all preferences to defaults">
        <div className="rounded-xl p-5 border" style={{ background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.2)" }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.15)" }}>
              <RotateCcw className="w-5 h-5" style={{ color: "#F59E0B" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "#0D2B45" }}>Reset all preferences</p>
              <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
                This will reset all your settings to their default values. This action cannot be undone.
              </p>
              <button
                onClick={handleReset}
                className="mt-4 px-5 py-2.5 rounded-xl font-medium text-sm transition-all hover:shadow-md"
                style={{ background: "#F59E0B", color: "white" }}
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

/* ─── Settings Section ─── */
function SettingsSection({ icon: Icon, title, description, children }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,196,180,0.1)" }}>
          <Icon className="w-4 h-4" style={{ color: "#00C4B4" }} />
        </div>
        <div>
          <h3 className="font-semibold" style={{ color: "#0D2B45" }}>{title}</h3>
          <p className="text-xs" style={{ color: "#94A3B8" }}>{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─── Toggle Row ─── */
function ToggleRow({ icon: Icon, label, description, value, onChange }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl transition-colors hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 shrink-0" style={{ color: "#94A3B8" }} />
        <div>
          <p className="text-sm font-medium" style={{ color: "#0D2B45" }}>{label}</p>
          <p className="text-xs" style={{ color: "#94A3B8" }}>{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-all relative ${value ? "shadow-md" : ""}`}
        style={{ background: value ? "#00C4B4" : "#CBD5E1" }}
      >
        <motion.div
          animate={{ x: value ? 24 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}
