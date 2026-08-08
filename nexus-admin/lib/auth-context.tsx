"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { login, logout, getCurrentUser, getCurrentUserFromSession, User } from "./auth-service";

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
    const userRef = useRef<User | null>(null);

    // Keep userRef in sync with user state
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        // Check session on mount - ALWAYS verify with server to detect expired tokens
        const checkSession = async () => {
            try {
                // Always try to get from server session first to verify tokens are still valid
                // This handles the case where localStorage has user but tokens are expired
                const sessionUser = await getCurrentUserFromSession();
                if (sessionUser) {
                    setUser(sessionUser);
                    localStorage.setItem("auth_user", JSON.stringify(sessionUser));
                } else {
                    // Server session invalid/expired - clear localStorage
                    localStorage.removeItem("auth_user");
                    setUser(null);
                }
            } catch (error) {
                console.error("Session check failed:", error);
                // On error, clear localStorage and user
                localStorage.removeItem("auth_user");
                setUser(null);
            } finally {
                setIsLoading(false);
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
            setUser(null);
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
        setIsLoading(true);
        try {
            console.log("[AUTH CONTEXT] handleLogin called with:", email);
            const response = await login({ email, password });
            console.log("[AUTH CONTEXT] Login response:", response);
            localStorage.setItem("auth_user", JSON.stringify(response.user));
            setUser(response.user || null);
            console.log("[AUTH CONTEXT] User set in context:", response.user);
        } catch (error) {
            console.error("[AUTH CONTEXT] Login error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []); // no deps — uses setters which are stable

    const handleLogout = useCallback(async () => {
        setIsLoading(true);
        try {
            await logout();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

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