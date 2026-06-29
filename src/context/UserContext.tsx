import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Permissions {
  canComment: boolean;
  canApproveTermination: boolean;
  canRequestInvestigation: boolean;
  canViewAllCases: boolean;
  canViewRelocations: boolean;
  canClearPS: boolean;
  canClearTA: boolean;
  canResolveCase: boolean;
}

interface User {
  email: string;
  displayName: string;
  role: string;
  assignedAccounts: string[];
  assignedLOBs: string[];
  permissions: Permissions;
}

interface UserContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const DEFAULT_PERMISSIONS: Permissions = {
  canComment: false,
  canApproveTermination: false,
  canRequestInvestigation: true,
  canViewAllCases: false,
  canViewRelocations: true,
  canClearPS: false,
  canClearTA: false,
  canResolveCase: false,
};

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: false,
  error: null,
  refetch: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/user/me', {
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        setError('session_expired');
        setLoading(false);
        return;
      }

      if (response.status === 403) {
        setError('access_denied');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        // API not available or error - don't block the app
        console.warn(`User API returned ${response.status}, using fallback`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setUser(data);
    } catch (err) {
      // Network error or timeout - don't block the app
      console.warn('Failed to fetch user info:', err);
      setError(null); // Don't set error for network issues
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch user info if user is authenticated (check for MSAL tokens)
    const hasMsalToken = sessionStorage.getItem('msal.token.keys') ||
                         localStorage.getItem('msal.token.keys');

    if (hasMsalToken) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, error, refetch: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export { DEFAULT_PERMISSIONS };
