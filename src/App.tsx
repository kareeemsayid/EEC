import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import HomeScreen from "./pages/HomeScreen";
import SubmitCase from "./pages/SubmitCase";
import UpdateCase from "./pages/UpdateCase";
import LoadingSpinner from "./components/LoadingSpinner";
import SessionTimeoutModal from "./components/SessionTimeoutModal";
import CommandPalette from "./components/CommandPalette";
import { useSessionTimeout } from "./hooks/useSessionTimeout";
import { useAuth } from "./auth/useAuth";

const MyCases = lazy(() => import("./pages/MyCases"));
const CaseTimeline = lazy(() => import("./pages/CaseTimeline"));
const AttendanceLog = lazy(() => import("./pages/AttendanceLog"));
const HighRiskDashboard = lazy(() => import("./pages/HighRiskDashboard"));
const TerminationCenter = lazy(() => import("./pages/TerminationCenter"));
const PSDashboard = lazy(() => import("./pages/PSDashboard"));
const Investigations = lazy(() => import("./pages/Investigations"));
const InvestigationDetail = lazy(() => import("./pages/InvestigationDetail"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));

const PageLoader = () => (
  <div className="flex justify-center py-24">
    <LoadingSpinner size="lg" label="Loading..." />
  </div>
);

function GlobalShortcuts() {
  const { logout } = useAuth();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "Q") {
        e.preventDefault();
        logout();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [logout]);
  return null;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();
  const { showWarning, timeRemaining, staySignedIn, logout } = useSessionTimeout({
    timeoutMinutes: 15,
    warningMinutes: 1,
  });

  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mesh">
        <LoadingSpinner size="lg" label="Signing in..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <GlobalShortcuts />
      {children}
      <SessionTimeoutModal
        isOpen={showWarning}
        timeRemaining={timeRemaining}
        onStaySignedIn={staySignedIn}
        onLogout={logout}
      />
    </>
  );
}

function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <Layout>
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </Layout>
    </RequireAuth>
  );
}

export default function App() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <BrowserRouter>
      <CommandPalette />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#1f2937",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            fontSize: "13px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          },
          success: {
            iconTheme: { primary: "#0d9488", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="/" element={<AuthenticatedRoute><HomeScreen /></AuthenticatedRoute>} />
        <Route path="/submit" element={<AuthenticatedRoute><SubmitCase /></AuthenticatedRoute>} />
        <Route path="/update" element={<AuthenticatedRoute><UpdateCase /></AuthenticatedRoute>} />
        <Route path="/my-cases" element={<AuthenticatedRoute><MyCases /></AuthenticatedRoute>} />
        <Route path="/timeline" element={<AuthenticatedRoute><CaseTimeline /></AuthenticatedRoute>} />
        <Route path="/attendance" element={<AuthenticatedRoute><AttendanceLog /></AuthenticatedRoute>} />
        <Route path="/high-risk" element={<AuthenticatedRoute><HighRiskDashboard /></AuthenticatedRoute>} />
        <Route path="/termination" element={<AuthenticatedRoute><TerminationCenter /></AuthenticatedRoute>} />
        <Route path="/ps-dashboard" element={<AuthenticatedRoute><PSDashboard /></AuthenticatedRoute>} />
        <Route path="/investigations" element={<AuthenticatedRoute><Investigations /></AuthenticatedRoute>} />
        <Route path="/investigations/:id" element={<AuthenticatedRoute><InvestigationDetail /></AuthenticatedRoute>} />
        <Route path="/profile" element={<AuthenticatedRoute><ProfilePage /></AuthenticatedRoute>} />
        <Route path="/settings" element={<AuthenticatedRoute><SettingsPage /></AuthenticatedRoute>} />
        <Route path="/help" element={<AuthenticatedRoute><HelpSupport /></AuthenticatedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
