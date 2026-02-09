import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

// In-memory session storage
const sessionStorage = new Map<
  string,
  {
    sessionToken: string;
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    createdAt: Date;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      orgId: string;
    };
  }
>();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
  secret:
    process.env.BETTER_AUTH_SECRET || "very-secret-key-change-in-production",
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],

  database: undefined, // Don't use database - we'll use custom session storage

  plugins: [nextCookies()]
});

// Helper functions for session management
export function createSession(
  sessionToken: string,
  userId: string,
  userData: {
    id: string;
    email: string;
    name: string;
    role: string;
    orgId: string;
  },
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  sessionStorage.set(sessionToken, {
    sessionToken,
    userId,
    accessToken,
    refreshToken,
    expiresAt,
    createdAt: new Date(),
    user: userData
  });

  return sessionToken;
}

export function getSession(sessionToken: string) {
  const session = sessionStorage.get(sessionToken);

  if (!session) return null;

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    sessionStorage.delete(sessionToken);
    return null;
  }

  return session;
}

export function deleteSession(sessionToken: string) {
  sessionStorage.delete(sessionToken);
}

export function refreshSession(sessionToken: string, newAccessToken: string) {
  const session = sessionStorage.get(sessionToken);
  if (session) {
    session.accessToken = newAccessToken;
    session.expiresAt = new Date(Date.now() + 3600 * 1000); // Reset for 1 hour
  }
}

export default auth;
