import GlobalConfig from "@/global.config";
import apiClient, { apiClientMultipart } from "@/lib/api-client";
import type {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  ApiAuthResponse,
  User,
  GrantPermission,
  RoleCompensation,
  Department
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

    return {
      accessToken: "",
      refreshToken: "",
      tokenType: "Bearer",
      expiresIn: 86400,
      user: dummyUser
    };
  }

  try {
    console.log("[AUTH SERVICE] Logging in user:", credentials.email);

    // Call Next.js API route instead of Spring Boot directly
    // JWT tokens are kept server-side in encrypted cookies
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include", // Include cookies
      body: JSON.stringify(credentials)
    });

    console.log("[AUTH SERVICE] Response status:", response.status);
    console.log("[AUTH SERVICE] Response ok:", response.ok);

    if (!response.ok) {
      const error = await response.json();
      console.error("[AUTH SERVICE] Login error:", error);
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    console.log("[AUTH SERVICE] Login successful, user:", data.user?.email);

    return {
      accessToken: "", // Not exposed to frontend
      refreshToken: "", // Not exposed to frontend
      tokenType: "Bearer",
      expiresIn: 3600,
      user: data.user
    };
  } catch (error: unknown) {
    console.error("[AUTH SERVICE] Login error:", error);
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

    return {
      accessToken: "",
      refreshToken: "",
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
      new Blob(
        [
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
        ],
        { type: "application/json" }
      )
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
    throw new Error("Signup failed: " + (error as Error).message);
  }
}

export async function logout(): Promise<void> {
  // Call Next.js API route to clear server-side session
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include" // Include cookies
    });
  } catch (error: unknown) {
    console.error("Logout error:", error);
  }
  // Clear frontend state
  localStorage.removeItem("auth_user");
}

export async function refreshToken(): Promise<string> {
  // Dummy token refresh for development mode
  if (!GlobalConfig.wowoFeatures.auth) {
    return "dev-token-" + Date.now();
  }

  try {
    // Call Next.js API route to refresh token (handled server-side)
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include" // Include cookies
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    // Session is automatically updated in cookies, return empty string
    // since tokens are not exposed to frontend
    return "";
  } catch (error: unknown) {
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

export async function grantPermission(
  permissionData: GrantPermission
): Promise<{ message: string; permissionId?: string; status: string }> {
  try {
    const response = await apiClient.post<{
      message: string;
      permissionId?: string;
      status: string;
    }>("/iam/permissions/grant", permissionData);
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Grant permission failed: ${(error as Error).message}`);
  }
}

export async function createDepartment(
  orgId: number,
  deptName: string
): Promise<{
  departmentId: number;
  departmentName: string;
  members: Array<unknown>;
  roles: Array<unknown>;
  createdAt: string;
}> {
  try {
    // The proxy will automatically convert these body properties to query parameters
    /**
     * response body 
     * {
    "departmentId": 8,
    "departmentName": "Tech HR",
    "members": [],
    "roles": [],
    "createdAt": "2026-02-10T18:57:06.842Z"
}
     */
    const response = await apiClient.post<{
      departmentId: number;
      departmentName: string;
      members: Array<unknown>;
      roles: Array<unknown>;
      createdAt: string;
    }>(`/iam/department/add?orgId=${orgId}&deptName=${deptName}`);
    console.log(response.data);

    return response.data;
  } catch (error: unknown) {
    throw new Error(`Create department failed: ${(error as Error).message}`);
  }
}

export async function createRole(
  role: string,
  deptId: number
): Promise<{
  data: { message: string; roleId?: string };
  status: number;
}> {
  try {
    const response = await apiClient.post<{
      message: string;
      roleId?: string;
    }>("/iam/roles/create/role", {
      role,
      deptId
    });
    return {
      data: response.data,
      status: response.status
    };
  } catch (error: unknown) {
    throw new Error(`Create role failed: ${(error as Error).message}`);
  }
}

export async function addRoleCompensation(
  compensationData: RoleCompensation
): Promise<{ message: string; compensationId?: string }> {
  try {
    const response = await apiClient.post<{
      message: string;
      compensationId?: string;
    }>("/hr/employee/paycheck/add", compensationData);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Add role compensation failed: ${(error as Error).message}`
    );
  }
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("auth_user");
  return user ? JSON.parse(user) : null;
}

// Fetch current user from server session
export async function getCurrentUserFromSession(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "include"
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function getDeptOverview(
  orgId: number
): Promise<Department[] | null> {
  const response = await apiClient.get(
    `/iam/department/overview?orgId=${orgId}`
  );
  return response.data || null;
}

/**
 *   "totalDepartments": 6,
  "totalEmployees": 0,
  "totalRoles": 2,
  "totalPermissions": 0
 */
export async function getAllDeptOverview(orgId: number): Promise<{
  totalDepartments: number;
  totalEmployees: number;
  totalRoles: number;
  totalPermissions: number;
}> {
  const response = await apiClient.get(
    `/iam/department/allDept/overview?orgId=${orgId}`
  );
  return response.data || null;
}

export async function getDeptRoles(deptId: number): Promise<
  {
    id: number;
    name: string;
  }[]
> {
  const response = await apiClient.get(
    `/iam/department/fetch/roles?deptId=${deptId}`
  );
  return response.data || null;
}

export async function fetchDeptRolesTable(
  orgId: number,
  pageNo: number = 0,
  pageOffset: number = 10
): Promise<
  Array<{
    departmentId: number;
    departmentName: string;
    role: string;
    noOfEmployees: number;
    createdOn: string;
    permissions: string[];
    status: string;
  }>
> {
  try {
    const response = await apiClient.get(
      `/iam/department/dept/roles/table?orgId=${orgId}&pageNo=${pageNo}&pageOffset=${pageOffset}`
    );
    return response.data?.content || [];
  } catch (error: unknown) {
    throw new Error(
      `Fetch department roles table failed: ${(error as Error).message}`
    );
  }
}
