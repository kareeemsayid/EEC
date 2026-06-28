// src/auth/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./msalConfig";
import {
  fetchUserProfile,
  fetchUserPhotoUrl,
  UserProfile,
} from "../api/sharepoint";
import {
  fetchUserRole,
  fetchSupervisorAccounts,
  setApiUserEmail,
  UserRole,
  SupervisorAccount,
} from "../api/api";


export type { UserRole };

const GRAPH = "https://graph.microsoft.com/v1.0";

export interface ManagerInfo {
  id: string;
  displayName: string;
  mail: string;
  jobTitle: string;
  department?: string;
  photoUrl?: string | null;
}

export interface AuthUser extends UserProfile {
  photoUrl: string | null;
  role: UserRole;
  supervisorAccounts: SupervisorAccount[];
  assignedLOBs?: string[];
  assignedAccounts?: string[];
  manager?: ManagerInfo | null;
  manager1?: ManagerInfo | null;
  manager2?: ManagerInfo | null;
  directReports?: ManagerInfo[];
  department?: string;
  officeLocation?: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  profileLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  getAccessToken: (scopes?: string[]) => Promise<string>;
}

async function fetchManagerOf(token: string, userIdOrMe: string): Promise<ManagerInfo | null> {
  try {
    const path = userIdOrMe === "me"
      ? "/me/manager?$select=id,displayName,mail,jobTitle,department,userPrincipalName"
      : `/users/${userIdOrMe}/manager?$select=id,displayName,mail,jobTitle,department,userPrincipalName`;
    const res = await fetch(`${GRAPH}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const photoUrl = data.id ? await fetchUserPhotoById(token, data.id) : null;
    return {
      id: data.id || "",
      displayName: data.displayName || "",
      mail: data.mail || data.userPrincipalName || "",
      jobTitle: data.jobTitle || "",
      department: data.department || "",
      photoUrl,
    };
  } catch {
    return null;
  }
}

async function fetchUserPhotoById(token: string, userId: string): Promise<string | null> {
  try {
    const res = await fetch(`${GRAPH}/users/${userId}/photo/$value`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

async function fetchDirectReports(token: string): Promise<ManagerInfo[]> {
  try {
    const res = await fetch(`${GRAPH}/me/directReports?$select=id,displayName,mail,jobTitle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.value || []).map((u: any) => ({
      id: u.id || "",
      displayName: u.displayName || "",
      mail: u.mail || u.userPrincipalName || "",
      jobTitle: u.jobTitle || "",
    }));
  } catch {
    return [];
  }
}

export function useAuth(): UseAuthReturn {
  const { instance, accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;

  const [user, setUser] = useState<AuthUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const getAccessToken = useCallback(
    async (scopes: string[] = loginRequest.scopes as string[]) => {
      const account = accounts[0];
      if (!account) throw new Error("No account signed in");
      try {
        const result = await instance.acquireTokenSilent({ scopes, account });
        return result.accessToken;
      } catch {
        const result = await instance.acquireTokenPopup({ scopes, account });
        return result.accessToken;
      }
    },
    [instance, accounts]
  );

  // Load profile + photo + role + supervisor accounts + manager chain + direct reports
  useEffect(() => {
    if (!isAuthenticated) {
      setUser(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setProfileLoading(true);

      try {
        const token = await getAccessToken();
        const userEmail = accounts[0]?.username || "";

        // Forward the signed-in email to the API layer so backend auth works
        if (userEmail) setApiUserEmail(userEmail);

        // Fetch Graph data in parallel: profile, photo, manager1, department
        const [profile, photoUrl, manager1, meGraphRaw] = await Promise.all([
          fetchUserProfile(token),
          fetchUserPhotoUrl(token),
          fetchManagerOf(token, "me"),
          fetch(`${GRAPH}/me?$select=department,officeLocation`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : {}),
        ]);

        const meGraph = meGraphRaw as any;

        // Then fetch manager2 and photos in parallel with backend role fetch
        const [manager2, directReports, roleData, supervisorAccounts] = await Promise.all([
          manager1?.id ? fetchManagerOf(token, `users/${manager1.id}`) : Promise.resolve(null),
          fetchDirectReports(token),
          fetchUserRole(userEmail).catch(() => ({ role: 'Trainer' as UserRole })),
          fetchSupervisorAccounts(userEmail).catch(() => [] as SupervisorAccount[]),
        ]);

        if (!cancelled) {
          setUser({
            id: profile.id,
            displayName: profile.displayName || "Trainer",
            email: profile.email || userEmail,
            firstName: profile.firstName || "Trainer",
            lastName: profile.lastName || "",
            jobTitle: profile.jobTitle || "Trainer",
            department: meGraph?.department || "",
            officeLocation: meGraph?.officeLocation || "",
            photoUrl,
            role: roleData.role,
            supervisorAccounts,
            manager: manager1,
            manager1,
            manager2,
            directReports,
          });
        }
      } catch (e) {
        if (!cancelled && accounts[0]) {
          const account = accounts[0];
          const displayName = account.name || account.username?.split("@")[0] || "Trainer";
          const nameParts = displayName.split(" ");
          setUser({
            id: account.localAccountId || "unknown",
            displayName,
            email: account.username || "",
            firstName: nameParts[0] || "Trainer",
            lastName: nameParts.slice(1).join(" ") || "",
            jobTitle: "Trainer",
            photoUrl: null,
            role: "Trainer",
            supervisorAccounts: [],
            manager: null,
            manager1: null,
            manager2: null,
            directReports: [],
          });
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated, getAccessToken, accounts]);

  const login = useCallback(async () => {
    await instance.loginPopup(loginRequest);
  }, [instance]);

  const logout = useCallback(() => {
    // Clear all local storage and session data immediately
    localStorage.clear();
    sessionStorage.clear();

    // Clear all cookies for this domain
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Redirect immediately to login without popup
    // Clear MSAL cache silently
    const clearMsalCache = () => {
      try {
        instance.clearCache();
      } catch {
        // Ignore cache clear errors
      }
    };
    clearMsalCache();

    // Force immediate redirect to login page
    window.location.href = '/login';
  }, [instance]);

  return { user, profileLoading, isAuthenticated, login, logout, getAccessToken };
}
