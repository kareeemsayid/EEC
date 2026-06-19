import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";

export default function LoginPage() {
  const { login, profileLoading: loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#002D44] via-[#004060] to-[#003349]">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
      </div>

      {/* Animated floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating orbs with enhanced animations */}
        <div
          className="absolute top-0 left-0 w-[700px] h-[700px] bg-teal-500/20 rounded-full filter blur-[120px] animate-float-3d"
          style={{ animationDelay: "0s", animationDuration: "25s" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-500/15 rounded-full filter blur-[100px] animate-float-3d-reverse"
          style={{ animationDelay: "3s", animationDuration: "30s" }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-teal-400/10 rounded-full filter blur-[80px] animate-float-3d"
          style={{ animationDelay: "8s", animationDuration: "22s" }}
        />
        <div
          className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full filter blur-[70px] animate-float-3d-reverse"
          style={{ animationDelay: "12s", animationDuration: "28s" }}
        />

        {/* Geometric shapes with enhanced animations */}
        <div className="absolute top-16 left-16 w-24 h-24 border-2 border-teal-400/30 rotate-45 animate-float-spin" style={{ animationDelay: "1s", animationDuration: "15s" }} />
        <div className="absolute top-32 right-24 w-20 h-20 border-2 border-cyan-400/20 rounded-full animate-float-pulse" style={{ animationDelay: "3s", animationDuration: "12s" }} />
        <div className="absolute bottom-40 left-1/5 w-28 h-28 border-2 border-teal-500/15 rotate-12 animate-float-spin" style={{ animationDelay: "6s", animationDuration: "18s" }} />
        <div className="absolute bottom-24 right-16 w-16 h-16 bg-teal-400/15 rounded-lg rotate-45 animate-float-glow" style={{ animationDelay: "9s", animationDuration: "14s" }} />
        <div className="absolute top-1/3 left-1/6 w-12 h-12 border border-cyan-300/20 rounded-full animate-float-pulse" style={{ animationDelay: "4s", animationDuration: "10s" }} />
        <div className="absolute bottom-1/3 right-1/5 w-20 h-20 border-2 border-emerald-400/10 rotate-[30deg] animate-float-glow" style={{ animationDelay: "7s", animationDuration: "16s" }} />

        {/* Animated lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <line x1="0" y1="30%" x2="100%" y2="70%" stroke="url(#line-gradient)" strokeWidth="1" className="animate-line-draw" style={{ animationDuration: "8s" }} />
          <line x1="100%" y1="20%" x2="0%" y2="80%" stroke="url(#line-gradient)" strokeWidth="1" className="animate-line-draw" style={{ animationDuration: "10s", animationDelay: "2s" }} />
        </svg>

        {/* Grid overlay with subtle animation */}
        <div
          className="absolute inset-0 opacity-[0.04] animate-grid-shift"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Particle dots with enhanced animation */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-teal-400/40 rounded-full animate-particle-float"
            style={{
              left: `${(i * 3.3) % 100}%`,
              top: `${(i * 5.5) % 100}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${8 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div
          className={`w-full max-w-lg transition-all duration-1000 ease-out ${
            mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
          }`}
        >
          {/* Main card with enhanced 3D tilt effect */}
          <div className="group [transform-style:preserve-3d] [perspective:1200px]">
            <div
              className="relative bg-white/[0.03] backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/10 p-10 md:p-12 transition-all duration-700 group-hover:[transform:rotateY(-3deg)_rotateX(3deg)_scale(1.02)] group-hover:shadow-[0_25px_80px_-20px_rgba(13,148,136,0.4)] group-hover:border-white/25"
            >
              {/* Multi-layered glow effect behind card */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-cyan-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
              <div className="absolute inset-4 bg-gradient-to-tr from-teal-400/5 via-transparent to-emerald-400/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-80 transition-all duration-500" />

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-teal-400/30 rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-cyan-400/30 rounded-br-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Content */}
              <div className="relative z-10">
                {/* EEC Logo Area */}
                <div className="text-center mb-8">
                  <div
                    className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 shadow-xl shadow-teal-500/30 mb-5 animate-logo-glow relative overflow-hidden group/logo"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/logo:translate-x-full transition-transform duration-1000" />
                    <span className="text-4xl font-bold text-white tracking-tight relative z-10">EEC</span>
                  </div>
                  <div className="text-teal-400/80 text-xs tracking-[0.25em] uppercase font-medium">
                    Employee Exit Command Center
                  </div>
                </div>

                {/* App Title */}
                <div className="text-center mb-8">
                  <h1
                    className={`text-3xl md:text-4xl font-barlow-condensed font-bold text-white leading-tight tracking-wide transition-all duration-700 ${
                      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: "150ms" }}
                  >
                    ATTRITION<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-300 animate-gradient-shift">
                      MANAGEMENT SYSTEM
                    </span>
                  </h1>
                  <p
                    className={`text-teal-200/70 text-sm mt-4 transition-all duration-700 ${
                      mounted ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ transitionDelay: "250ms" }}
                  >
                    Concentrix · Training & People Solutions
                  </p>
                </div>

                {/* Feature list with staggered animation */}
                <div
                  className={`space-y-3 mb-8 transition-all duration-700 ${
                    mounted ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ transitionDelay: "350ms" }}
                >
                  {[
                    { icon: "📋", text: "Real-time attrition case tracking" },
                    { icon: "⚡", text: "SharePoint & Power Automate integration" },
                    { icon: "📧", text: "Automated email thread management" },
                    { icon: "🔍", text: "HR Investigation module" },
                  ].map((feature, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 text-gray-300 text-sm transition-all duration-500 ${
                        mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                      }`}
                      style={{ transitionDelay: `${400 + idx * 100}ms` }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-teal-500/15 flex items-center justify-center shrink-0 border border-teal-400/20">
                        <span className="text-sm">{feature.icon}</span>
                      </div>
                      <span className="font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Security notice */}
                <div
                  className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/5 mb-8 transition-all duration-700 ${
                    mounted ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ transitionDelay: "500ms" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0 border border-teal-400/20">
                      <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-teal-100 text-xs font-semibold">Authorized Concentrix trainers only.</p>
                      <p className="text-gray-500 text-xs mt-1">All actions are audited. Unauthorized use is prohibited.</p>
                    </div>
                  </div>
                </div>

                {/* Sign in button with enhanced hover */}
                <div
                  className={`transition-all duration-700 ${
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: "600ms" }}
                >
                  <button
                    onClick={login}
                    disabled={loading}
                    className="relative w-full bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 hover:from-teal-500 hover:via-teal-400 hover:to-cyan-400 text-white font-semibold py-4 rounded-xl transition-all duration-500 flex items-center justify-center gap-3 shadow-lg shadow-teal-900/30 hover:shadow-teal-500/30 hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group/btn"
                  >
                    {/* Multiple ripple effect overlays */}
                    <span className="absolute inset-0 bg-white/5 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />

                    {/* Glow border effect */}
                    <span className="absolute inset-0 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.3)" }} />

                    {loading ? (
                      <div className="flex items-center gap-3 relative z-10">
                        <LoadingSpinner size="sm" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <>
                        {/* Microsoft Logo */}
                        <svg className="w-5 h-5 relative z-10" viewBox="0 0 23 23">
                          <path fill="#f25022" d="M1 1h10v10H1z" />
                          <path fill="#00a4ef" d="M12 1h10v10H12z" />
                          <path fill="#7fba00" d="M1 12h10v10H1z" />
                          <path fill="#ffb900" d="M12 12h10v10H12z" />
                        </svg>
                        <span className="relative z-10 text-base">Sign in with Microsoft</span>
                        <svg className="w-4 h-4 relative z-10 opacity-0 group-hover/btn:opacity-100 transition-all duration-300 translate-x-2 group-hover/btn:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                {/* Footer */}
                <div
                  className={`mt-8 text-center transition-all duration-700 ${
                    mounted ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ transitionDelay: "700ms" }}
                >
                  <p className="text-gray-500 text-xs flex items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.07 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                      </svg>
                      Azure AD SSO
                    </span>
                    <span className="text-gray-600">·</span>
                    <span>Secured by Concentrix IT</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tagline below card */}
          <div
            className={`text-center mt-6 transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "800ms" }}
          >
            <p className="text-teal-400/50 text-xs tracking-[0.2em] uppercase">
              Empowering People · Transforming Business
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced custom animations */}
      <style>{`
        @keyframes float-3d {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          25% { transform: translateY(-40px) translateX(20px) scale(1.05); }
          50% { transform: translateY(-20px) translateX(-30px) scale(1); }
          75% { transform: translateY(-60px) translateX(10px) scale(1.02); }
        }
        @keyframes float-3d-reverse {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          25% { transform: translateY(50px) translateX(-20px) scale(1.05); }
          50% { transform: translateY(30px) translateX(40px) scale(1); }
          75% { transform: translateY(60px) translateX(-10px) scale(1.02); }
        }
        @keyframes float-spin {
          0%, 100% { transform: translateY(0) rotate(45deg); }
          33% { transform: translateY(-30px) rotate(90deg); }
          66% { transform: translateY(15px) rotate(135deg); }
        }
        @keyframes float-pulse {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-25px) scale(1.2); opacity: 0.6; }
        }
        @keyframes float-glow {
          0%, 100% { transform: translateY(0) rotate(45deg); box-shadow: 0 0 20px rgba(13, 148, 136, 0.2); }
          50% { transform: translateY(-20px) rotate(45deg); box-shadow: 0 0 40px rgba(13, 148, 136, 0.4); }
        }
        @keyframes logo-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(13, 148, 136, 0.3), 0 0 40px rgba(13, 148, 136, 0.2); }
          50% { box-shadow: 0 0 40px rgba(13, 148, 136, 0.5), 0 0 60px rgba(13, 148, 136, 0.3), 0 0 80px rgba(13, 148, 136, 0.1); }
        }
        @keyframes particle-float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
          25% { transform: translateY(-100px) translateX(30px); opacity: 0.8; }
          50% { transform: translateY(-50px) translateX(-20px); opacity: 0.4; }
          75% { transform: translateY(-150px) translateX(40px); opacity: 0.6; }
        }
        @keyframes grid-shift {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(20px) translateY(20px); }
        }
        @keyframes line-draw {
          0% { stroke-dashoffset: 1000; opacity: 0; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float-3d { animation: float-3d 25s ease-in-out infinite; }
        .animate-float-3d-reverse { animation: float-3d-reverse 30s ease-in-out infinite; }
        .animate-float-spin { animation: float-spin 15s ease-in-out infinite; }
        .animate-float-pulse { animation: float-pulse 12s ease-in-out infinite; }
        .animate-float-glow { animation: float-glow 14s ease-in-out infinite; }
        .animate-logo-glow { animation: logo-glow 3s ease-in-out infinite; }
        .animate-particle-float { animation: particle-float 10s ease-in-out infinite; }
        .animate-grid-shift { animation: grid-shift 30s ease-in-out infinite; }
        .animate-line-draw {
          stroke-dasharray: 1000;
          animation: line-draw 10s ease-in-out infinite;
        }
        .animate-gradient-shift {
          background-size: 200% auto;
          animation: gradient-shift 4s ease infinite;
        }
      `}</style>
    </div>
  );
}
