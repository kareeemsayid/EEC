import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionExpiryContextValue {
  showSessionExpired: () => void;
}

const SessionExpiryContext = createContext<SessionExpiryContextValue | null>(null);

export function SessionExpiryProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Intercept fetch to detect 401/403 responses
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401 || response.status === 403) {
        // Check if it's an API call (not auth-related)
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
        if (url.startsWith('/api/') && !url.includes('/api/user/me')) {
          setIsVisible(true);
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const showSessionExpired = () => setIsVisible(true);

  const handleSignIn = () => {
    window.location.href = '/.auth/login/aad';
  };

  return (
    <SessionExpiryContext.Provider value={{ showSessionExpired }}>
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-amber-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Session Expired
                </h2>

                <p className="text-gray-600 mb-6">
                  Your session has expired. Please sign in again to continue.
                </p>

                <button
                  onClick={handleSignIn}
                  className="w-full px-6 py-3 bg-[#0a4d8c] text-white rounded-xl font-medium hover:bg-[#083d6d] transition-colors"
                >
                  Sign In
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SessionExpiryContext.Provider>
  );
}

export function useSessionExpiry() {
  const context = useContext(SessionExpiryContext);
  if (!context) {
    throw new Error('useSessionExpiry must be used within SessionExpiryProvider');
  }
  return context;
}
