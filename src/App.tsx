import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useAuth } from "./auth/useAuth";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import HomeScreen from "./pages/HomeScreen";
import SubmitCase from "./pages/SubmitCase";
import UpdateCase from "./pages/UpdateCase";
import LoadingSpinner from "./components/LoadingSpinner";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" label="Signing in…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout>
                <HomeScreen />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/submit"
          element={
            <RequireAuth>
              <Layout>
                <SubmitCase />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/update"
          element={
            <RequireAuth>
              <Layout>
                <UpdateCase />
              </Layout>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
