"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useMemo, useState } from "react";

export interface UserMetadata {
  userId: string | undefined;
  email: string | undefined;
  name: string | undefined;
  phone: string | undefined;
  orgId: string | undefined;
  role: string | undefined;
  avatar: string | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpiresAt: string | null;
}

export function useUserMetadata(): UserMetadata {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      return;
    }

    const fetchSessionInfo = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setSessionExpiresAt(data.expiresAt || data.sessionExpiry || null);
      } catch (error) {
        console.error("[useUserMetadata] Failed to fetch session info:", error);
      }
    };

    fetchSessionInfo();
  }, [isAuthenticated, isLoading]);

  return useMemo(
    () => ({
      userId: user?.id,
      email: user?.email,
      name: user?.name,
      phone: user?.phone,
      orgId: user?.orgId,
      role: user?.role,
      avatar: user?.avatar,
      isAuthenticated,
      isLoading,
      sessionExpiresAt,
    }),
    [
      user?.id,
      user?.email,
      user?.name,
      user?.phone,
      user?.orgId,
      user?.role,
      user?.avatar,
      isAuthenticated,
      isLoading,
      sessionExpiresAt,
    ],
  );
}

export function useHasRole(requiredRole: string): boolean {
  const { role, isAuthenticated } = useUserMetadata();
  return isAuthenticated && role === requiredRole;
}

export function useIsInOrganization(requiredOrgId: string): boolean {
  const { orgId, isAuthenticated } = useUserMetadata();
  return isAuthenticated && orgId === requiredOrgId;
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated, isLoading } = useUserMetadata();
  return isAuthenticated && !isLoading;
}

export function useUserId(): string | undefined {
  const { userId } = useUserMetadata();
  return userId;
}

export function useOrgId(): string | undefined {
  const { orgId } = useUserMetadata();
  return orgId;
}

export function useUserName(): string | undefined {
  const { name } = useUserMetadata();
  return name;
}

export function useUserRole(): string | undefined {
  const { role } = useUserMetadata();
  return role;
}

export function useUserEmail(): string | undefined {
  const { email } = useUserMetadata();
  return email;
}

export function useSessionExpiry(): string | null {
  const { sessionExpiresAt } = useUserMetadata();
  return sessionExpiresAt;
}
