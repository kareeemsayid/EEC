import React, { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useAuth, UserRole } from "../auth/useAuth";
import AccessDenied from "./AccessDenied";
import GlobalLoadingScreen from "./LoadingScreen";

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
    return <GlobalLoadingScreen message="Connecting to secure gateway…" />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but still loading profile
  if (profileLoading || !user) {
    return <GlobalLoadingScreen message="Loading your workspace…" />;
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
