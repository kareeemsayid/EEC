import React, { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useAuth, UserRole } from "../auth/useAuth";
import AccessDenied from "./AccessDenied";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallbackPath?: string;
}

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

// Loading screen with creative animation
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-white">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Outer ring animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 rounded-full border-4 border-transparent border-t-teal-500 border-r-teal-500/50"
            />
          </div>
          {/* Inner pulse */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white font-barlow-condensed text-2xl font-bold"
            >
              E
            </motion.span>
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-slate-600 font-medium"
        >
          Authenticating...
        </motion.p>
      </div>
    </div>
  );
}

// Get the default dashboard path for each role
function getRoleDashboardPath(role?: UserRole): string {
  switch (role) {
    case "PS":
    case "TA":
    case "SrManager":
      return "/ps-dashboard";
    case "Supervisor":
      return "/dashboard/supervisor";
    case "Manager":
      return "/dashboard/manager";
    case "Trainer":
    default:
      return "/";
  }
}

// Main ProtectedRoute component
export default function ProtectedRoute({
  children,
  allowedRoles,
  fallbackPath = "/",
}: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();
  const { user, profileLoading } = useAuth();
  const location = useLocation();

  // MSAL is still initializing
  if (inProgress !== InteractionStatus.None) {
    return <LoadingScreen />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but still loading profile
  if (profileLoading || !user) {
    return <LoadingScreen />;
  }

  // Check role access
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <AccessDenied
          requiredRoles={allowedRoles}
          userRole={user.role}
          fallbackPath={getRoleDashboardPath(user.role)}
        />
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for checking permissions
export function usePermissions() {
  const { user } = useAuth();

  const canViewAllCases = useMemo(() => {
    return ["PS", "TA", "SrManager", "Admin"].includes(user?.role || "");
  }, [user?.role]);

  const canApproveTermination = useMemo(() => {
    return ["PS", "TA", "Admin"].includes(user?.role || "");
  }, [user?.role]);

  const canManageRelocations = useMemo(() => {
    return ["PS", "TA", "SrManager", "Admin"].includes(user?.role || "");
  }, [user?.role]);

  const canRequestInvestigation = useMemo(() => {
    return user?.role === "Trainer";
  }, [user?.role]);

  const canTransferCases = useMemo(() => {
    return ["PS", "Admin"].includes(user?.role || "");
  }, [user?.role]);

  const isManager = useMemo(() => {
    return ["Manager", "SrManager"].includes(user?.role || "");
  }, [user?.role]);

  const isSupervisor = useMemo(() => {
    return user?.role === "Supervisor";
  }, [user?.role]);

  const isTrainer = useMemo(() => {
    return user?.role === "Trainer";
  }, [user?.role]);

  const isPS = useMemo(() => {
    return user?.role === "PS";
  }, [user?.role]);

  const isTA = useMemo(() => {
    return user?.role === "TA";
  }, [user?.role]);

  const isSrManager = useMemo(() => {
    return user?.role === "SrManager";
  }, [user?.role]);

  return {
    user,
    canViewAllCases,
    canApproveTermination,
    canManageRelocations,
    canRequestInvestigation,
    canTransferCases,
    isManager,
    isSupervisor,
    isTrainer,
    isPS,
    isTA,
    isSrManager,
  };
}

// Export helper for getting role dashboard
export { getRoleDashboardPath };
