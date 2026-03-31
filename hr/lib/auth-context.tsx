"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  login,
  logout,
  getCurrentUser,
  getCurrentUserFromSession,
  User
} from "./auth-service";
import GlobalConfig from "@/global.config";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dummy user for development mode if disableAuth is true
    if (!GlobalConfig.wowoFeatures.auth) {
      const dummyUser: User = {
        id: "dev-user-default",
        email: "dev@example.com",
        name: "Dev User",
        role: "ROLE_ADMIN",
        orgId: "dev-org",
        avatar: `/avatars/default.jpg`
      };
      setUser(dummyUser);
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
          setUser(currentUser);
        } else {
          // Try to get from server session (may attempt recovery if server restarted)
          const sessionUser = await getCurrentUserFromSession();
          if (sessionUser) {
            setUser(sessionUser);
            localStorage.setItem("auth_user", JSON.stringify(sessionUser));
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Periodically refresh the session to keep it alive
    // Refresh every 20 minutes (1200000ms) to stay well before the 50min expiration
    const refreshInterval = setInterval(
      async () => {
        if (user) {
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
      setUser(null);
      localStorage.removeItem("auth_user");
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await login({ email, password });

      // Store user in localStorage and state
      // Tokens are kept server-side in encrypted cookies
      localStorage.setItem("auth_user", JSON.stringify(response.user));
      setUser(response.user || null);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login: handleLogin,
        logout: handleLogout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
