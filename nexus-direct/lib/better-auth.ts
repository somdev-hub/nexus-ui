import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

// Module-specific configuration
const MODULE_NAME = "nexus-direct";
// Use __Host- prefix only in production (requires HTTPS)
// In development, use regular cookie names since we're on HTTP
const isProduction = process.env.NODE_ENV === "production";
const SESSION_COOKIE_NAME = isProduction
  ? `__Host-nexus-${MODULE_NAME}-session`
  : `nexus-${MODULE_NAME}-session`;
const REFRESH_TOKEN_COOKIE_NAME = isProduction
  ? `__Host-nexus-${MODULE_NAME}-refresh`
  : `nexus-${MODULE_NAME}-refresh`;

// Use globalThis to persist session storage across hot reloads
// This ensures sessions survive module reloads during development
// Each module gets its own isolated storage using a namespaced key
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
        personalEmail: string;
        name: string;
        role: string;
        avatar?: string;
      };
    }
  >;

  const global = globalThis as unknown as {
    sessionStorage?: Record<string, SessionMap>;
  };

  if (!global.sessionStorage) {
    global.sessionStorage = {};
  }

  if (!global.sessionStorage[MODULE_NAME]) {
    global.sessionStorage[MODULE_NAME] = new Map() as SessionMap;
  }

  return global.sessionStorage[MODULE_NAME] as SessionMap;
};

// Export for debugging
export const getDebugSessionStorage = () => {
  console.log(
    `[BETTER-AUTH DEBUG] [${MODULE_NAME}] Current sessions:`,
    getSessionStorage().size,
  );
  console.log(
    `[BETTER-AUTH DEBUG] [${MODULE_NAME}] Session keys:`,
    Array.from(getSessionStorage().keys()),
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

  plugins: [nextCookies()],
});

// Export cookie names for use in middleware and API routes
export const COOKIE_NAMES = {
  SESSION: SESSION_COOKIE_NAME,
  REFRESH: REFRESH_TOKEN_COOKIE_NAME,
};

// Helper functions for session management
export function createSession(
  sessionToken: string,
  userId: string,
  userData: {
    id: string;
    personalEmail: string;
    name: string;
    role: string;
    avatar?: string;
  },
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
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
    user: userData,
  });

  console.log("[BETTER-AUTH] Session stored. Total sessions:", storage.size);
  console.log("[BETTER-AUTH] Stored session keys:", Array.from(storage.keys()));

  // Verify it was stored
  const verify = storage.get(sessionToken);
  if (verify) {
    console.log(
      "[BETTER-AUTH] ✓ Session verified in storage for token:",
      sessionToken,
    );
  } else {
    console.error("[BETTER-AUTH] ✗ FAILED to verify session in storage!");
  }

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

  console.log(
    "[BETTER-AUTH] Session found for user:",
    session.user?.personalEmail,
  );
  return session;
}

export function deleteSession(sessionToken: string) {
  const storage = getSessionStorage();
  storage.delete(sessionToken);
}

export function refreshSession(
  sessionToken: string,
  newAccessToken: string,
  expiresIn?: number,
  newRefreshToken?: string,
) {
  const storage = getSessionStorage();
  const session = storage.get(sessionToken);

  if (session) {
    // Session exists - update tokens
    session.accessToken = newAccessToken;
    if (newRefreshToken) {
      session.refreshToken = newRefreshToken;
    }
    // Use provided expiresIn or default to 1 hour
    const expirySeconds = expiresIn || 3600;
    session.expiresAt = new Date(Date.now() + expirySeconds * 1000);
    console.log(
      "[BETTER-AUTH] Session refreshed. New expiry:",
      session.expiresAt,
    );
  } else {
    // Session lost from memory (due to hot reload or other reason)
    // This shouldn't happen in normal operation, but log it for visibility
    console.warn(
      "[BETTER-AUTH] WARNING: Session not found in storage during refresh. Session may have been lost due to server restart or hot reload. Token update deferred to session creation.",
    );
  }
}

export default auth;
