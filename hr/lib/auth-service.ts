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
  MonthlyStrengthResponse,
  LeaveTypeDistributionResponse,
  CheckInCheckOutResponse,
  BreakStartEndResponse,
  YearlyPayrollResponse,
  RoleWiseSalaryIncrementResponse,
  DepartmentWiseLeavesResponse,
  RoleWiseLeavesResponse
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
  compensation?: Record<string, unknown>,
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

export async function getAttendanceRecords(
  orgId: number,
  date: string,
  pageNo: number = 0,
  pageOffset: number = 10
): Promise<AttendancePageResponse> {
  try {
    const response = await apiClient.get<AttendancePageResponse>(
      `/iam/organizations/employees/attendance?orgId=${orgId}&pageNo=${pageNo}&pageOffset=${pageOffset}&date=${date}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch attendance records failed: ${(error as Error).message}`
    );
  }
}

export async function getPayrollEmployees(
  orgId: string,
  deptId?: number,
  role?: string,
  pageNo: number = 0,
  pageOffset: number = 10
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
      `Fetch payroll employees failed: ${(error as Error).message}`
    );
  }
}

export async function getEmployeeAttendance(
  employeeId: number
): Promise<EmployeeAttendanceResponse> {
  try {
    const response = await apiClient.get<EmployeeAttendanceResponse>(
      `/iam/organizations/get-employee-this-month-attendance/${employeeId}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch employee attendance failed: ${(error as Error).message}`
    );
  }
}

export async function getAttendanceQuickUpdate(
  empId: number
): Promise<AttendanceQuickUpdateResponse> {
  try {
    const response = await apiClient.get<AttendanceQuickUpdateResponse>(
      `/iam/organizations/time-management/quick-update?empId=${empId}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch attendance quick update failed: ${(error as Error).message}`
    );
  }
}

export async function toggleAttendance(
  userId: number
): Promise<ToggleAttendanceResponse> {
  try {
    const response = await apiClient.get<ToggleAttendanceResponse>(
      `/iam/organizations/employee/toggle-attendance?userId=${userId}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Toggle attendance failed: ${(error as Error).message}`);
  }
}

export async function initiatePayroll(
  request: PayrollInitiationRequest
): Promise<PayrollInitiationResponse> {
  try {
    const response = await apiClient.post<PayrollInitiationResponse>(
      `/iam/employee-payroll/initiate`,
      request
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
  pageSize: number = 10
): Promise<ProcessedPayrollsResponse> {
  try {
    // Build URL with query parameters to ensure they're properly encoded
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      month: String(month),
      year: String(year),
      pageNo: String(pageNo),
      pageSize: String(pageSize)
    }).toString();

    const response = await apiClient.get<ProcessedPayrollsResponse>(
      `/iam/organizations/get-processed-payrolls?${queryParams}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch processed payrolls failed: ${(error as Error).message}`
    );
  }
}

export async function getPayrollGraphs(
  orgId: string,
  month: number,
  year: number
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
      "DECEMBER"
    ];
    const monthName = monthNames[month - 1];

    // Build URL with query parameters to ensure they're properly encoded
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      month: monthName,
      year: String(year)
    }).toString();

    const response = await apiClient.get<PayrollGraphsResponse>(
      `/iam/organizations/get-payroll-graphs?${queryParams}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Fetch payroll graphs failed: ${(error as Error).message}`);
  }
}

export async function getPayrollInsights(
  orgId: string,
  month: number,
  year: number
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
      "DECEMBER"
    ];
    const monthName = monthNames[month - 1];

    // Build URL with query parameters to ensure they're properly encoded
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      month: monthName,
      year: String(year)
    }).toString();

    const response = await apiClient.get<PayrollInsightsResponse>(
      `/iam/organizations/get-payroll-insights?${queryParams}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch payroll insights failed: ${(error as Error).message}`
    );
  }
}

export async function getHrRequests(
  orgId: number,
  status?: string,
  requestType?: string,
  page: number = 0,
  offset: number = 10
): Promise<HrRequestsResponse> {
  try {
    // Build URL with query parameters
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      page: String(page),
      offset: String(offset)
    });

    // Add optional parameters
    if (status) {
      queryParams.append("status", status);
    }
    if (requestType) {
      queryParams.append("requestType", requestType);
    }

    const response = await apiClient.get<HrRequestsResponse>(
      `/iam/organizations/hr-requests?${queryParams.toString()}`
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
  offset: number = 10
): Promise<HrRequestsResponse> {
  try {
    // Build URL with query parameters
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      page: String(page),
      offset: String(offset)
    });

    // Add optional parameters
    if (requestType) {
      queryParams.append("requestType", requestType);
    }

    const response = await apiClient.get<HrRequestsResponse>(
      `/iam/organizations/hr-requests/closed?${queryParams.toString()}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch closed HR requests failed: ${(error as Error).message}`
    );
  }
}

export async function getHrInsights(
  orgId: number
): Promise<HrInsightsResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId)
    });

    const response = await apiClient.get<HrInsightsResponse>(
      `/iam/organizations/hr-requests/insights?${queryParams.toString()}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(`Fetch HR insights failed: ${(error as Error).message}`);
  }
}

export async function submitHrRequestAction(
  requestId: number,
  action: string,
  resolutionRemarks: string
): Promise<string> {
  try {
    const queryParams = new URLSearchParams({
      requestId: String(requestId),
      action: action,
      resolutionRemarks: resolutionRemarks
    });

    const response = await apiClient.post<string | { message: string }>(
      `/iam/organizations/hr-request/action?${queryParams.toString()}`,
      {}
    );

    // Handle both string and object responses from API
    if (typeof response.data === "string") {
      return response.data;
    }
    return response.data?.message || "Decision submitted successfully";
  } catch (error: unknown) {
    throw new Error(
      `Submit HR request action failed: ${(error as Error).message}`
    );
  }
}

// ============================================================================
// ANALYTICS API FUNCTIONS
// ============================================================================

export async function getMonthlyStrength(
  orgId: string
): Promise<MonthlyStrengthResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId)
    });

    const response = await apiClient.get<MonthlyStrengthResponse>(
      `/iam/analytics/employee/avg-strength?${queryParams.toString()}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch monthly strength failed: ${(error as Error).message}`
    );
  }
}

export async function getLeaveTypeDistribution(
  orgId: string,
  monthYear: string
): Promise<LeaveTypeDistributionResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      monthYear: monthYear
    });

    const response = await apiClient.get<LeaveTypeDistributionResponse>(
      `/iam/analytics/leave/type-distribution?${queryParams.toString()}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch leave type distribution failed: ${(error as Error).message}`
    );
  }
}

export async function getCheckInCheckOut(
  orgId: string,
  monthYear: string
): Promise<CheckInCheckOutResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      monthYear: monthYear
    });

    const response = await apiClient.get<CheckInCheckOutResponse>(
      `/iam/analytics/employee/check-in-check-out?${queryParams.toString()}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch check-in check-out failed: ${(error as Error).message}`
    );
  }
}

export async function getBreakStartEnd(
  orgId: string,
  monthYear: string
): Promise<BreakStartEndResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      monthYear: monthYear
    });

    const response = await apiClient.get<BreakStartEndResponse>(
      `/iam/analytics/employee/break-start-end?${queryParams.toString()}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch break start-end failed: ${(error as Error).message}`
    );
  }
}

export async function getDepartmentWiseLeaves(
  orgId: string,
  monthYear: string
): Promise<DepartmentWiseLeavesResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      monthYear
    });

    const response = await apiClient.get<DepartmentWiseLeavesResponse>(
      `/iam/analytics/leaves/department-wise?${queryParams.toString()}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch department wise leaves failed: ${(error as Error).message}`
    );
  }
}

export async function getRoleWiseLeaves(
  orgId: string,
  monthYear: string
): Promise<RoleWiseLeavesResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      monthYear
    });

    const response = await apiClient.get<RoleWiseLeavesResponse>(
      `/iam/analytics/leaves/role-wise?${queryParams.toString()}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch role wise leaves failed: ${(error as Error).message}`
    );
  }
}

export async function getYearlyPayrollData(
  orgId: string
): Promise<YearlyPayrollResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId)
    });

    const response = await apiClient.get<YearlyPayrollResponse>(
      `/iam/analytics/payroll/yearly?${queryParams.toString()}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch yearly payroll data failed: ${(error as Error).message}`
    );
  }
}

export async function getRoleWiseSalaryIncrement(
  orgId: string
): Promise<RoleWiseSalaryIncrementResponse> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId)
    });

    const response = await apiClient.get<RoleWiseSalaryIncrementResponse>(
      `/iam/analytics/payroll/role-wise?${queryParams.toString()}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Fetch role wise salary increment failed: ${(error as Error).message}`
    );
  }
}

// Export alias for backward compatibility
export const getEmployeeMonthlyStrength = getMonthlyStrength;
