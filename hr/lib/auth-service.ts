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
  Department,
  EmployeeInsights,
  EmployeeDirectoryResponse,
  EmployeeDetailsResponse
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
    console.log("[AUTH SERVICE] Starting signup for email:", data.email);

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

    console.log("[AUTH SERVICE] Calling /api/auth/signup endpoint");

    // Call Next.js API route directly (not through proxy)
    // This endpoint doesn't require authentication
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      credentials: "include", // Include cookies for session tokens
      body: formData
      // Don't set Content-Type header - let fetch set it with proper boundary
    });

    console.log("[AUTH SERVICE] Response status:", response.status);
    console.log("[AUTH SERVICE] Response ok:", response.ok);

    if (!response.ok) {
      const error = await response.json();
      console.error("[AUTH SERVICE] Signup error:", error);
      throw new Error(error.error || "Signup failed");
    }

    const data_response = await response.json();
    console.log(
      "[AUTH SERVICE] Signup successful, user:",
      data_response.user?.email
    );

    // Store user in localStorage
    // Tokens are kept server-side in encrypted cookies
    localStorage.setItem("auth_user", JSON.stringify(data_response.user));

    return {
      accessToken: "", // Not exposed to frontend
      refreshToken: "", // Not exposed to frontend
      tokenType: "Bearer",
      expiresIn: data_response.expiresIn || 3600,
      user: data_response.user
    };
  } catch (error: unknown) {
    console.error("[AUTH SERVICE] Signup failed:", error);
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
    console.log("[AUTH SERVICE] Refreshing token...");
    // Call Next.js API route to refresh token (handled server-side)
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // Include cookies
      headers: {
        "Content-Type": "application/json"
      }
    });

    console.log("[AUTH SERVICE] Refresh response status:", response.status);
    console.log("[AUTH SERVICE] Refresh response ok:", response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[AUTH SERVICE] Refresh error:", errorData);
      throw new Error(errorData.error || "Token refresh failed");
    }

    const data = await response.json();
    console.log("[AUTH SERVICE] Token refreshed successfully");

    // Session is automatically updated in cookies, return empty string
    // since tokens are not exposed to frontend
    return "";
  } catch (error: unknown) {
    console.error("[AUTH SERVICE] Token refresh failed:", error);
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
  orgId: string,
  deptId?: number,
  isDeptHead?: boolean,
  profilePicture?: File,
  hrDocuments?: File[],
  compensation?: any,
  title?: string,
  personalEmail?: string,
  remarks?: string,
  gender?: string,
  age?: number,
  dateOfBirth?: Date | string | null
): Promise<{
  email: string;
  password: string;
  message: string;
  userId: string;
  joiningLetter?: string;
  letterOfIntent?: string;
  compensationCard?: string;
}> {
  try {
    const formData = new FormData();

    // Handle all files (profile picture + HR documents) under 'files' key
    if (profilePicture) {
      formData.append("files", profilePicture);
    }

    if (hrDocuments && hrDocuments.length > 0) {
      hrDocuments.forEach((doc) => {
        formData.append("files", doc);
      });
    }

    // Append employee data as dto blob
    formData.append(
      "dto",
      new Blob(
        [
          JSON.stringify({
            name: fullName,
            email,
            phone,
            joiningDate,
            salary,
            address,
            notes,
            role,
            orgId,
            deptId: deptId || 0,
            isDeptHead: isDeptHead || false,
            title: title || "",
            personalEmail: personalEmail || "",
            remarks: remarks || "",
            gender: gender || "",
            age: age || 0,
            dateOfBirth: dateOfBirth
              ? typeof dateOfBirth === "string"
                ? dateOfBirth
                : dateOfBirth.toISOString().split("T")[0]
              : null,
            compensation: compensation || {}
          })
        ],
        { type: "application/json" }
      )
    );

    const response = await apiClientMultipart.post<{
      email: string;
      password: string;
      message: string;
      userId: string;
      joiningLetter?: string;
      letterOfIntent?: string;
      compensationCard?: string;
    }>(`/iam/users/add`, formData);
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
    }>(`/iam/roles/create/role?role=${role}&deptId=${deptId}`);
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
): Promise<RoleCompensation> {
  try {
    const response = await apiClient.post<RoleCompensation>(
      "/iam/department/add/employee/paycheck",
      compensationData
    );
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

export async function getAllDepartments(orgId: number): Promise<
  {
    deptId: number;
    deptName: string;
  }[]
> {
  try {
    console.log("[API] Fetching departments for orgId:", orgId);
    const response = await apiClient.get(
      `/iam/department/allDepts?orgId=${orgId}`
    );
    console.log("[API] Department response:", response.data);
    return response.data || [];
  } catch (error) {
    console.error("[API] Error fetching departments:", error);
    throw error;
  }
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

export async function fetchRoleCompensation(
  orgId: number,
  pageNo: number = 0,
  pageOffset: number = 10
): Promise<{
  content: RoleCompensation[];
  totalPages: number;
  totalElements: number;
  number: number;
}> {
  try {
    const response = await apiClient.get(
      `/iam/department/employee/paycheck?orgId=${orgId}&pageNo=${pageNo}&pageOffset=${pageOffset}`
    );
    return {
      content: response.data?.content || [],
      totalPages: response.data?.totalPages || 0,
      totalElements: response.data?.totalElements || 0,
      number: response.data?.number || 0
    };
  } catch (error: unknown) {
    throw new Error(
      `Fetch role compensation failed: ${(error as Error).message}`
    );
  }
}

export async function getEmployeeInsights(
  orgId: string
): Promise<EmployeeInsights> {
  try {
    const response = await apiClient.get<EmployeeInsights>(
      `/iam/organizations/employees/insights?orgId=${orgId}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch employee insights failed: ${(error as Error).message}`
    );
  }
}

export async function getEmployeeDirectory(
  orgId: string,
  pageNo: number = 0,
  pageOffset: number = 10
): Promise<EmployeeDirectoryResponse> {
  try {
    const response = await apiClient.get<EmployeeDirectoryResponse>(
      `/iam/organizations/employee/directory?orgId=${orgId}&pageNo=${pageNo}&pageOffset=${pageOffset}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch employee directory failed: ${(error as Error).message}`
    );
  }
}

export async function getEmployeeDetails(
  userId: number
): Promise<EmployeeDetailsResponse> {
  try {
    const response = await apiClient.get<EmployeeDetailsResponse>(
      `/iam/organizations/employee/details?userId=${userId}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch employee details failed: ${(error as Error).message}`
    );
  }
}
