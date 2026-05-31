import { useEffect, useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { AccountInfo, InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest, graphConfig } from "./msalConfig";

export interface UserProfile {
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  department?: string;
}

export function useAuth() {
  const { instance, accounts, inProgress } = useMsal();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const account: AccountInfo | null = accounts[0] ?? null;
  const isAuthenticated = !!account;

  const getAccessToken = useCallback(
    async (scopes: string[]): Promise<string> => {
      if (!account) throw new Error("No account signed in");
      try {
        const response = await instance.acquireTokenSilent({ scopes, account });
        return response.accessToken;
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          const response = await instance.acquireTokenPopup({ scopes, account });
          return response.accessToken;
        }
        throw error;
      }
    },
    [instance, account]
  );

  const fetchUserProfile = useCallback(async () => {
    if (!account) return;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const token = await getAccessToken(loginRequest.scopes as string[]);
      const response = await fetch(graphConfig.graphMeEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch user profile");
      const data = await response.json();
      const nameParts = (data.displayName || "").split(" ");
      setUserProfile({
        displayName: data.displayName || account.name || "",
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: data.mail || data.userPrincipalName || account.username || "",
        jobTitle: data.jobTitle,
        department: data.department,
      });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Unknown error");
      // Fallback to account info
      const nameParts = (account.name || "").split(" ");
      setUserProfile({
        displayName: account.name || "",
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: account.username || "",
      });
    } finally {
      setProfileLoading(false);
    }
  }, [account, getAccessToken]);

  const login = useCallback(async () => {
    await instance.loginPopup(loginRequest);
  }, [instance]);

  const logout = useCallback(() => {
    instance.logoutPopup({ postLogoutRedirectUri: window.location.origin });
  }, [instance]);

  useEffect(() => {
    if (isAuthenticated && !userProfile && inProgress === "none") {
      fetchUserProfile();
    }
  }, [isAuthenticated, userProfile, inProgress, fetchUserProfile]);

  return {
    isAuthenticated,
    account,
    userProfile,
    profileLoading,
    profileError,
    inProgress,
    login,
    logout,
    getAccessToken,
  };
}
