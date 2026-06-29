import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../auth/useAuth';

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
  jobTitle?: string;
  department?: string;
  photoUrl?: string | null;
}

interface UserContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const PERMISSIONS: Record<string, Permissions> = {
  Trainer: {
    canComment: false,
    canApproveTermination: false,
    canRequestInvestigation: true,
    canViewAllCases: false,
    canViewRelocations: true,
    canClearPS: false,
    canClearTA: false,
    canResolveCase: false,
  },
  PS: {
    canComment: true,
    canApproveTermination: true,
    canRequestInvestigation: false,
    canViewAllCases: true,
    canViewRelocations: true,
    canClearPS: true,
    canClearTA: true,
    canResolveCase: true,
  },
  TA: {
    canComment: true,
    canApproveTermination: true,
    canRequestInvestigation: false,
    canViewAllCases: true,
    canViewRelocations: true,
    canClearPS: true,
    canClearTA: true,
    canResolveCase: true,
  },
  Supervisor: {
    canComment: true,
    canApproveTermination: false,
    canRequestInvestigation: false,
    canViewAllCases: true,
    canViewRelocations: true,
    canClearPS: false,
    canClearTA: false,
    canResolveCase: false,
  },
  Manager: {
    canComment: true,
    canApproveTermination: false,
    canRequestInvestigation: false,
    canViewAllCases: true,
    canViewRelocations: true,
    canClearPS: false,
    canClearTA: false,
    canResolveCase: false,
  },
  SrManager: {
    canComment: true,
    canApproveTermination: true,
    canRequestInvestigation: false,
    canViewAllCases: true,
    canViewRelocations: true,
    canClearPS: false,
    canClearTA: false,
    canResolveCase: true,
  },
  Admin: {
    canComment: true,
    canApproveTermination: true,
    canRequestInvestigation: true,
    canViewAllCases: true,
    canViewRelocations: true,
    canClearPS: true,
    canClearTA: true,
    canResolveCase: true,
  },
};

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: false,
  error: null,
  refetch: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: authUser, profileLoading, isAuthenticated } = useAuth();

  const user: User | null = authUser ? {
    email: authUser.email || '',
    displayName: authUser.displayName || '',
    role: authUser.role || 'Trainer',
    assignedAccounts: authUser.assignedAccounts || [],
    assignedLOBs: authUser.assignedLOBs || [],
    permissions: PERMISSIONS[authUser.role] || PERMISSIONS.Trainer,
    jobTitle: authUser.jobTitle,
    department: authUser.department,
    photoUrl: authUser.photoUrl,
  } : null;

  return (
    <UserContext.Provider value={{
      user,
      loading: profileLoading,
      error: !isAuthenticated ? 'not_authenticated' : null,
      refetch: () => window.location.reload(),
    }}>
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

export { PERMISSIONS as DEFAULT_PERMISSIONS };
