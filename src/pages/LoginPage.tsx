import React from "react";
import { useAuth } from "../auth/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";

export default function LoginPage() {
  const { login, profileLoading: loading } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-slate-800 to-gray-900 animate-gradient-xy" />

      {/* Floating particles / blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Stars / twinkling effect */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] bg-repeat opacity-30" />

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        {/* Card with CSS 3D tilt on hover */}
        <div className="group w-full max-w-md transition-all duration-500 ease-out [transform-style:preserve-3d] hover:scale-105 hover:rotate-1 hover:shadow-2xl">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transition-all duration-300 group-hover:bg-white/15">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse-glow">
                <span className="text-white font-mono font-black text-3xl tracking-tighter drop-shadow-lg">
                  EEC
                </span>
              </div>
            </div>

            <h1 className="text-center text-4xl font-bold text-white font-display tracking-tight drop-shadow-lg">
              EMPLOYEE EXIT<br />COMMAND CENTER
            </h1>
            <p className="text-center text-teal-200 mt-1 text-sm">
              Concentrix · Trainer Portal
            </p>

            {/* Feature list */}
            <div className="mt-6 space-y-2 text-sm text-gray-200">
              <div className="flex items-center gap-2 animate-fade-in-left" style={{ animationDelay: "0.1s" }}>
                <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                </div>
                <span>Real‑time attrition case tracking</span>
              </div>
              <div className="flex items-center gap-2 animate-fade-in-left" style={{ animationDelay: "0.2s" }}>
                <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                </div>
                <span>SharePoint & Power Automate integration</span>
              </div>
              <div className="flex items-center gap-2 animate-fade-in-left" style={{ animationDelay: "0.3s" }}>
                <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                </div>
                <span>Automated email thread management</span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10">
              <p className="text-xs text-teal-100 font-medium">🔐 Authorized Concentrix trainers only.</p>
              <p className="text-xs text-teal-200/80 mt-0.5">All actions are audited. Unauthorized use is prohibited.</p>
            </div>

            {/* Sign in button */}
            <button
              onClick={login}
              disabled={loading}
              className="relative mt-8 w-full bg-white hover:bg-gray-100 text-teal-800 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group/btn"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 23 23" fill="currentColor">
                    <path d="M1 1h10v10H1zM12 1h10v10H12zM1 12h10v10H1zM12 12h10v10H12z" />
                  </svg>
                  Sign in with Microsoft
                  <span className="absolute inset-0 bg-teal-50/20 transform -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-teal-200/60 mt-6">
              Azure AD SSO · Secured by Concentrix IT
            </p>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes gradientXY {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4); }
          50% { box-shadow: 0 0 0 15px rgba(20, 184, 166, 0); }
        }
        .animate-gradient-xy {
          background-size: 400% 400%;
          animation: gradientXY 15s ease infinite;
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-slide-up-fade { animation: slideUpFade 0.8s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards; }
        .animate-fade-in-left {
          opacity: 0;
          animation: fadeInLeft 0.5s ease forwards;
        }
        .animate-pulse-glow {
          animation: pulseGlow 2s infinite;
        }
      `}</style>
    </div>
  );
}
