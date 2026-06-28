import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useThemeContext } from "../context/ThemeContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Monitor, RotateCcw, Save, Shield, Palette, Volume2, Eye, Lock, ArrowLeft, Bell, BellOff, Type, Zap, LayoutTemplate, Contrast, ChevronRight, Check, User, Laptop, MoonStar, Sparkles, Keyboard, MousePointerClick, FileText, Clock, ShieldCheck, EyeOff, Ruler, Download, Trash2, TriangleAlert as AlertTriangle, Globe, Info } from "lucide-react";

type Theme = "light" | "dark" | "system";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ctx = useThemeContext();
  const { settings, isDark, setTheme, setNotifications, setSoundEnabled,
    setCompactMode, setReducedMotion, setHighContrast, setFontSize,
    setSidebarCollapsed, setLanguage, resetSettings } = ctx;

  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"appearance" | "notifications" | "display" | "privacy" | "advanced">("appearance");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const markChanged = () => setHasChanges(true);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    markChanged();
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    markChanged();
  };

  const handleReset = () => {
    resetSettings();
    setHasChanges(false);
    toast.success("All settings reset to defaults");
  };

  const handleSave = () => {
    setHasChanges(false);
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 2000);
    toast.success("Settings saved successfully");
  };

  const handleExportData = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        displayName: user?.displayName,
        email: user?.email,
        role: user?.role,
        jobTitle: user?.jobTitle,
        department: user?.department,
      },
      settings: settings,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eec-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Settings exported successfully");
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    toast.error("Account deletion is not available in this demo");
    setShowDeleteModal(false);
    setDeleteConfirmText("");
  };

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "light", label: "Light", icon: <Sun className="w-5 h-5" />, desc: "Clean and bright" },
    { value: "dark", label: "Dark", icon: <Moon className="w-5 h-5" />, desc: "Easy on the eyes" },
    { value: "system", label: "System", icon: <Monitor className="w-5 h-5" />, desc: "Follows your OS" },
  ];

  const fontSizeOptions: { value: "small" | "normal" | "large"; label: string; sample: string }[] = [
    { value: "small", label: "Small", sample: "Aa" },
    { value: "normal", label: "Normal", sample: "Aa" },
    { value: "large", label: "Large", sample: "Aa" },
  ];

  const tabs = [
    { id: "appearance" as const, label: "Appearance", icon: Palette },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "display" as const, label: "Display", icon: Eye },
    { id: "privacy" as const, label: "Privacy", icon: Shield },
    { id: "advanced" as const, label: "Advanced", icon: Zap },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-white border text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">Customize your workspace experience</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {showSaveConfirm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                Saved
              </motion.div>
            )}
          </AnimatePresence>
          {hasChanges && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-teal-500/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save className="w-4 h-4" />
              Save Changes
            </motion.button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 space-y-1 sticky top-4">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${
                    isActive
                      ? "bg-teal-50 text-teal-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ x: 4 }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-teal-500"
                      initial={{ height: 0 }}
                      animate={{ height: 24 }}
                    />
                  )}
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-teal-600" : "text-gray-400"}`} />
                  {tab.label}
                  <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isActive ? "rotate-90 text-teal-500" : "text-gray-300"}`} />
                </motion.button>
              );
            })}
            <div className="pt-2 mt-2 border-t border-gray-100">
              <motion.button
                onClick={handleReset}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
                whileHover={{ x: 4 }}
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-9 space-y-5">
          <AnimatePresence mode="wait">
            {activeTab === "appearance" && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                {/* Theme */}
                <SectionCard icon={<Palette className="w-5 h-5 text-teal-600" />} title="Theme">
                  <div className="grid grid-cols-3 gap-3">
                    {themeOptions.map((option, idx) => (
                      <motion.button
                        key={option.value}
                        onClick={() => handleThemeChange(option.value)}
                        className={`relative flex flex-col items-center gap-2.5 p-5 rounded-xl border-2 transition-all ${
                          settings.theme === option.value
                            ? "border-teal-500 bg-teal-50/60"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                            settings.theme === option.value ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-500"
                          }`}
                          animate={settings.theme === option.value ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {option.icon}
                        </motion.div>
                        <div className="text-center">
                          <span className={`text-sm font-semibold block ${settings.theme === option.value ? "text-teal-700" : "text-gray-700"}`}>
                            {option.label}
                          </span>
                          <span className="text-[11px] text-gray-400">{option.desc}</span>
                        </div>
                        {settings.theme === option.value && (
                          <motion.div
                            className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </SectionCard>

                {/* Language */}
                <SectionCard icon={<Globe className="w-5 h-5 text-blue-500" />} title="Language">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LANGUAGES.map((lang, idx) => (
                      <motion.button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                          settings.language === lang.code
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className={`text-sm font-medium ${settings.language === lang.code ? "text-teal-700" : "text-gray-700"}`}>
                          {lang.name}
                        </span>
                        {settings.language === lang.code && (
                          <Check className="w-4 h-4 ml-auto text-teal-500" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </SectionCard>

                {/* Accent Preview */}
                <SectionCard icon={<Sparkles className="w-5 h-5 text-amber-500" />} title="Preview">
                  <div className={`p-5 rounded-xl transition-colors ${isDark ? "bg-[#0F2841] border border-[#1A3A5C]" : "bg-gray-50 border border-gray-100"}`}>
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {user?.displayName?.charAt(0) || "U"}
                      </motion.div>
                      <div>
                        <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                          {user?.displayName || "User Name"}
                        </p>
                        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {user?.jobTitle || user?.role || "Team Member"}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <SectionCard icon={<Bell className="w-5 h-5 text-teal-600" />} title="Notification Preferences">
                  <div className="space-y-3">
                    <ToggleRow
                      icon={settings.notifications ? <Bell className="w-5 h-5 text-teal-600" /> : <BellOff className="w-5 h-5 text-gray-400" />}
                      title="Push Notifications"
                      description="Receive alerts for case updates, escalations, and assignments"
                      value={settings.notifications}
                      onChange={(v) => { setNotifications(v); markChanged(); }}
                    />
                    <ToggleRow
                      icon={<Volume2 className="w-5 h-5 text-gray-600" />}
                      title="Sound Alerts"
                      description="Play sound for critical notifications and urgent actions"
                      value={settings.soundEnabled}
                      onChange={(v) => { setSoundEnabled(v); markChanged(); }}
                    />
                  </div>
                </SectionCard>

                <SectionCard icon={<ShieldCheck className="w-5 h-5 text-blue-500" />} title="Notification Types">
                  <div className="space-y-3">
                    <InfoRow icon={<FileText className="w-4 h-4" />} label="Case Updates" value="All cases you own or follow" />
                    <InfoRow icon={<Zap className="w-4 h-4" />} label="Escalations" value="Critical and high-risk alerts" />
                    <InfoRow icon={<Clock className="w-4 h-4" />} label="SLA Reminders" value="48h, 24h, and 4h warnings" />
                    <InfoRow icon={<User className="w-4 h-4" />} label="Mentions" value="When someone tags you in a comment" />
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {activeTab === "display" && (
              <motion.div
                key="display"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <SectionCard icon={<Eye className="w-5 h-5 text-teal-600" />} title="Display Preferences">
                  <div className="space-y-3">
                    <ToggleRow
                      icon={<LayoutTemplate className="w-5 h-5 text-gray-600" />}
                      title="Compact Mode"
                      description="Reduce spacing and padding to show more content per screen"
                      value={settings.compactMode}
                      onChange={(v) => { setCompactMode(v); markChanged(); }}
                    />
                    <ToggleRow
                      icon={<MoonStar className="w-5 h-5 text-gray-600" />}
                      title="Reduced Motion"
                      description="Minimize animations for accessibility and performance"
                      value={settings.reducedMotion}
                      onChange={(v) => { setReducedMotion(v); markChanged(); }}
                    />
                    <ToggleRow
                      icon={<Contrast className="w-5 h-5 text-gray-600" />}
                      title="High Contrast"
                      description="Increase contrast ratios for better readability"
                      value={settings.highContrast}
                      onChange={(v) => { setHighContrast(v); markChanged(); }}
                    />
                    <ToggleRow
                      icon={<Laptop className="w-5 h-5 text-gray-600" />}
                      title="Collapsed Sidebar"
                      description="Keep the sidebar collapsed by default for more workspace"
                      value={settings.sidebarCollapsed}
                      onChange={(v) => { setSidebarCollapsed(v); markChanged(); }}
                    />
                  </div>
                </SectionCard>

                <SectionCard icon={<Type className="w-5 h-5 text-purple-500" />} title="Font Size">
                  <div className="grid grid-cols-3 gap-3">
                    {fontSizeOptions.map((opt, idx) => (
                      <motion.button
                        key={opt.value}
                        onClick={() => { setFontSize(opt.value); markChanged(); }}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                          settings.fontSize === opt.value
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className={`font-bold ${opt.value === "small" ? "text-lg" : opt.value === "large" ? "text-2xl" : "text-xl"} ${settings.fontSize === opt.value ? "text-teal-700" : "text-gray-600"}`}>
                          {opt.sample}
                        </span>
                        <p className={`text-xs mt-1 font-medium ${settings.fontSize === opt.value ? "text-teal-600" : "text-gray-500"}`}>
                          {opt.label}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {activeTab === "privacy" && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <SectionCard icon={<Shield className="w-5 h-5 text-teal-600" />} title="Privacy & Security">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Session Timeout</p>
                          <p className="text-xs text-gray-500">Auto sign-out after 15 minutes of inactivity</p>
                        </div>
                      </div>
                      <span className="text-sm text-teal-600 font-semibold">15 min</span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-gray-600" />
                        <p className="text-sm font-medium text-gray-800">Authentication</p>
                      </div>
                      <p className="text-xs text-gray-500 ml-8">
                        Signed in as <span className="font-medium text-gray-700">{user?.email}</span>
                      </p>
                      <p className="text-xs text-gray-500 ml-8 mt-1">
                        Managed through Microsoft Azure AD. Your session is encrypted and secure.
                      </p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <EyeOff className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Activity Logging</p>
                          <p className="text-xs text-gray-500">All actions are logged for audit compliance</p>
                        </div>
                      </div>
                      <span className="text-sm text-emerald-600 font-semibold">Enabled</span>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard icon={<User className="w-5 h-5 text-blue-500" />} title="Your Profile">
                  <div className="space-y-3">
                    <InfoRow icon={<User className="w-4 h-4" />} label="Display Name" value={user?.displayName || "—"} />
                    <InfoRow icon={<BriefcaseIcon />} label="Job Title" value={user?.jobTitle || "—"} />
                    <InfoRow icon={<Shield className="w-4 h-4" />} label="Role" value={user?.role || "—"} />
                    <InfoRow icon={<Lock className="w-4 h-4" />} label="Email" value={user?.email || "—"} />
                  </div>
                </SectionCard>

                {/* Export & Delete */}
                <SectionCard icon={<Download className="w-5 h-5 text-emerald-500" />} title="Data Management">
                  <div className="space-y-3">
                    <motion.div
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Export Your Data</p>
                          <p className="text-xs text-gray-500">Download a copy of your settings and preferences</p>
                        </div>
                      </div>
                      <motion.button
                        onClick={handleExportData}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </motion.button>
                    </motion.div>

                    <motion.div
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}
                    >
                      <div className="flex items-center gap-3">
                        <Trash2 className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium text-red-700">Delete Account</p>
                          <p className="text-xs text-red-500">Permanently remove your account and all data</p>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-red-500 text-white hover:bg-red-600"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </motion.button>
                    </motion.div>
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {activeTab === "advanced" && (
              <motion.div
                key="advanced"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <SectionCard icon={<Zap className="w-5 h-5 text-amber-500" />} title="Advanced Options">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Keyboard className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Keyboard Shortcuts</p>
                          <p className="text-xs text-gray-500">Press ? anywhere to open the command palette</p>
                        </div>
                      </div>
                      <span className="text-sm text-teal-600 font-semibold">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <MousePointerClick className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Auto-save Drafts</p>
                          <p className="text-xs text-gray-500">Forms are saved automatically every 30 seconds</p>
                        </div>
                      </div>
                      <span className="text-sm text-teal-600 font-semibold">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Version</p>
                          <p className="text-xs text-gray-500">EEC Platform v2.5.0</p>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 font-medium">Latest</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Ruler className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Clear Cache</p>
                          <p className="text-xs text-gray-500">Reset local data and force a fresh sync</p>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => {
                          localStorage.removeItem("eec-settings-v2");
                          toast.success("Local cache cleared. Reloading...");
                          setTimeout(() => window.location.reload(), 1500);
                        }}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Clear
                      </motion.button>
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowDeleteModal(false)}
            />
            <motion.div
              className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                This will permanently delete your account, including all your settings, preferences, and local data. Please type <span className="font-bold text-red-600">DELETE</span> to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 outline-none transition-colors mb-4"
              />
              <div className="flex gap-3">
                <motion.button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleDeleteAccount}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                    deleteConfirmText === "DELETE"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  whileHover={deleteConfirmText === "DELETE" ? { scale: 1.02 } : {}}
                  whileTap={deleteConfirmText === "DELETE" ? { scale: 0.98 } : {}}
                >
                  Delete Account
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <motion.div
      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium text-gray-800">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <motion.button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-full transition-colors ${value ? "bg-teal-500" : "bg-gray-300"}`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform"
          animate={{ x: value ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </motion.div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5 text-gray-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
