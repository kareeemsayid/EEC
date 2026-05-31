import React from "react";
import { useAuth } from "../auth/useAuth";
import { InteractionStatus } from "@azure/msal-browser";

export default function LoginPage() {
  const { login, inProgress } = useAuth();
  const isLoading = inProgress !== InteractionStatus.None;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-sm">
              <span className="text-white font-mono font-bold text-xl tracking-tight">EEC</span>
            </div>
          </div>

          <h1 className="font-barlow-condensed font-bold text-3xl text-gray-900 tracking-wide mb-1">
            EMPLOYEE EXIT COMMAND CENTER
          </h1>
          <p className="text-sm text-gray-500 tracking-widest uppercase font-barlow mb-8">
            Concentrix · Trainer Portal
          </p>

          <div className="space-y-3 text-left mb-8">
            {[
              "Real-time attrition case tracking",
              "SharePoint & Power Automate integration",
              "Automated email thread management",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                {feat}
              </div>
            ))}
          </div>

          <button
            onClick={login}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg viewBox="0 0 23 23" className="w-5 h-5" fill="currentColor">
                <path d="M1 1h10v10H1zM12 1h10v10H12zM1 12h10v10H1zM12 12h10v10H12z" />
              </svg>
            )}
            {isLoading ? "Signing in…" : "Sign in with Microsoft"}
          </button>

          <p className="text-xs text-gray-400 mt-4">
            Azure AD SSO · Secured by Concentrix IT
          </p>
        </div>
      </div>
    </div>
  );
}
