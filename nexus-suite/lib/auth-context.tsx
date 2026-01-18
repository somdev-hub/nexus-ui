"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { login, logout, getCurrentUser, User } from "./auth-service";

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
    // Restore user from localStorage on mount
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);

    // Listen for logout events (triggered by API interceptor)
    const handleLogout = () => {
      setUser(null);
      localStorage.removeItem("auth_user");
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await login({ email, password });

      // Store user in localStorage only (not the token)
      localStorage.setItem("auth_user", JSON.stringify(response.user));
      setUser(response.user || null);
      // Access token already set in memory by setAccessToken()
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
