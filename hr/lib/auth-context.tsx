"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useState
} from "react";
import {
  login,
  logout,
  getCurrentUser,
  getCurrentUserFromSession
} from "./auth-service";
import GlobalConfig from "@/global.config";
import { User } from "@/types";
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log("🔁 AuthProvider render", new Date().getTime());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<User | null>(null);

  // Keep userRef in sync with user state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Intercept state setters to find who's calling them
  const setUserDebug = (val: any) => {
    console.log("🔴 setUser called", val, new Error().stack);
    setUser(val);
  };

  const setIsLoadingDebug = (val: any) => {
    console.log("🔴 setIsLoading called", val, new Error().stack);
    setIsLoading(val);
  };

  useEffect(() => {
    // Dummy user for development mode if disableAuth is true
    if (!GlobalConfig.wowoFeatures.auth) {
      const dummyUser: User = {
        id: "dev-user-default",
        email: "dev@example.com",
        name: "Dev User",
        role: "ROLE_ADMIN",
        phone: "1234567890",
        orgId: "dev-org",
        avatar: `/avatars/default.jpg`
      };
      setUserDebug(dummyUser);
      localStorage.setItem("auth_user", JSON.stringify(dummyUser));
      setIsLoading(false);
      return;
    }

    // Check session on mount
    const checkSession = async () => {
      try {
        // First try to get user from localStorage (already logged in)
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUserDebug(currentUser);
        } else {
          // Try to get from server session (may attempt recovery if server restarted)
          const sessionUser = await getCurrentUserFromSession();
          if (sessionUser) {
            setUserDebug(sessionUser);
            localStorage.setItem("auth_user", JSON.stringify(sessionUser));
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setIsLoadingDebug(false);
      }
    };

    checkSession();

    // Periodically refresh the session to keep it alive
    // Refresh every 20 minutes (1200000ms) to stay well before the 50min expiration
    const refreshInterval = setInterval(
      async () => {
        if (userRef.current) {
          try {
            console.log(
              "[AUTH CONTEXT] Performing periodic session refresh..."
            );
            await fetch("/api/auth/refresh", {
              method: "POST",
              credentials: "include"
            });
            console.log("[AUTH CONTEXT] Session refresh successful");
          } catch (error) {
            console.error("[AUTH CONTEXT] Periodic refresh failed:", error);
          }
        }
      },
      20 * 60 * 1000
    ); // 20 minutes

    // Listen for logout events
    const handleLogout = () => {
      setUserDebug(null);
      localStorage.removeItem("auth_user");
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []); // Only run on mount, not on user changes

  // ✅ Stable function references
  const handleLogin = useCallback(async (email: string, password: string) => {
    setIsLoadingDebug(true);
    try {
      const response = await login({ email, password });
      localStorage.setItem("auth_user", JSON.stringify(response.user));
      setUserDebug(response.user || null);
    } catch (error) {
      throw error;
    } finally {
      setIsLoadingDebug(false);
    }
  }, []); // no deps — uses setters which are stable

  const handleLogout = useCallback(async () => {
    setIsLoadingDebug(true);
    try {
      await logout();
      setUserDebug(null);
    } finally {
      setIsLoadingDebug(false);
    }
  }, []);

  // ✅ Stable context value — only changes when user or isLoading actually changes
  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login: handleLogin,
      logout: handleLogout
    }),
    [user, isLoading, handleLogin, handleLogout]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
