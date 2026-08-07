import { createAuthConfig } from "@nexus/auth-core/config";

/**
 * HR App Authentication Configuration
 * Centralized auth configuration for Nexus HR application
 */
export const authConfig = createAuthConfig({
  // Keycloak Configuration
  iamBaseUrl: process.env.NEXT_PUBLIC_IAM_BASE_URL || "http://localhost:8080",
  iamAuthPath: "/iam/auth",
  appName: "hr",
  appBaseUrl: process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3002",
  loginPath: "/login",
  callbackPath: "/api/auth/callback",
  logoutPath: "/logout",
  sessionCookieName: "nexus-session",
  storage: "memory",
  enableSSO: true,
  allowedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
  ],
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "nexus",
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "nexus-frontend",
  clientSecret: process.env.NEXUS_KEYCLOAK_CLIENT_SECRET,
  redirectUri:
    process.env.NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI ||
    "http://localhost:3002/api/auth/callback",
  // Custom IAM endpoints for HR app
  iamEndpoints: {
    login: "/iam/auth/login",
    register: "/iam/auth/register",
    refresh: "/iam/auth/refresh",
    logout: "/iam/auth/logout",
    me: "/iam/auth/me",
    forgotPassword: "/iam/auth/forgot-password",
    resetPassword: "/iam/auth/reset-password",
    validateSession: "/iam/auth/session/{sessionId}",
    revokeSessions: "/iam/auth/revoke",
  },
});

export default authConfig;
