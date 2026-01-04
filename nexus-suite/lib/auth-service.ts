import apiClient, { setAccessToken, clearAccessToken } from "./api-client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  profilePhoto?: string;
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
  userId: string;
  username: string;
  role: UserRole;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar?: string;
  };
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>(
      "/iam/auth/login",
      credentials
    );

    const { accessToken, refreshToken, expiresIn, userId, username, role } =
      response.data;

    // Store access token in memory
    setAccessToken(accessToken);

    // Backend sets refresh token in HTTP-only cookie automatically
    // (via Set-Cookie header with withCredentials: true)

    // Transform response to user object for storage
    const user = {
      id: userId,
      email: credentials.email,
      name: username,
      role: role,
      avatar: `/avatars/${username}.jpg`
    };

    return {
      accessToken,
      refreshToken,
      tokenType: response.data.tokenType,
      expiresIn,
      userId,
      username,
      role,
      user
    };
  } catch (error: unknown) {
    clearAccessToken();
    throw new Error("Login failed: " + (error as Error).message);
  }
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>("/iam/auth/register", {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      address: data.address,
      profilePhoto: data.profilePhoto || ""
    });

    const { accessToken, refreshToken, expiresIn, userId, username, role } =
      response.data;
    setAccessToken(accessToken);

    const user = {
      id: userId,
      email: data.email,
      name: data.name,
      role: role,
      avatar: `/avatars/${username}.jpg`
    };

    return {
      accessToken,
      refreshToken,
      tokenType: response.data.tokenType,
      expiresIn,
      userId,
      username,
      role,
      user
    };
  } catch (error: unknown) {
    clearAccessToken();
    throw new Error("Signup failed: " + (error as Error).message);
  }
}

export async function logout(): Promise<void> {
  // JWT is stateless, no need to call backend
  // Just clear tokens on frontend
  clearAccessToken();
  localStorage.removeItem("auth_user");
}

export async function refreshToken(): Promise<string> {
  try {
    const response = await apiClient.post<{
      accessToken: string;
      expiresIn: number;
    }>("/iam/auth/refresh");

    const { accessToken } = response.data;
    setAccessToken(accessToken);

    return accessToken;
  } catch (error: unknown) {
    clearAccessToken();
    throw new Error(`Token refresh failed: ${(error as Error).message}`);
  }
}

export async function createOrganization(
  userId: string,
  orgName: string,
  orgType: string
): Promise<{ organizationId: string }> {
  try {
    const response = await apiClient.post<{ organizationId: string }>(
      `/iam/organizations/add?member=${userId}`,
      {
        orgName,
        orgType,
        trustScore: 0
      }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Organization creation failed: ${(error as Error).message}`
    );
  }
}

export async function createPeople(
  userId: string,
  role: string
): Promise<{ role: string }> {
  try {
    const response = await apiClient.post<{ role: string }>(
      `/iam/people/create`,
      {
        userId,
        role
      }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`People creation failed: ${(error as Error).message}`);
  }
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("auth_user");
  return user ? JSON.parse(user) : null;
}
