import { useState, useEffect, useCallback, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import toast from "react-hot-toast";

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onLogout?: () => void;
}

interface UseSessionTimeoutReturn {
  showWarning: boolean;
  timeRemaining: number;
  staySignedIn: () => void;
  logout: () => void;
}

export function useSessionTimeout({
  timeoutMinutes = 15,
  warningMinutes = 1,
  onLogout,
}: UseSessionTimeoutOptions = {}): UseSessionTimeoutReturn {
  const { instance } = useMsal();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(warningMinutes * 60);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const logout = useCallback(() => {
    clearTimeouts();
    setShowWarning(false);
    instance.logoutPopup({ postLogoutRedirectUri: window.location.origin });
    onLogout?.();
  }, [instance, clearTimeouts, onLogout]);

  const startCountdown = useCallback(() => {
    const warningMs = warningMinutes * 60 * 1000;
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, warningMs - (elapsed % warningMs));
      setTimeRemaining(Math.ceil(remaining / 1000));
    }, 1000);
  }, [warningMinutes]);

  const resetTimers = useCallback(() => {
    clearTimeouts();
    setShowWarning(false);
    lastActivityRef.current = Date.now();

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = warningMinutes * 60 * 1000;

    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
      toast.error(`Session expires in ${warningMinutes} minute${warningMinutes > 1 ? "s" : ""}`, {
        duration: 10000,
        icon: "⏱️",
      });
    }, timeoutMs - warningMs);

    timeoutRef.current = setTimeout(() => {
      logout();
    }, timeoutMs);
  }, [timeoutMinutes, warningMinutes, clearTimeouts, startCountdown, logout]);

  const staySignedIn = useCallback(() => {
    resetTimers();
    toast.success("Session extended", { duration: 2000, icon: "✅" });
  }, [resetTimers]);

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (!showWarning) {
        resetTimers();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    resetTimers();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimeouts();
    };
  }, [resetTimers, clearTimeouts, showWarning]);

  return { showWarning, timeRemaining, staySignedIn, logout };
}
