import { LeaveType } from "./../types/index";
import GlobalConfig from "@/global.config";
import apiClient, { apiClientMultipart } from "@/lib/api-client";
import type {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  User,
  GrantPermission,
  RoleCompensation,
  Department,
  EmployeeInsights,
  EmployeeDirectoryResponse,
  EmployeeDetailsResponse,
  AttendancePageResponse,
  PayrollEmployeesResponse,
  EmployeeAttendanceResponse,
  AttendanceQuickUpdateResponse,
  ToggleAttendanceResponse,
  PayrollInitiationRequest,
  PayrollInitiationResponse,
  ProcessedPayrollsResponse,
  PayrollGraphsResponse,
  PayrollInsightsResponse,
  HrRequestsResponse,
  HrInsightsResponse,
  HeroAnalyticsResponse,
  TodayHrRequest,
  RequestStatus,
  RequestType,
  MonthlyStrengthResponse,
  LeaveTypeDistributionResponse,
  CheckInCheckOutResponse,
  BreakStartEndResponse,
  YearlyPayrollResponse,
  RoleWiseSalaryIncrementResponse,
  DepartmentWiseLeavesResponse,
  RoleWiseLeavesResponse,
  // Team types
  Team,
  TeamMember,
  TeamHierarchyResponse,
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMemberRequest,
  UpdateTeamMemberRequest,
  ChangeManagerRequest,
} from "@/types";
import { AxiosResponse } from "axios";

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  // Dummy auth flow for development mode
  if (!GlobalConfig.wowoFeatures.auth) {
    // Create a dummy user from any credentials
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

    // Call Next.js API route instead of Spring Boot directly
    // JWT tokens are kept server-side in encrypted cookies
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies
      body: JSON.stringify(credentials),
    });

    console.log("[AUTH SERVICE] Response status:", response.status);
    console.log("[AUTH SERVICE] Response ok:", response.ok);
    console.log("[AUTH SERVICE] Response headers:", [
      ...response.headers.entries(),
    ]);

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
      user: data.user,
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
      phone: data.phone || "1234567890",
      role: "ROLE_ADMIN",
      orgId: "dev-org",
      avatar: `/avatars/${data.name}.jpg`,
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
            orgType: data.orgType,
          }),
        ],
        { type: "application/json" },
      ),
    );

    console.log("[AUTH SERVICE] Calling /api/auth/signup endpoint");

    // Call Next.js API route directly (not through proxy)
    // This endpoint doesn't require authentication
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      credentials: "include", // Include cookies for session tokens
      body: formData,
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
      data_response.user?.email,
    );

    // Store user in localStorage
    // Tokens are kept server-side in encrypted cookies
    localStorage.setItem("auth_user", JSON.stringify(data_response.user));

    return {
      accessToken: "", // Not exposed to frontend
      refreshToken: "", // Not exposed to frontend
      tokenType: "Bearer",
      expiresIn: data_response.expiresIn || 3600,
      user: data_response.user,
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
      credentials: "include", // Include cookies
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
        "Content-Type": "application/json",
      },
    });

    console.log("[AUTH SERVICE] Refresh response status:", response.status);
    console.log("[AUTH SERVICE] Refresh response ok:", response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[AUTH SERVICE] Refresh error:", errorData);
      throw new Error(errorData.error || "Token refresh failed");
    }

    await response.json();
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
  orgType: string,
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
      trustScore: 0,
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Organization creation failed: ${(error as Error).message}`,
    );
  }
}

export async function createPeople(
  userId: string,
  role: string,
): Promise<{ role: string }> {
  try {
    const response = await apiClient.post<{ role: string }>(
      `/iam/people/create`,
      {
        userId,
        role,
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`People creation failed: ${(error as Error).message}`);
  }
}

export async function createPeopleWithOrg(
  userId: string,
  orgId: number,
  role: string,
): Promise<{ role: string }> {
  try {
    const response = await apiClient.post<{ role: string }>(
      `/iam/people/create-with-org`,
      {
        userId,
        orgId,
        role,
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `People creation with org failed: ${(error as Error).message}`,
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
  compensation?: Record<string, unknown>,
  title?: string,
  personalEmail?: string,
  remarks?: string,
  gender?: string,
  age?: number,
  dateOfBirth?: Date | string | null,
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
            compensation: compensation || {},
          }),
        ],
        { type: "application/json" },
      ),
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
  permissionData: GrantPermission,
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
  deptName: string,
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
  deptId: number,
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
      status: response.status,
    };
  } catch (error: unknown) {
    throw new Error(`Create role failed: ${(error as Error).message}`);
  }
}

export async function addRoleCompensation(
  compensationData: RoleCompensation,
): Promise<RoleCompensation> {
  try {
    const response = await apiClient.post<RoleCompensation>(
      "/iam/department/add/employee/paycheck",
      compensationData,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Add role compensation failed: ${(error as Error).message}`,
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
      credentials: "include",
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
  orgId: number,
): Promise<Department[] | null> {
  const response = await apiClient.get(
    `/iam/department/overview?orgId=${orgId}`,
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
    `/iam/department/allDept/overview?orgId=${orgId}`,
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
    `/iam/department/fetch/roles?deptId=${deptId}`,
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
      `/iam/department/allDepts?orgId=${orgId}`,
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
  pageOffset: number = 10,
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
      `/iam/department/dept/roles/table?orgId=${orgId}&pageNo=${pageNo}&pageOffset=${pageOffset}`,
    );
    return response.data?.content || [];
  } catch (error: unknown) {
    throw new Error(
      `Fetch department roles table failed: ${(error as Error).message}`,
    );
  }
}

export async function fetchRoleCompensation(
  orgId: number,
  pageNo: number = 0,
  pageOffset: number = 10,
): Promise<{
  content: RoleCompensation[];
  totalPages: number;
  totalElements: number;
  number: number;
}> {
  try {
    const response = await apiClient.get(
      `/iam/department/employee/paycheck?orgId=${orgId}&pageNo=${pageNo}&pageOffset=${pageOffset}`,
    );
    return {
      content: response.data?.content || [],
      totalPages: response.data?.totalPages || 0,
      totalElements: response.data?.totalElements || 0,
      number: response.data?.number || 0,
    };
  } catch (error: unknown) {
    throw new Error(
      `Fetch role compensation failed: ${(error as Error).message}`,
    );
  }
}

export async function getEmployeeInsights(
  orgId: string,
): Promise<EmployeeInsights> {
  try {
    const response = await apiClient.get<EmployeeInsights>(
      `/iam/organizations/employees/insights?orgId=${orgId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch employee insights failed: ${(error as Error).message}`,
    );
  }
}

export async function getHeroAnalytics(orgId: number) {
  try {
    const response = await apiClient.get<HeroAnalyticsResponse>(
      `/iam/organizations/hero-analytics?orgId=${orgId}`,
    );
    return response;
  } catch (error: unknown) {
    throw new Error(`Fetch hero analytics failed: ${(error as Error).message}`);
  }
}

export async function getTodayHrRequests(
  orgId: number,
  options?: {
    status?: RequestStatus;
    page?: number;
    offset?: number;
    empName?: string;
    requestType?: RequestType;
  },
): Promise<TodayHrRequest[]> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
    });

    if (options?.status) {
      queryParams.append("status", options.status);
    }

    if (typeof options?.page === "number") {
      queryParams.append("page", String(options.page));
    }

    if (typeof options?.offset === "number") {
      queryParams.append("offset", String(options.offset));
    }

    if (options?.empName) {
      queryParams.append("empName", options.empName);
    }

    if (options?.requestType) {
      queryParams.append("requestType", options.requestType);
    }

    const response = await apiClient.get<TodayHrRequest[]>(
      `/iam/organizations/hr-requests/today?${queryParams.toString()}`,
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch today HR requests failed: ${(error as Error).message}`,
    );
  }
}

export async function getEmployeeDirectory(
  orgId: string,
  pageNo: number = 0,
  pageOffset: number = 10,
): Promise<EmployeeDirectoryResponse> {
  try {
    const response = await apiClient.get<EmployeeDirectoryResponse>(
      `/iam/organizations/employee/directory?orgId=${orgId}&pageNo=${pageNo}&pageOffset=${pageOffset}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch employee directory failed: ${(error as Error).message}`,
    );
  }
}

export async function getEmployeeDetails(
  userId: number,
): Promise<EmployeeDetailsResponse> {
  try {
    const response = await apiClient.get<EmployeeDetailsResponse>(
      `/iam/organizations/employee/details?userId=${userId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch employee details failed: ${(error as Error).message}`,
    );
  }
}

export async function getAttendanceRecords(
  orgId: number,
  date: string,
  pageNo: number = 0,
  pageOffset: number = 10,
): Promise<AttendancePageResponse> {
  try {
    const response = await apiClient.get<AttendancePageResponse>(
      `/iam/organizations/employees/attendance?orgId=${orgId}&pageNo=${pageNo}&pageOffset=${pageOffset}&date=${date}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch attendance records failed: ${(error as Error).message}`,
    );
  }
}

export async function getPayrollEmployees(
  orgId: string,
  deptId?: number,
  role?: string,
  pageNo: number = 0,
  pageOffset: number = 10,
): Promise<PayrollEmployeesResponse> {
  try {
    let url = `/iam/organizations/get-payroll-employees?orgId=${orgId}&pageNo=${pageNo}&pageOffset=${pageOffset}`;
    if (deptId) {
      url += `&deptId=${deptId}`;
    }
    if (role) {
      url += `&role=${role}`;
    }

    const response = await apiClient.get<PayrollEmployeesResponse>(url);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch payroll employees failed: ${(error as Error).message}`,
    );
  }
}

export async function getEmployeeAttendance(
  employeeId: number,
): Promise<EmployeeAttendanceResponse> {
  try {
    const response = await apiClient.get<EmployeeAttendanceResponse>(
      `/iam/organizations/get-employee-this-month-attendance/${employeeId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch employee attendance failed: ${(error as Error).message}`,
    );
  }
}

export async function getAttendanceQuickUpdate(
  empId: number,
): Promise<AttendanceQuickUpdateResponse> {
  try {
    const response = await apiClient.get<AttendanceQuickUpdateResponse>(
      `/iam/organizations/time-management/quick-update?empId=${empId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch attendance quick update failed: ${(error as Error).message}`,
    );
  }
}

export async function toggleAttendance(
  userId: number,
): Promise<ToggleAttendanceResponse> {
  try {
    const response = await apiClient.get<ToggleAttendanceResponse>(
      `/iam/organizations/employee/toggle-attendance?userId=${userId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Toggle attendance failed: ${(error as Error).message}`);
  }
}

export async function initiatePayroll(
  request: PayrollInitiationRequest,
): Promise<PayrollInitiationResponse> {
  try {
    const response = await apiClient.post<PayrollInitiationResponse>(
      `/iam/employee-payroll/initiate`,
      request,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Initiate payroll failed: ${(error as Error).message}`);
  }
}

export async function getProcessedPayrolls(
  orgId: string,
  month: number,
  year: number,
  pageNo: number = 0,
  pageSize: number = 10,
): Promise<ProcessedPayrollsResponse> {
  try {
    // Build URL with query parameters to ensure they're properly encoded
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      month: String(month),
      year: String(year),
      pageNo: String(pageNo),
      pageSize: String(pageSize),
    }).toString();

    const response = await apiClient.get<ProcessedPayrollsResponse>(
      `/iam/organizations/get-processed-payrolls?${queryParams}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch processed payrolls failed: ${(error as Error).message}`,
    );
  }
}

export async function getPayrollGraphs(
  orgId: string,
  month: number,
  year: number,
): Promise<PayrollGraphsResponse> {
  try {
    // Convert month number to month name (e.g., 4 -> "APRIL")
    const monthNames = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ];
    const monthName = monthNames[month - 1];

    // Build URL with query parameters to ensure they're properly encoded
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      month: monthName,
      year: String(year),
    }).toString();

    const response = await apiClient.get<PayrollGraphsResponse>(
      `/iam/organizations/get-payroll-graphs?${queryParams}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Fetch payroll graphs failed: ${(error as Error).message}`);
  }
}

export async function getPayrollInsights(
  orgId: string,
  month: number,
  year: number,
): Promise<PayrollInsightsResponse> {
  try {
    // Convert month number to month name (e.g., 4 -> "APRIL")
    const monthNames = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ];
    const monthName = monthNames[month - 1];

    // Build URL with query parameters to ensure they're properly encoded
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      month: monthName,
      year: String(year),
    }).toString();

    const response = await apiClient.get<PayrollInsightsResponse>(
      `/iam/organizations/get-payroll-insights?${queryParams}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch payroll insights failed: ${(error as Error).message}`,
    );
  }
}

export async function getHrRequests(
  orgId: number,
  status?: string,
  requestType?: string,
  page: number = 0,
  offset: number = 10,
): Promise<HrRequestsResponse> {
  try {
    // Build URL with query parameters
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      page: String(page),
      offset: String(offset),
    });

    // Add optional parameters
    if (status) {
      queryParams.append("status", status);
    }
    if (requestType) {
      queryParams.append("requestType", requestType);
    }

    const response = await apiClient.get<HrRequestsResponse>(
      `/iam/organizations/hr-requests?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Fetch HR requests failed: ${(error as Error).message}`);
  }
}

export async function getClosedHrRequests(
  orgId: number,
  requestType?: string,
  page: number = 0,
  offset: number = 10,
): Promise<HrRequestsResponse> {
  try {
    // Build URL with query parameters
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      page: String(page),
      offset: String(offset),
    });

    // Add optional parameters
    if (requestType) {
      queryParams.append("requestType", requestType);
    }

    const response = await apiClient.get<HrRequestsResponse>(
      `/iam/organizations/hr-requests/closed?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch closed HR requests failed: ${(error as Error).message}`,
    );
  }
}

export async function getHrInsights(
  orgId: number,
): Promise<HrInsightsResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
    });

    const response = await apiClient.get<HrInsightsResponse>(
      `/iam/organizations/hr-requests/insights?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Fetch HR insights failed: ${(error as Error).message}`);
  }
}

export async function submitHrRequestAction(
  requestId: number,
  action: string,
  resolutionRemarks: string,
): Promise<string> {
  try {
    const queryParams = new URLSearchParams({
      requestId: String(requestId),
      action: action,
      resolutionRemarks: resolutionRemarks,
    });

    const response = await apiClient.post<string | { message: string }>(
      `/iam/organizations/hr-request/action?${queryParams.toString()}`,
      {},
    );

    // Handle both string and object responses from API
    if (typeof response.data === "string") {
      return response.data;
    }
    return response.data?.message || "Decision submitted successfully";
  } catch (error: unknown) {
    throw new Error(
      `Submit HR request action failed: ${(error as Error).message}`,
    );
  }
}

interface ApplyHrRequestPayload {
  empId: number;
  hrRequestType: RequestType;
  remarks?: string;
  fromDate?: string;
  toDate?: string;
  checkInHours?: string;
  checkOutHours?: string;
  halfDay?: boolean;
  leaveType?: LeaveType;
}

export async function applyHrRequest(
  payload: ApplyHrRequestPayload,
): Promise<string> {
  try {
    const response = await apiClient.post<string | { message: string }>(
      "/iam/organizations/hr-request",
      payload,
    );

    if (typeof response.data === "string") {
      return response.data;
    }

    return response.data?.message || "HR request submitted successfully";
  } catch (error: unknown) {
    throw new Error(`Apply HR request failed: ${(error as Error).message}`);
  }
}

// ============================================================================
// ANALYTICS API FUNCTIONS
// ============================================================================

export async function getMonthlyStrength(
  orgId: string,
): Promise<MonthlyStrengthResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
    });

    const response = await apiClient.get<MonthlyStrengthResponse>(
      `/iam/analytics/employee/avg-strength?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch monthly strength failed: ${(error as Error).message}`,
    );
  }
}

export async function getLeaveTypeDistribution(
  orgId: string,
  monthYear: string,
): Promise<LeaveTypeDistributionResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      monthYear: monthYear,
    });

    const response = await apiClient.get<LeaveTypeDistributionResponse>(
      `/iam/analytics/leave/type-distribution?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch leave type distribution failed: ${(error as Error).message}`,
    );
  }
}

export async function getCheckInCheckOut(
  orgId: string,
  monthYear: string,
): Promise<CheckInCheckOutResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      monthYear: monthYear,
    });

    const response = await apiClient.get<CheckInCheckOutResponse>(
      `/iam/analytics/employee/check-in-check-out?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch check-in check-out failed: ${(error as Error).message}`,
    );
  }
}

export async function getBreakStartEnd(
  orgId: string,
  monthYear: string,
): Promise<BreakStartEndResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      monthYear: monthYear,
    });

    const response = await apiClient.get<BreakStartEndResponse>(
      `/iam/analytics/employee/break-start-end?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch break start-end failed: ${(error as Error).message}`,
    );
  }
}

export async function getDepartmentWiseLeaves(
  orgId: string,
  monthYear: string,
): Promise<DepartmentWiseLeavesResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      monthYear,
    });

    const response = await apiClient.get<DepartmentWiseLeavesResponse>(
      `/iam/analytics/leaves/department-wise?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch department wise leaves failed: ${(error as Error).message}`,
    );
  }
}

export async function getRoleWiseLeaves(
  orgId: string,
  monthYear: string,
): Promise<RoleWiseLeavesResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      monthYear,
    });

    const response = await apiClient.get<RoleWiseLeavesResponse>(
      `/iam/analytics/leaves/role-wise?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch role wise leaves failed: ${(error as Error).message}`,
    );
  }
}

export async function getYearlyPayrollData(
  orgId: string,
): Promise<YearlyPayrollResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
    });

    const response = await apiClient.get<YearlyPayrollResponse>(
      `/iam/analytics/payroll/yearly?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch yearly payroll data failed: ${(error as Error).message}`,
    );
  }
}

export async function getRoleWiseSalaryIncrement(
  orgId: string,
): Promise<RoleWiseSalaryIncrementResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
    });

    const response = await apiClient.get<RoleWiseSalaryIncrementResponse>(
      `/iam/analytics/payroll/role-wise?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch role wise salary increment failed: ${(error as Error).message}`,
    );
  }
}

// Export alias for backward compatibility
export const getEmployeeMonthlyStrength = getMonthlyStrength;

// ============================================================================
// RECRUITMENT API FUNCTIONS
// ============================================================================

interface CreateHiringRequisitionPayload {
  title: string;
  shortDescription: string;
  description: string;
  orgId: number;
  departmentName: string;
  departmentId: number;
  roleName: string;
  openingTillDate: string;
  totalCompensation: string;
  hiringType: "PERMANENT" | "CONTRACT" | "INTERN";
}

export interface RecruitmentRequisition {
  createdAt: string;
  departmentName: string;
  hiringManager: number;
  hiringStatus: string;
  hiringType: string;
  recruitmentId: number;
  roleName: string;
  title: string;
  totalApplicants: number | null;
  location: string;
  minYearsOfExperience: number | undefined;
  maxYearsOfExperience: number | undefined;
  orgName: string;
}

export interface FullRecruitmentRequisition extends RecruitmentRequisition {
  departmentId: number;
  description: string;
  isActive: boolean;
  openingTillDate: string;
  orgId: number;
  shortDescription: string;
  totalCompensation: string;
  updatedAt: string;
}

export interface PaginatedRecruitmentResponse {
  content: RecruitmentRequisition[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  size: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  totalElements: number;
  totalPages: number;
}

export async function createHiringRequisition(
  empId: number,
  payload: CreateHiringRequisitionPayload,
): Promise<{
  recruitmentId: number;
  hiringStatus: string;
  createdAt: string;
  [key: string]: unknown;
}> {
  try {
    const response = await apiClient.post<{
      recruitmentId: number;
      hiringStatus: string;
      createdAt: string;
      [key: string]: unknown;
    }>(`/iam/recruitment/?empId=${empId}`, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Create hiring requisition failed: ${(error as Error).message}`,
    );
  }
}

export async function updateHiringRequisition(
  recruitmentId: number,
  empId: number,
  payload: CreateHiringRequisitionPayload,
): Promise<{
  recruitmentId: number;
  hiringStatus: string;
  updatedAt: string;
  [key: string]: unknown;
}> {
  try {
    const response = await apiClient.put<{
      recruitmentId: number;
      hiringStatus: string;
      updatedAt: string;
      [key: string]: unknown;
    }>(`/iam/recruitment/${recruitmentId}?empId=${empId}`, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Update hiring requisition failed: ${(error as Error).message}`,
    );
  }
}

export async function getOpenRecruitments(
  orgId: number,
  options?: {
    isActive?: boolean;
    empId?: number;
    hiringType?: string;
    hiringStatus?: string;
    pageNo?: number;
    pageOffset?: number;
  },
): Promise<PaginatedRecruitmentResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
    });

    if (options?.isActive !== undefined) {
      queryParams.append("isActive", String(options.isActive));
    }
    if (options?.empId) {
      queryParams.append("empId", String(options.empId));
    }
    if (options?.hiringType) {
      queryParams.append("hiringType", options.hiringType);
    }
    if (options?.hiringStatus) {
      queryParams.append("hiringStatus", options.hiringStatus);
    }
    if (typeof options?.pageNo === "number") {
      queryParams.append("pageNo", String(options.pageNo));
    }
    if (typeof options?.pageOffset === "number") {
      queryParams.append("pageOffset", String(options.pageOffset));
    }

    const response = await apiClient.get<PaginatedRecruitmentResponse>(
      `/iam/recruitment/?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch open recruitments failed: ${(error as Error).message}`,
    );
  }
}

export async function getClosedRecruitments(
  orgId: number,
  options?: {
    pageNo?: number;
    pageOffset?: number;
  },
): Promise<PaginatedRecruitmentResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
    });

    if (typeof options?.pageNo === "number") {
      queryParams.append("pageNo", String(options.pageNo));
    }
    if (typeof options?.pageOffset === "number") {
      queryParams.append("pageOffset", String(options.pageOffset));
    }

    const response = await apiClient.get<PaginatedRecruitmentResponse>(
      `/iam/recruitment/closed?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch closed recruitments failed: ${(error as Error).message}`,
    );
  }
}

export async function getRecruitmentDetails(
  recruitmentId: number,
): Promise<FullRecruitmentRequisition> {
  try {
    const response = await apiClient.get<FullRecruitmentRequisition>(
      `/iam/recruitment/${recruitmentId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch recruitment details failed: ${(error as Error).message}`,
    );
  }
}

interface ApplicantDocument {
  createdOn: string;
  documentName: string;
  documentUrl: string;
  hrDocumentId: number;
  hrDocumentType: "RESUME" | "COVER_LETTER";
}

export interface RecruitmentApplicant {
  applicantAge: number;
  applicantCity: string;
  applicantCountry: string;
  applicantDocuments: ApplicantDocument[];
  applicantEmail: string;
  applicantFirstName: string;
  applicantGender: string;
  applicantId: number;
  applicantLastName: string;
  applicantPhone: string;
  applicantState: string;
  previousCompany: string;
  totalYearsOfExperience: number;
  applicationStatus: string;
}

export interface PaginatedApplicantsResponse {
  content: RecruitmentApplicant[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  size: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  totalElements: number;
  totalPages: number;
}

export async function getRecruitmentApplicants(
  recruitmentId: number,
  options?: {
    pageNo?: number;
    pageSize?: number;
    status?: string;
    name?: string;
    gender?: string;
    minAge?: number;
    maxAge?: number;
    appliedFromDate?: string;
    appliedToDate?: string;
    yearsOfExperience?: number;
  },
): Promise<PaginatedApplicantsResponse> {
  try {
    const queryParams = new URLSearchParams({
      recruitmentId: String(recruitmentId),
    });

    if (typeof options?.pageNo === "number") {
      queryParams.append("pageNo", String(options.pageNo));
    }
    if (typeof options?.pageSize === "number") {
      queryParams.append("pageSize", String(options.pageSize));
    }
    if (options?.status) {
      queryParams.append("status", options.status);
    }
    if (options?.name) {
      queryParams.append("name", options.name);
    }
    if (options?.gender) {
      queryParams.append("gender", options.gender);
    }
    if (typeof options?.minAge === "number") {
      queryParams.append("minAge", String(options.minAge));
    }
    if (typeof options?.maxAge === "number") {
      queryParams.append("maxAge", String(options.maxAge));
    }
    if (options?.appliedFromDate) {
      queryParams.append("appliedFromDate", options.appliedFromDate);
    }
    if (options?.appliedToDate) {
      queryParams.append("appliedToDate", options.appliedToDate);
    }
    if (typeof options?.yearsOfExperience === "number") {
      queryParams.append(
        "yearsOfExperience",
        String(options.yearsOfExperience),
      );
    }

    const response = await apiClient.get<PaginatedApplicantsResponse>(
      `/iam/recruitment/applicant?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch recruitment applicants failed: ${(error as Error).message}`,
    );
  }
}

interface ApplicantEducation {
  applicantEducationId: number;
  city: string;
  country: string;
  createdAt: string;
  degree: string;
  endDate: string;
  institute: string;
  isActive: boolean;
  startDate: string;
  state: string;
  updatedAt: string;
}

interface ApplicantExperience {
  applicantExperienceId: number;
  createdAt: string;
  endDate: string;
  isActive: boolean;
  jobDescription: string;
  jobTitle: string;
  previousCompany: string;
  startDate: string;
  updatedAt: string;
  yearsOfExperience: number;
}

interface ApplicantSkill {
  applicantSkillId: number;
  createdAt: string;
  isActive: boolean;
  skillName: string;
  updatedAt: string;
}

export interface ApplicantDetail {
  applicantAddress: string;
  applicantAge: number;
  applicantCity: string;
  applicantCountry: string;
  applicantDateOfBirth: string;
  applicantDocuments: ApplicantDocument[];
  applicantEducations: ApplicantEducation[];
  applicantEmail: string;
  applicantExperiences: ApplicantExperience[];
  applicantFirstName: string;
  applicantGender: string;
  applicantId: number;
  applicantLastName: string;
  applicantPhone: string;
  applicantPinCode: string;
  applicantSkills: ApplicantSkill[];
  applicantState: string;
  applicationStatus: string;
  appliedOn: string;
  isActive: boolean;
  updatedOn: string;
}

export async function getRecruitmentApplicantDetail(
  applicantId: number,
): Promise<ApplicantDetail> {
  try {
    const response = await apiClient.get<ApplicantDetail>(
      `/iam/recruitment/applicant/${applicantId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch applicant details failed: ${(error as Error).message}`,
    );
  }
}

export interface AnalyticsMetric {
  value: number;
  type: "DIFFERENCE_COMPARISON" | "VALUE_COMPARISON";
  difference: number;
  trend: "INCREMENT" | "DECREMENT" | "STABLE";
  description: string;
  comparisonWith: string;
}

export interface RecruitmentAnalytics {
  currentApplications: AnalyticsMetric;
  offerAcceptance: AnalyticsMetric;
  offerSent: AnalyticsMetric;
  openRoles: AnalyticsMetric;
  recruitmentTAT: AnalyticsMetric;
  underReview: AnalyticsMetric;
}

export async function getRecruitmentAnalytics(
  orgId: number,
): Promise<RecruitmentAnalytics> {
  try {
    const response = await apiClient.get<RecruitmentAnalytics>(
      `/iam/recruitment/analytics?orgId=${orgId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch recruitment analytics failed: ${(error as Error).message}`,
    );
  }
}

export interface CreateEventTemplateRequest {
  eventTemplateId?: number;
  templateName: string;
  eventTemplateType: string;
  orgId: number;
  eventSubject: string;
  templateParams: {
    paramName: string;
    paramDefaultValue: string;
    templateParamType: string;
    isRequired: boolean;
  }[];
  templateHtml: string;
  isActive?: boolean;
}

export interface CreateEventTemplateResponse {
  createdAt: string;
  eventTemplateId: number;
  eventTemplateType: string;
  isActive: boolean;
  orgId: number;
  eventSubject: string;
  templateHtml: string;
  templateHtmlUrl: string;
  templateName: string;
  templateParams: {
    createdAt: string;
    isActive: boolean;
    isRequired: boolean;
    paramDefaultValue: string;
    paramName: string;
    templateParamId: number;
    templateParamType: string;
    updatedAt: string;
  }[];
  updatedAt: string;
}

/**
 * {
    "createdAt": "2026-06-09T20:01:39.082Z",
    "eventTemplateId": 1,
    "eventTemplateType": "EXTERNAL_MAIL_TEMPLATE",
    "numberOfParams": 1,
    "orgId": 24,
    "templateHtmlUrl": "https://ipfs.filebase.io/ipfs/QmZREaGffg5ue7r3UwhexitZzd71uJVuB1nqJnpPWa5x9j",
    "templateName": "DEMO_EVENT_TEMPLATE",
    "updatedAt": "2026-06-09T20:01:39.082Z"
}
 */

export interface ShortEventTemplateResponse {
  createdAt: string;
  eventTemplateId: number;
  eventTemplateType: string;
  orgId: number;
  templateHtmlUrl: string;
  templateName: string;
  updatedAt: string;
  numberOfParams: number;
}

export async function createEventTemplate(
  request: CreateEventTemplateRequest,
): Promise<CreateEventTemplateResponse> {
  try {
    const response = await apiClient.post<CreateEventTemplateResponse>(
      "/iam/organizations/event-onboarding/template",
      request,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Failed to create event template: ${(error as Error).message}`,
    );
  }
}

export async function getEventTemplates(
  orgId: number,
): Promise<ShortEventTemplateResponse[]> {
  try {
    const response = await apiClient.get<ShortEventTemplateResponse[]>(
      `/iam/organizations/event-onboarding/template?orgId=${orgId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Failed to fetch event templates: ${(error as Error).message}`,
    );
  }
}

export async function getEventTemplateById(
  templateId: number,
): Promise<CreateEventTemplateResponse> {
  try {
    const response = await apiClient.get<CreateEventTemplateResponse>(
      `/iam/organizations/event-onboarding/template/${templateId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Failed to fetch event template by ID: ${(error as Error).message}`,
    );
  }
}

export async function getEventTemplateByName(
  templateName: string,
  orgId: number,
): Promise<ShortEventTemplateResponse> {
  try {
    const response = await apiClient.get<ShortEventTemplateResponse>(
      `/iam/organizations/event-onboarding/template/name?templateName=${encodeURIComponent(
        templateName,
      )}&orgId=${orgId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Failed to fetch event template by name: ${(error as Error).message}`,
    );
  }
}

export async function updateEventTemplate(
  templateUpdate: boolean,
  request: CreateEventTemplateRequest,
): Promise<CreateEventTemplateResponse> {
  try {
    const response = await apiClient.put<CreateEventTemplateResponse>(
      `/iam/organizations/event-onboarding/template?templateUpdate=${templateUpdate}`,
      request,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Failed to update event template: ${(error as Error).message}`,
    );
  }
}

interface TriggerEventMailRequest {
  templateName: string;
  orgId: number;
  recipientEmails: string[];
  templateParams: {
    key: string;
    value: string;
  }[];
}

export async function triggerEventMail(
  triggerRequest: TriggerEventMailRequest,
): Promise<AxiosResponse<string | { message: string }>> {
  try {
    const response = await apiClient.post<string | { message: string }>(
      "/iam/organizations/event-onboarding/trigger",
      triggerRequest,
    );
    return response;
  } catch (error: unknown) {
    throw new Error(
      `Failed to trigger event mail: ${(error as Error).message}`,
    );
  }
}

// response:
// {
//   "Jun": 1
// }

export async function getEventHitsMonthWise(
  templateName: string,
  orgId: number,
): Promise<Record<string, number>> {
  try {
    const response = await apiClient.get<Record<string, number>>(
      `/iam/organizations/event-onboarding/hits?templateName=${encodeURIComponent(templateName)}&orgId=${orgId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Failed to fetch event hits monthwise: ${(error as Error).message}`,
    );
  }
}

// response:
// {
//   "RECEIVED": 0,
//   "FAILED": 0,
//   "PROCESSED": 1,
//   "PENDING": 0
// }

export async function getEventHitsStatusWise(
  templateName: string,
  orgId: number,
): Promise<Record<string, number>> {
  try {
    const response = await apiClient.get<Record<string, number>>(
      `/iam/organizations/event-status-breakdown?templateName=${encodeURIComponent(templateName)}&orgId=${orgId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Failed to fetch event hits statuswise: ${(error as Error).message}`,
    );
  }
}

// ============================================================================
// NEXUS BUDDY API FUNCTIONS
// ============================================================================

// Client Config APIs

// ============================================================================
// TEAM MANAGEMENT API FUNCTIONS
// ============================================================================

export async function createTeam(request: CreateTeamRequest): Promise<Team> {
  try {
    const response = await apiClient.post<Team>("/iam/team/create", request);
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Create team failed: ${(error as Error).message}`);
  }
}

export async function getTeam(teamId: number): Promise<Team> {
  try {
    const response = await apiClient.get<Team>(`/iam/team/${teamId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Get team failed: ${(error as Error).message}`);
  }
}

export async function getTeamsByDepartment(
  departmentId: number,
): Promise<Team[]> {
  try {
    const response = await apiClient.get<Team[]>(
      `/iam/team/department/${departmentId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Get teams by department failed: ${(error as Error).message}`,
    );
  }
}

export async function getAllTeamsByDepartment(
  departmentId: number,
): Promise<Team[]> {
  try {
    const response = await apiClient.get<Team[]>(
      `/iam/team/department/${departmentId}/all`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Get all teams by department failed: ${(error as Error).message}`,
    );
  }
}

export async function getEligibleLeads(
  departmentId: number,
): Promise<Array<{ id: number; name: string; email: string }>> {
  try {
    const response = await apiClient.get<
      Array<{ id: number; name: string; email: string }>
    >(`/iam/team/department/${departmentId}/eligible-leads`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Get eligible leads failed: ${(error as Error).message}`);
  }
}

export async function updateTeam(
  teamId: number,
  request: UpdateTeamRequest,
): Promise<Team> {
  try {
    const response = await apiClient.put<Team>(`/iam/team/${teamId}`, request);
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Update team failed: ${(error as Error).message}`);
  }
}

export async function deleteTeam(teamId: number): Promise<void> {
  try {
    await apiClient.delete(`/iam/team/${teamId}`);
  } catch (error: unknown) {
    throw new Error(`Delete team failed: ${(error as Error).message}`);
  }
}

export async function addTeamMember(
  teamId: number,
  request: AddTeamMemberRequest,
): Promise<TeamMember> {
  try {
    const response = await apiClient.post<TeamMember>(
      `/iam/team/${teamId}/member/add`,
      request,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Add team member failed: ${(error as Error).message}`);
  }
}

export async function getTeamMembers(teamId: number): Promise<TeamMember[]> {
  try {
    const response = await apiClient.get<TeamMember[]>(
      `/iam/team/${teamId}/members`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Get team members failed: ${(error as Error).message}`);
  }
}

export async function getTeamHierarchy(
  teamId: number,
): Promise<TeamHierarchyResponse> {
  try {
    console.log(
      `[DEBUG auth-service] getTeamHierarchy called for teamId: ${teamId}`,
    );
    const response = await apiClient.get<TeamHierarchyResponse>(
      `/iam/team/${teamId}/hierarchy`,
    );
    console.log(`[DEBUG auth-service] getTeamHierarchy response:`, {
      teamId: response.data.teamId,
      teamName: response.data.teamName,
      root: response.data.root
        ? {
            member: response.data.root.member,
            childrenCount: response.data.root.children?.length || 0,
          }
        : null,
    });
    return response.data;
  } catch (error: unknown) {
    console.error(`[DEBUG auth-service] getTeamHierarchy error:`, error);
    throw new Error(`Get team hierarchy failed: ${(error as Error).message}`);
  }
}

export async function updateTeamMember(
  memberId: number,
  request: UpdateTeamMemberRequest,
): Promise<TeamMember> {
  try {
    const response = await apiClient.put<TeamMember>(
      `/iam/team/member/${memberId}`,
      request,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Update team member failed: ${(error as Error).message}`);
  }
}

export async function changeManager(
  memberId: number,
  request: ChangeManagerRequest,
): Promise<TeamMember> {
  try {
    const response = await apiClient.put<TeamMember>(
      `/iam/team/member/${memberId}/manager`,
      request,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Change manager failed: ${(error as Error).message}`);
  }
}

export async function removeTeamMember(memberId: number): Promise<void> {
  try {
    await apiClient.delete(`/iam/team/member/${memberId}`);
  } catch (error: unknown) {
    throw new Error(`Remove team member failed: ${(error as Error).message}`);
  }
}

export async function getSubordinates(
  teamId: number,
  managerId: number,
): Promise<TeamMember[]> {
  try {
    const response = await apiClient.get<TeamMember[]>(
      `/iam/teams/${teamId}/members/${managerId}/subordinates`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Get subordinates failed: ${(error as Error).message}`);
  }
}

export async function getUserManagedTeams(userId: number): Promise<Team[]> {
  try {
    const response = await apiClient.get<Team[]>(
      `/iam/teams/user/${userId}/managed`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Get user managed teams failed: ${(error as Error).message}`,
    );
  }
}

export async function getTeamLead(teamId: number): Promise<TeamMember | null> {
  try {
    const response = await apiClient.get<TeamMember>(
      `/iam/teams/${teamId}/lead`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Get team lead failed: ${(error as Error).message}`);
  }
}

export async function getManagers(teamId: number): Promise<TeamMember[]> {
  try {
    const response = await apiClient.get<TeamMember[]>(
      `/iam/teams/${teamId}/managers`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Get managers failed: ${(error as Error).message}`);
  }
}
