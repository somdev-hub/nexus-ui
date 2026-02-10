"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

export interface UserMetadata {
  // User identification
  userId: string | undefined;
  email: string | undefined;
  name: string | undefined;

  // Organization & Role
  orgId: string | undefined;
  role: string | undefined;
  avatar: string | undefined;

  // Session information
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpiresAt: string | null;
}

/**
 * Hook to access user metadata
 *
 * Provides convenient access to user information such as userId, orgId, role, etc.
 * Automatically fetches session expiry information from the server.
 *
 * @returns {UserMetadata} User metadata object with all user information
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { userId, orgId, role, isAuthenticated } = useUserMetadata();
 *
 *   if (!isAuthenticated) {
 *     return <div>Please login</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>User ID: {userId}</p>
 *       <p>Organization: {orgId}</p>
 *       <p>Role: {role}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useUserMetadata(): UserMetadata {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch session info if authenticated
    if (!isAuthenticated || isLoading) {
      return;
    }

    const fetchSessionInfo = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include"
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setSessionExpiresAt(data.expiresAt || null);
      } catch (error) {
        console.error("[useUserMetadata] Failed to fetch session info:", error);
      }
    };

    fetchSessionInfo();
  }, [isAuthenticated, isLoading]);

  return {
    // User identification
    userId: user?.id,
    email: user?.email,
    name: user?.name,

    // Organization & Role
    orgId: user?.orgId,
    role: user?.role,
    avatar: user?.avatar,

    // Session information
    isAuthenticated,
    isLoading,
    sessionExpiresAt
  };
}

/**
 * Hook to check if user has a specific role
 *
 * @param requiredRole The role to check for (e.g., "ROLE_ADMIN")
 * @returns {boolean} True if user has the required role
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const isAdmin = useHasRole("ROLE_ADMIN");
 *
 *   if (!isAdmin) {
 *     return <div>Access denied</div>;
 *   }
 *
 *   return <div>Admin content</div>;
 * }
 * ```
 */
export function useHasRole(requiredRole: string): boolean {
  const { role, isAuthenticated } = useUserMetadata();
  return isAuthenticated && role === requiredRole;
}

/**
 * Hook to check if user belongs to a specific organization
 *
 * @param requiredOrgId The organization ID to check for
 * @returns {boolean} True if user belongs to the organization
 *
 * @example
 * ```tsx
 * function OrgSpecificContent() {
 *   const isInOrg = useIsInOrganization("org-123");
 *
 *   if (!isInOrg) {
 *     return <div>Not in this organization</div>;
 *   }
 *
 *   return <div>Organization content</div>;
 * }
 * ```
 */
export function useIsInOrganization(requiredOrgId: string): boolean {
  const { orgId, isAuthenticated } = useUserMetadata();
  return isAuthenticated && orgId === requiredOrgId;
}

/**
 * Hook to check if user is authenticated and fully loaded
 *
 * @returns {boolean} True if user is authenticated and metadata is loaded
 *
 * @example
 * ```tsx
 * function ProtectedContent() {
 *   const isReady = useIsAuthenticated();
 *
 *   if (!isReady) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   return <div>Protected content</div>;
 * }
 * ```
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated, isLoading } = useUserMetadata();
  return isAuthenticated && !isLoading;
}

/**
 * Hook to get user's unique identifier
 *
 * @returns {string | undefined} User ID if authenticated, undefined otherwise
 *
 * @example
 * ```tsx
 * function UserCard() {
 *   const userId = useUserId();
 *
 *   return <div>User: {userId || "Not logged in"}</div>;
 * }
 * ```
 */
export function useUserId(): string | undefined {
  const { userId } = useUserMetadata();
  return userId;
}

/**
 * Hook to get user's organization ID
 *
 * @returns {string | undefined} Organization ID if authenticated, undefined otherwise
 *
 * @example
 * ```tsx
 * function OrgInfo() {
 *   const orgId = useOrgId();
 *
 *   return <div>Organization: {orgId || "No org"}</div>;
 * }
 * ```
 */
export function useOrgId(): string | undefined {
  const { orgId } = useUserMetadata();
  return orgId;
}

/**
 * Hook to get user's display name
 *
 * @returns {string | undefined} User's name if authenticated, undefined otherwise
 *
 * @example
 * ```tsx
 * function Greeting() {
 *   const name = useUserName();
 *
 *   return <div>Hello, {name}!</div>;
 * }
 * ```
 */
export function useUserName(): string | undefined {
  const { name } = useUserMetadata();
  return name;
}

/**
 * Hook to get user's role
 *
 * @returns {string | undefined} User's role if authenticated, undefined otherwise
 *
 * @example
 * ```tsx
 * function RoleInfo() {
 *   const role = useUserRole();
 *
 *   return <div>Your role: {role || "No role assigned"}</div>;
 * }
 * ```
 */
export function useUserRole(): string | undefined {
  const { role } = useUserMetadata();
  return role;
}

/**
 * Hook to get user's email
 *
 * @returns {string | undefined} User's email if authenticated, undefined otherwise
 *
 * @example
 * ```tsx
 * function ContactInfo() {
 *   const email = useUserEmail();
 *
 *   return <div>Contact: {email || "No email"}</div>;
 * }
 * ```
 */
export function useUserEmail(): string | undefined {
  const { email } = useUserMetadata();
  return email;
}

/**
 * Hook to get session expiration time
 *
 * @returns {string | null} Session expiration timestamp, or null if not available
 *
 * @example
 * ```tsx
 * function SessionStatus() {
 *   const expiresAt = useSessionExpiry();
 *
 *   return <div>Session expires: {expiresAt || "Unknown"}</div>;
 * }
 * ```
 */
export function useSessionExpiry(): string | null {
  const { sessionExpiresAt } = useUserMetadata();
  return sessionExpiresAt;
}
