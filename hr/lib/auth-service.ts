import apiClient, {
  setAccessToken,
  clearAccessToken,
  apiClientMultipart
} from "./api-client";
import GlobalConfig from "@/global.config";
import type {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  ApiAuthResponse,
  User
} from "@/types";

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  // Dummy auth flow for development mode
  if (!GlobalConfig.wowoFeatures.auth) {
    // Create a dummy user from any credentials
    const dummyUser: User = {
      id: "dev-user-" + Date.now(),
      email: credentials.email,
      name: credentials.email.split("@")[0],
      role: "ROLE_ADMIN",
      orgId: "dev-org",
      avatar: `/avatars/default.jpg`
    };

    // Set a dummy token for consistency
    const dummyToken = "dev-token-" + Date.now();
    setAccessToken(dummyToken);

    return {
      accessToken: dummyToken,
      refreshToken: dummyToken,
      tokenType: "Bearer",
      expiresIn: 86400,
      user: dummyUser
    };
  }

  try {
    const response = await apiClient.post<ApiAuthResponse>(
      "/iam/auth/login",
      credentials
    );

    const {
      accessToken,
      refreshToken,
      tokenType,
      expiresIn,
      userId,
      orgId,
      name,
      role,
      email
    } = response.data;

    // Store access token in memory
    setAccessToken(accessToken);

    // Backend sets refresh token in HTTP-only cookie automatically
    // (via Set-Cookie header with withCredentials: true)

    // Transform response to user object for storage
    const user: User = {
      id: userId,
      email: email,
      name: name,
      role: role,
      orgId: orgId,
      avatar: `/avatars/${name}.jpg`
    };

    return {
      accessToken,
      refreshToken,
      tokenType: tokenType,
      expiresIn: expiresIn,
      user
    };
  } catch (error: unknown) {
    clearAccessToken();
    throw new Error("Login failed: " + (error as Error).message);
  }
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  // Dummy auth flow for development mode
  if (!GlobalConfig.wowoFeatures.auth) {
    // Create a dummy user from signup data
    const dummyUser: User = {
      id: "dev-user-" + Date.now(),
      email: data.email,
      name: data.name,
      role: "ROLE_ADMIN",
      orgId: "dev-org",
      avatar: `/avatars/${data.name}.jpg`
    };

    // Set a dummy token for consistency
    const dummyToken = "dev-token-" + Date.now();
    setAccessToken(dummyToken);

    return {
      accessToken: dummyToken,
      refreshToken: dummyToken,
      tokenType: "Bearer",
      expiresIn: 86400,
      user: dummyUser
    };
  }

  try {
    const formData = new FormData();

    // Handle profilePicture: convert base64 string to Blob if needed
    if (data.profilePicture) {
      if (typeof data.profilePicture === "string") {
        // Convert base64 string to Blob
        // Handle both "data:image/jpeg;base64,..." and raw base64 formats
        const base64String = data.profilePicture.includes(",")
          ? data.profilePicture.split(",")[1]
          : data.profilePicture;

        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/jpeg" });
        formData.append("profilePicture", blob, "profile.jpg");
      } else {
        // It's a File object
        formData.append("profilePicture", data.profilePicture as Blob);
      }
    }

    formData.append(
      "dto",
      JSON.stringify({
        name: data.name,
        email: data.email,
        personalEmail: data.personalEmail,
        password: data.password,
        phone: data.phone,
        title: data.title,
        role: data.role,
        gender: data.gender,
        age: data.age,
        dateOfBirth: data.dateOfBirth,
        department: data.department,
        address: data.address,
        compensation: data.compensation,
        orgName: data.orgName,
        orgType: data.orgType
      })
    );
    const response = await apiClientMultipart.post<ApiAuthResponse>(
      "/iam/auth/register",
      formData
    );

    const {
      accessToken,
      refreshToken,
      tokenType,
      expiresIn,
      userId,
      orgId,
      name,
      role,
      email
    } = response.data;
    setAccessToken(accessToken);

    const user: User = {
      id: userId,
      email: email,
      name: name,
      role: role,
      orgId: orgId,
      avatar: `/avatars/${name}.jpg`
    };

    return {
      accessToken,
      refreshToken,
      tokenType: tokenType,
      expiresIn,
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
  // Dummy token refresh for development mode
  if (!GlobalConfig.wowoFeatures.auth) {
    const dummyToken = "dev-token-" + Date.now();
    setAccessToken(dummyToken);
    return dummyToken;
  }

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
): Promise<{
  orgId: number;
  orgName: string;
  orgType: string;
  trustScore: number;
  createdAt: string;
  people: Array<{
    role: {
      id: number;
      name: string;
    };
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
  try {
    const response = await apiClient.post<{
      orgId: number;
      orgName: string;
      orgType: string;
      trustScore: number;
      createdAt: string;
      people: Array<{
        role: {
          id: number;
          name: string;
        };
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
    }>(`/iam/organizations/add?member=${userId}`, {
      orgName,
      orgType,
      trustScore: 0
    });
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

export async function createPeopleWithOrg(
  userId: string,
  orgId: number,
  role: string
): Promise<{ role: string }> {
  try {
    const response = await apiClient.post<{ role: string }>(
      `/iam/people/create-with-org`,
      {
        userId,
        orgId,
        role
      }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `People creation with org failed: ${(error as Error).message}`
    );
  }
}

export async function addUser(
  fullName: string,
  email: string,
  phone: string,
  joiningDate: string,
  salary: number,
  address: string,
  notes: string,
  role: string,
  orgId: string
): Promise<{
  email: string;
  password: string;
  message: string;
  userId: string;
}> {
  try {
    const response = await apiClient.post<{
      email: string;
      password: string;
      message: string;
      userId: string;
    }>(`/iam/users/add`, {
      name: fullName,
      email,
      phone,
      joiningDate,
      salary,
      address,
      notes,
      role,
      orgId
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Add user failed: ${(error as Error).message}`);
  }
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("auth_user");
  return user ? JSON.parse(user) : null;
}
