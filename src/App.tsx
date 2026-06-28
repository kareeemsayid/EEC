import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import HomeScreen from "./pages/HomeScreen";
import SubmitCase from "./pages/SubmitCase";
import UpdateCase from "./pages/UpdateCase";
import LoadingScreen from "./components/LoadingScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth, UserRole } from "./auth/useAuth";
import { UserProvider } from "./context/UserContext";
import { SessionExpiryProvider } from "./components/SessionExpiry";
import { LoadingProvider } from "./hooks/useLoading";

const MyCases = lazy(() => import("./pages/MyCases"));
const CaseTimeline = lazy(() => import("./pages/CaseTimeline"));
const AttendanceLog = lazy(() => import("./pages/AttendanceLog"));
const HighRiskDashboard = lazy(() => import("./pages/HighRiskDashboard"));
const TerminationCenter = lazy(() => import("./pages/TerminationCenter"));
const PSDashboard = lazy(() => import("./pages/PSDashboard"));
const Investigations = lazy(() => import("./pages/Investigations"));
const InvestigationDetail = lazy(() => import("./pages/InvestigationDetail"));
const RequestInvestigation = lazy(() => import("./pages/RequestInvestigation"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const Relocations = lazy(() => import("./pages/relocations/Relocations"));
const SubmitRelocation = lazy(() => import("./pages/relocations/SubmitRelocation"));
const RelocationDetail = lazy(() => import("./pages/relocations/RelocationDetail"));
const TrainerDashboard = lazy(() => import("./pages/trainer/Dashboard"));
const SupervisorDashboard = lazy(() => import("./pages/supervisor/Dashboard"));
const ManagerDashboard = lazy(() => import("./pages/manager/Dashboard"));
const TADashboard = lazy(() => import("./pages/TADashboard"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));

const PageLoader = () => <LoadingScreen subtitle="Loading your workspace" />;

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

function AuthenticatedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <GlobalShortcuts />
      <Layout>
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <SessionExpiryProvider>
          <LoadingProvider>
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
                  iconTheme: { primary: "#00C4B4", secondary: "#fff" },
                },
                error: {
                  iconTheme: { primary: "#ef4444", secondary: "#fff" },
                },
              }}
            />
            <AppRoutes />
          </LoadingProvider>
        </SessionExpiryProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Home - accessible by all authenticated users */}
        <Route
          path="/"
          element={
            <AuthenticatedRoute>
              <HomeScreen />
            </AuthenticatedRoute>
          }
        />

        {/* Trainer routes */}
        <Route
          path="/dashboard/trainer"
          element={
            <AuthenticatedRoute allowedRoles={["Trainer"]}>
              <TrainerDashboard />
            </AuthenticatedRoute>
          }
        />

        {/* Supervisor routes */}
        <Route
          path="/dashboard/supervisor"
          element={
            <AuthenticatedRoute allowedRoles={["Supervisor"]}>
              <SupervisorDashboard />
            </AuthenticatedRoute>
          }
        />

        {/* Manager routes */}
        <Route
          path="/dashboard/manager"
          element={
            <AuthenticatedRoute allowedRoles={["Manager", "SrManager"]}>
              <ManagerDashboard />
            </AuthenticatedRoute>
          }
        />

        {/* TA Dashboard */}
        <Route
          path="/dashboard/ta"
          element={
            <AuthenticatedRoute allowedRoles={["TA"]}>
              <TADashboard />
            </AuthenticatedRoute>
          }
        />

        {/* PS/TA/SrManager routes */}
        <Route
          path="/ps-dashboard"
          element={
            <AuthenticatedRoute allowedRoles={["PS", "TA", "SrManager"]}>
              <PSDashboard />
            </AuthenticatedRoute>
          }
        />

        {/* Case management - accessible by all */}
        <Route
          path="/submit"
          element={
            <AuthenticatedRoute>
              <SubmitCase />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/update"
          element={
            <AuthenticatedRoute>
              <UpdateCase />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/my-cases"
          element={
            <AuthenticatedRoute>
              <MyCases />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/timeline"
          element={
            <AuthenticatedRoute>
              <CaseTimeline />
            </AuthenticatedRoute>
          }
        />

        {/* Relocation routes */}
        <Route
          path="/relocations"
          element={
            <AuthenticatedRoute>
              <Relocations />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/relocations/submit"
          element={
            <AuthenticatedRoute>
              <SubmitRelocation />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/relocations/:id"
          element={
            <AuthenticatedRoute>
              <RelocationDetail />
            </AuthenticatedRoute>
          }
        />

        {/* PS/TA/Manager routes */}
        <Route
          path="/termination"
          element={
            <AuthenticatedRoute allowedRoles={["PS", "SrManager", "Manager"]}>
              <TerminationCenter />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/investigations"
          element={
            <AuthenticatedRoute>
              <Investigations />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/investigations/new"
          element={
            <AuthenticatedRoute>
              <RequestInvestigation />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/investigations/:id"
          element={
            <AuthenticatedRoute>
              <InvestigationDetail />
            </AuthenticatedRoute>
          }
        />

        {/* Analytics routes */}
        <Route
          path="/high-risk"
          element={
            <AuthenticatedRoute allowedRoles={["TA", "PS", "SrManager", "Manager", "Supervisor"]}>
              <HighRiskDashboard />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <AuthenticatedRoute allowedRoles={["TA", "PS", "SrManager", "Manager"]}>
              <AnalyticsDashboard />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <AuthenticatedRoute allowedRoles={["TA", "PS", "SrManager", "Manager"]}>
              <AttendanceLog />
            </AuthenticatedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <AuthenticatedRoute allowedRoles={["Admin"]}>
              <AdminPanel />
            </AuthenticatedRoute>
          }
        />

        {/* Profile & Settings - accessible by all */}
        <Route
          path="/profile"
          element={
            <AuthenticatedRoute>
              <ProfilePage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthenticatedRoute>
              <SettingsPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <AuthenticatedRoute>
              <HelpPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <AuthenticatedRoute>
              <SupportPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/help-support"
          element={
            <AuthenticatedRoute>
              <HelpSupport />
            </AuthenticatedRoute>
          }
        />

        {/* Legacy redirect paths */}
        <Route path="/request-investigation" element={<Navigate to="/investigations" replace />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
