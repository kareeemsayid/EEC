import React from "react";
import { Clock, LogOut, RefreshCw } from "lucide-react";

interface SessionTimeoutModalProps {
  isOpen: boolean;
  timeRemaining: number;
  onStaySignedIn: () => void;
  onLogout: () => void;
}

export default function SessionTimeoutModal({
  isOpen,
  timeRemaining,
  onStaySignedIn,
  onLogout,
}: SessionTimeoutModalProps) {
  if (!isOpen) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm"
        onClick={onLogout}
      />
      <div className="relative bg-dark-900 border border-white/10 rounded-2xl shadow-glass-lg max-w-sm w-full p-6 animate-scale-in">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse-slow">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        <h2 className="text-xl font-barlow-condensed font-bold text-white text-center mb-2">
          Session Timeout Warning
        </h2>

        <p className="text-gray-400 text-sm text-center mb-4">
          Your session will expire in
        </p>

        <div className="bg-dark-800 rounded-xl py-4 px-6 mb-6 border border-white/5">
          <p className="text-4xl font-mono font-bold text-amber-500 text-center animate-pulse">
            {formattedTime}
          </p>
        </div>

        <p className="text-xs text-gray-500 text-center mb-6">
          Due to inactivity, you will be automatically signed out for security reasons.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <button
            onClick={onStaySignedIn}
            className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-glow-teal flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Stay Signed In
          </button>
        </div>
      </div>
    </div>
  );
}
