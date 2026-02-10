import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

// Use globalThis to persist session storage across hot reloads
// This ensures sessions survive module reloads during development
const getSessionStorage = () => {
  type SessionMap = Map<
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
  >;

  const global = globalThis as unknown as { sessionStorage?: SessionMap };

  if (!global.sessionStorage) {
    global.sessionStorage = new Map() as SessionMap;
  }
  return global.sessionStorage as SessionMap;
};

// Export for debugging
export const getDebugSessionStorage = () => {
  console.log(
    "[BETTER-AUTH DEBUG] Current sessions:",
    getSessionStorage().size
  );
  console.log(
    "[BETTER-AUTH DEBUG] Session keys:",
    Array.from(getSessionStorage().keys())
  );
  return getSessionStorage();
};

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
  const storage = getSessionStorage();

  console.log("[BETTER-AUTH] Creating session");
  console.log("[BETTER-AUTH] SessionToken:", sessionToken);
  console.log("[BETTER-AUTH] UserId:", userId);
  console.log("[BETTER-AUTH] ExpiresIn (seconds):", expiresIn);
  console.log("[BETTER-AUTH] ExpiresAt:", expiresAt);

  storage.set(sessionToken, {
    sessionToken,
    userId,
    accessToken,
    refreshToken,
    expiresAt,
    createdAt: new Date(),
    user: userData
  });

  console.log("[BETTER-AUTH] Session stored. Total sessions:", storage.size);
  return sessionToken;
}

export function getSession(sessionToken: string) {
  const storage = getSessionStorage();
  console.log("[BETTER-AUTH] Getting session for token:", sessionToken);
  console.log("[BETTER-AUTH] Total sessions in store:", storage.size);
  console.log("[BETTER-AUTH] Session tokens:", Array.from(storage.keys()));

  const session = storage.get(sessionToken);

  if (!session) {
    console.log("[BETTER-AUTH] Token not found in sessions");
    return null;
  }

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    console.log("[BETTER-AUTH] Session expired at:", session.expiresAt);
    storage.delete(sessionToken);
    return null;
  }

  console.log("[BETTER-AUTH] Session found for user:", session.user?.email);
  return session;
}

export function deleteSession(sessionToken: string) {
  const storage = getSessionStorage();
  storage.delete(sessionToken);
}

export function refreshSession(sessionToken: string, newAccessToken: string) {
  const storage = getSessionStorage();
  const session = storage.get(sessionToken);
  if (session) {
    session.accessToken = newAccessToken;
    session.expiresAt = new Date(Date.now() + 3600 * 1000); // Reset for 1 hour
  }
}

export default auth;
