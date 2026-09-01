"use client";

import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useMemo,
	useState,
} from "react";
import { login, logout, getCurrentUser, getCurrentUserFromSession, User, signup, SignupRequest } from "./auth-service";
import GlobalConfig from "@/global.config";

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	signup: (email: string, password: string, name: string) => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	console.log("🔁 AuthProvider render", new Date().getTime());
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const userRef = useRef<User | null>(null);

	useEffect(() => {
		userRef.current = user;
	}, [user]);

	const setUserDebug = (val: any) => {
		console.log("🔴 setUser called", val, new Error().stack);
		setUser(val);
	};

	const setIsLoadingDebug = (val: any) => {
		console.log("🔴 setIsLoading called", val, new Error().stack);
		setIsLoading(val);
	};

	useEffect(() => {
		if (!GlobalConfig.wowoFeatures.auth) {
			const dummyUser: User = {
				id: "dev-user-default",
				email: "dev@example.com",
				name: "Dev User",
				role: "ROLE_ADMIN",
				phone: "1234567890",
				orgId: "dev-org",
				avatar: `/avatars/default.jpg`,
			};
			setUserDebug(dummyUser);
			localStorage.setItem("auth_user", JSON.stringify(dummyUser));
			setIsLoading(false);
			return;
		}

		const checkSession = async () => {
			try {
				const currentUser = getCurrentUser();
				if (currentUser) {
					setUserDebug(currentUser);
				} else {
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

		const refreshInterval = setInterval(
			async () => {
				if (userRef.current) {
					try {
						console.log("[AUTH CONTEXT] Performing periodic session refresh...");
						await fetch("/api/auth/refresh", {
							method: "POST",
							credentials: "include",
						});
						console.log("[AUTH CONTEXT] Session refresh successful");
					} catch (error) {
						console.error("[AUTH CONTEXT] Periodic refresh failed:", error);
					}
				}
			},
			20 * 60 * 1000,
		);

		const handleLogout = () => {
			setUserDebug(null);
			localStorage.removeItem("auth_user");
		};

		window.addEventListener("auth:logout", handleLogout);
		return () => {
			clearInterval(refreshInterval);
			window.removeEventListener("auth:logout", handleLogout);
		};
	}, []);

	const handleLogin = useCallback(async (email: string, password: string) => {
		setIsLoadingDebug(true);
		try {
			console.log("[AUTH CONTEXT] handleLogin called with:", email);
			const response = await login({ email, password });
			console.log("[AUTH CONTEXT] Login response:", response);
			localStorage.setItem("auth_user", JSON.stringify(response.user));
			setUserDebug(response.user || null);
			console.log("[AUTH CONTEXT] User set in context:", response.user);
		} catch (error) {
			console.error("[AUTH CONTEXT] Login error:", error);
			throw error;
		} finally {
			setIsLoadingDebug(false);
		}
	}, []);

	const handleSignup = useCallback(async (email: string, password: string, name: string) => {
		setIsLoadingDebug(true);
		try {
			console.log("[AUTH CONTEXT] handleSignup called with:", email);
			const response = await signup({ email, password, name, phone: "", address: "" });
			console.log("[AUTH CONTEXT] Signup response:", response);
			localStorage.setItem("auth_user", JSON.stringify(response.user));
			setUserDebug(response.user || null);
			console.log("[AUTH CONTEXT] User set in context:", response.user);
		} catch (error) {
			console.error("[AUTH CONTEXT] Signup error:", error);
			throw error;
		} finally {
			setIsLoadingDebug(false);
		}
	}, []);

	const handleLogout = useCallback(async () => {
		setIsLoadingDebug(true);
		try {
			await logout();
			setUserDebug(null);
		} finally {
			setIsLoadingDebug(false);
		}
	}, []);

	const contextValue = useMemo(
		() => ({
			user,
			isLoading,
			isAuthenticated: !!user,
			login: handleLogin,
			signup: handleSignup,
			logout: handleLogout,
		}),
		[user, isLoading, handleLogin, handleSignup, handleLogout],
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
