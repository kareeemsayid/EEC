import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { UserRole } from "../auth/useAuth";
import { Shield, TriangleAlert as AlertTriangle, Home, Mail, ArrowLeft } from "lucide-react";

interface AccessDeniedProps {
  requiredRoles?: UserRole[];
  userRole?: UserRole;
  fallbackPath?: string;
}

export default function AccessDenied({ requiredRoles, userRole, fallbackPath = "/" }: AccessDeniedProps) {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(fallbackPath);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/20 to-white p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative max-w-lg w-full"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6 text-white">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <Shield className="w-7 h-7" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold">Access Restricted</h1>
                <p className="text-sm text-white/80 mt-0.5">Permission required</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Warning message */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-6">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Restricted Area</p>
                <p className="text-sm text-amber-700 mt-1">
                  You don't have the required permissions to access this page.
                </p>
              </div>
            </div>

            {/* Role info */}
            {requiredRoles && (
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-sm text-slate-600">Your role:</span>
                  <span className="text-sm font-semibold text-slate-800 bg-slate-200 px-2 py-0.5 rounded-lg">
                    {userRole || "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50">
                  <span className="text-sm text-teal-700">Required role(s):</span>
                  <div className="flex gap-1.5">
                    {requiredRoles.map((role) => (
                      <span
                        key={role}
                        className="text-xs font-semibold text-teal-800 bg-teal-200 px-2 py-0.5 rounded-lg"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Contact info */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">
                Need access?
              </p>
              <p className="text-sm text-slate-600 mb-3">
                Contact your manager or the admin team to request access.
              </p>
              <a
                href="mailto:Training.AttritionCommandCenter@concentrix.com"
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Training.AttritionCommandCenter@concentrix.com
              </a>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                onClick={handleGoBack}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </motion.button>
              <motion.button
                onClick={() => navigate(fallbackPath)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl transition-all"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </motion.button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-slate-400">EEC - Employee Exit Command Center</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
