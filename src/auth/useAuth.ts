// src/auth/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./msalConfig";
import {
  fetchUserProfile,
  fetchUserPhotoUrl,
  checkIsPSUser,
  UserProfile,
} from "../api/sharepoint";

export interface AuthUser extends UserProfile {
  photoUrl: string | null;
  isPSUser: boolean;
}

interface UseAuthReturn {
  user: AuthUser | null;
  profileLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  getAccessToken: (scopes?: string[]) => Promise<string>;
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
        console.log("[useAuth] Access token acquired successfully");
        return result.accessToken;
      } catch (error) {
        console.error("[useAuth] Token acquisition failed:", error);
        // Try interactive if silent fails
        const result = await instance.acquireTokenPopup({ scopes, account });
        return result.accessToken;
      }
    },
    [instance, accounts]
  );

  // Load profile + photo + PS role after login
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("[useAuth] Not authenticated, clearing user");
      setUser(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setProfileLoading(true);
      console.log("[useAuth] Loading user profile...");

      try {
        const token = await getAccessToken();

        // Fetch profile, photo, and PS role in parallel
        const [profile, photoUrl, isPSUser] = await Promise.all([
          fetchUserProfile(token),
          fetchUserPhotoUrl(token),
          checkIsPSUser(token, accounts[0]?.username || ""),
        ]);

        if (!cancelled) {
          console.log("[useAuth] Profile loaded:", {
            displayName: profile.displayName,
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            jobTitle: profile.jobTitle,
            hasPhoto: !!photoUrl,
            isPSUser,
          });

          setUser({
            id: profile.id,
            displayName: profile.displayName || "Trainer",
            email: profile.email || accounts[0]?.username || "",
            firstName: profile.firstName || "Trainer",
            lastName: profile.lastName || "",
            jobTitle: profile.jobTitle || "Trainer",
            photoUrl,
            isPSUser,
          });
        }
      } catch (e) {
        console.error("[useAuth] Profile load error:", e);

        // Fallback: create basic user from MSAL account info
        if (!cancelled && accounts[0]) {
          const account = accounts[0];
          console.log("[useAuth] Creating fallback user from account:", account);

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
            isPSUser: false,
          });
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, getAccessToken, accounts]);

  const login = useCallback(async () => {
    console.log("[useAuth] Initiating login...");
    await instance.loginPopup(loginRequest);
  }, [instance]);

  const logout = useCallback(() => {
    console.log("[useAuth] Logging out...");
    instance.logoutPopup({ postLogoutRedirectUri: window.location.origin });
  }, [instance]);

  return { user, profileLoading, isAuthenticated, login, logout, getAccessToken };
}
