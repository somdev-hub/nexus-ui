import GlobalConfig from "@/global.config";

export interface LoginRequest {
  email: string;
  password: string;
}

export type UserRole =
  | "ROLE_ADMIN"
  | "ROLE_DIRECTOR"
  | "ROLE_PRODUCT_MANAGER"
  | "ROLE_CLERK"
  | "ROLE_ACCOUNT_MANAGER"
  | "ROLE_OPERATION_MANAGER"
  | "ROLE_WAREHOUSE_MANAGER"
  | "ROLE_FLEET_MANAGER"
  | "ROLE_DRIVER";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  orgId: string;
  phone?: string;
  avatar?: string;
}

// ─────────────────────────────────────────────────────────────
// BFF Auth Architecture — tokens stay server-side in HttpOnly cookies
// Frontend never sees accessToken / refreshToken directly
// ─────────────────────────────────────────────────────────────

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  if (!GlobalConfig.wowoFeatures.auth) {
    const dummyUser: User = {
      id: "dev-user-" + Date.now(),
      email: credentials.email,
      name: credentials.email.split("@")[0],
      phone: "1234567890",
      role: "ROLE_ADMIN",
      orgId: "dev-org",
      avatar: `/avatars/default.jpg`,
    };
    return {
      accessToken: "",
      refreshToken: "",
      tokenType: "Bearer",
      expiresIn: 86400,
      user: dummyUser,
    };
  }

  try {
    console.log("[AUTH SERVICE] Logging in user:", credentials.email);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    console.log("[AUTH SERVICE] Login successful, user:", data.user?.email);

    return {
      accessToken: "",
      refreshToken: "",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: data.user,
    };
  } catch (error: unknown) {
    console.error("[AUTH SERVICE] Login error:", error);
    throw new Error("Login failed: " + (error as Error).message);
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (error: unknown) {
    console.error("Logout error:", error);
  }
  localStorage.removeItem("auth_user");
}

export async function refreshToken(): Promise<string> {
  if (!GlobalConfig.wowoFeatures.auth) {
    return "dev-token-" + Date.now();
  }

  try {
    console.log("[AUTH SERVICE] Refreshing token...");
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Token refresh failed");
    }

    await response.json();
    console.log("[AUTH SERVICE] Token refreshed successfully");
    return "";
  } catch (error: unknown) {
    console.error("[AUTH SERVICE] Token refresh failed:", error);
    throw new Error(`Token refresh failed: ${(error as Error).message}`);
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("auth_user");
  return user ? JSON.parse(user) : null;
}

export async function getCurrentUserFromSession(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.user || null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Deprecated stubs — kept for compilation compatibility only
// User creation is handled exclusively via the HR module
// ─────────────────────────────────────────────────────────────

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  profilePhoto?: string;
}

export async function signup(_data: SignupRequest): Promise<AuthResponse> {
  throw new Error(
    "Signup is disabled in nexus-suite. Users must be created via the HR module (nexus-ui/hr).",
  );
}

export async function createOrganization(
  _userId: string,
  _orgName: string,
  _orgType: string,
): Promise<{
  orgId: number;
  orgName: string;
  orgType: string;
  trustScore: number;
  createdAt: string;
  people: Array<{
    role: { id: number; name: string };
    user: {
      address: string;
      createdAt: string;
      email: string;
      joiningDate: string | null;
      name: string;
      notes: string | null;
      organizationId: string | null;
      peopleId: string | null;
      phone: string;
      profilePhoto: string | null;
      salary: string | null;
    };
  }>;
}> {
  throw new Error(
    "Organization creation is disabled in nexus-suite. Use the HR module.",
  );
}
