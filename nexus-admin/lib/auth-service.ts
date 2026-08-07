import apiClient from "./api-client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gender: string;
  age: number;
  dateOfBirth: string;
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
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    orgId?: string;
    avatar?: string;
  };
}

export interface ApiAuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  orgId: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  orgId?: string;
  avatar?: string;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  try {
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
  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Signup failed");
    }

    const dataResponse = await response.json();

    localStorage.setItem("auth_user", JSON.stringify(dataResponse.user));

    return {
      accessToken: "",
      refreshToken: "",
      tokenType: "Bearer",
      expiresIn: dataResponse.expiresIn || 3600,
      user: dataResponse.user,
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
      credentials: "include", // Include cookies
    });
  } catch (error: unknown) {
    console.error("Logout error:", error);
  }
  // Clear frontend state
  localStorage.removeItem("auth_user");
}

export async function refreshToken(): Promise<string> {
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

// ============================================================================
// NEXUS BUDDY API FUNCTIONS
// ============================================================================

import type { AxiosResponse } from "axios";
import type {
    NexusBuddyClientConfig,
    NexusBuddyClientConfigRequest,
    NexusBuddyClientConfigResponse,
    NexusBuddyToolsConfig,
    NexusBuddyToolsConfigRequest,
    NexusBuddyToolsConfigResponse,
    NexusBuddyToolsParamConfig,
    NexusBuddyToolsParamConfigRequest,
    NexusBuddyToolsParamConfigResponse,
} from "@/types/nexus-buddy";

// Client Config APIs
export async function getNexusBuddyClientConfigs(page = 0, size = 20, sortBy = "clientConfigId", sortDir = "asc"): Promise<NexusBuddyClientConfigResponse> {
   try {
       const response = await apiClient.get<NexusBuddyClientConfigResponse>(
           `/nexusbuddy/admin/client-configs?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch NexusBuddy client configs failed: ${(error as Error).message}`);
   }
}

export async function getNexusBuddyClientConfigById(clientConfigId: number): Promise<NexusBuddyClientConfig> {
   try {
       const response = await apiClient.get<NexusBuddyClientConfig>(
           `/nexusbuddy/admin/client-configs/${clientConfigId}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch NexusBuddy client config failed: ${(error as Error).message}`);
   }
}

export async function getNexusBuddyActiveClientConfigs(page = 0, size = 20, sortBy = "clientConfigId", sortDir = "asc"): Promise<NexusBuddyClientConfigResponse> {
   try {
       const response = await apiClient.get<NexusBuddyClientConfigResponse>(
           `/nexusbuddy/admin/client-configs/active?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch active NexusBuddy client configs failed: ${(error as Error).message}`);
   }
}

export async function createNexusBuddyClientConfig(payload: NexusBuddyClientConfigRequest): Promise<NexusBuddyClientConfig> {
   try {
       const response = await apiClient.post<NexusBuddyClientConfig>(
           `/nexusbuddy/admin/client-configs`,
           payload
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Create NexusBuddy client config failed: ${(error as Error).message}`);
   }
}

export async function updateNexusBuddyClientConfig(clientConfigId: number, payload: NexusBuddyClientConfigRequest): Promise<NexusBuddyClientConfig> {
   try {
       const response = await apiClient.put<NexusBuddyClientConfig>(
           `/nexusbuddy/admin/client-configs/${clientConfigId}`,
           payload
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Update NexusBuddy client config failed: ${(error as Error).message}`);
   }
}

export async function deactivateNexusBuddyClientConfig(clientConfigId: number): Promise<string> {
   try {
       const response = await apiClient.delete<string | { message: string }>(
           `/nexusbuddy/admin/client-configs/${clientConfigId}`
       );
       if (typeof response.data === "string") {
           return response.data;
       }
       return response.data?.message || "Client config deactivated successfully";
   } catch (error: unknown) {
       throw new Error(`Deactivate NexusBuddy client config failed: ${(error as Error).message}`);
   }
}

// Tools Config APIs
export async function getNexusBuddyToolsConfigs(page = 0, size = 20, sortBy = "toolsConfigId", sortDir = "asc"): Promise<NexusBuddyToolsConfigResponse> {
   try {
       const response = await apiClient.get<NexusBuddyToolsConfigResponse>(
           `/nexusbuddy/admin/tools-configs?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch NexusBuddy tools configs failed: ${(error as Error).message}`);
   }
}

export async function getNexusBuddyToolsConfigById(toolsConfigId: number): Promise<NexusBuddyToolsConfig> {
   try {
       const response = await apiClient.get<NexusBuddyToolsConfig>(
           `/nexusbuddy/admin/tools-configs/${toolsConfigId}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch NexusBuddy tools config failed: ${(error as Error).message}`);
   }
}

export async function getNexusBuddyActiveToolsConfigs(page = 0, size = 20, sortBy = "toolsConfigId", sortDir = "asc"): Promise<NexusBuddyToolsConfigResponse> {
   try {
       const response = await apiClient.get<NexusBuddyToolsConfigResponse>(
           `/nexusbuddy/admin/tools-configs/active?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch active NexusBuddy tools configs failed: ${(error as Error).message}`);
   }
}

export async function getNexusBuddyToolsConfigsByClientConfigId(clientConfigId: number, page = 0, size = 20, sortBy = "toolsConfigId", sortDir = "asc"): Promise<NexusBuddyToolsConfigResponse> {
   try {
       const response = await apiClient.get<NexusBuddyToolsConfigResponse>(
           `/nexusbuddy/admin/tools-configs/client/${clientConfigId}?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch NexusBuddy tools configs by client failed: ${(error as Error).message}`);
   }
}

export async function createNexusBuddyToolsConfig(payload: NexusBuddyToolsConfigRequest): Promise<NexusBuddyToolsConfig> {
   try {
       const response = await apiClient.post<NexusBuddyToolsConfig>(
           `/nexusbuddy/admin/tools-configs`,
           payload
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Create NexusBuddy tools config failed: ${(error as Error).message}`);
   }
}

export async function updateNexusBuddyToolsConfig(toolsConfigId: number, payload: NexusBuddyToolsConfigRequest): Promise<NexusBuddyToolsConfig> {
   try {
       const response = await apiClient.put<NexusBuddyToolsConfig>(
           `/nexusbuddy/admin/tools-configs/${toolsConfigId}`,
           payload
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Update NexusBuddy tools config failed: ${(error as Error).message}`);
   }
}

export async function deactivateNexusBuddyToolsConfig(toolsConfigId: number): Promise<string> {
   try {
       const response = await apiClient.delete<string | { message: string }>(
           `/nexusbuddy/admin/tools-configs/${toolsConfigId}`
       );
       if (typeof response.data === "string") {
           return response.data;
       }
       return response.data?.message || "Tools config deactivated successfully";
   } catch (error: unknown) {
       throw new Error(`Deactivate NexusBuddy tools config failed: ${(error as Error).message}`);
   }
}

// Tools Param Config APIs
export async function getNexusBuddyToolsParamConfigs(page = 0, size = 20, sortBy = "toolsParamConfigId", sortDir = "asc"): Promise<NexusBuddyToolsParamConfigResponse> {
   try {
       const response = await apiClient.get<NexusBuddyToolsParamConfigResponse>(
           `/nexusbuddy/admin/tools-param-configs?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch NexusBuddy tools param configs failed: ${(error as Error).message}`);
   }
}

export async function getNexusBuddyToolsParamConfigById(toolsParamConfigId: number): Promise<NexusBuddyToolsParamConfig> {
   try {
       const response = await apiClient.get<NexusBuddyToolsParamConfig>(
           `/nexusbuddy/admin/tools-param-configs/${toolsParamConfigId}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch NexusBuddy tools param config failed: ${(error as Error).message}`);
   }
}

export async function getNexusBuddyActiveToolsParamConfigs(page = 0, size = 20, sortBy = "toolsParamConfigId", sortDir = "asc"): Promise<NexusBuddyToolsParamConfigResponse> {
   try {
       const response = await apiClient.get<NexusBuddyToolsParamConfigResponse>(
           `/nexusbuddy/admin/tools-param-configs/active?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch active NexusBuddy tools param configs failed: ${(error as Error).message}`);
   }
}

export async function getNexusBuddyToolsParamConfigsByToolsConfigId(toolsConfigId: number, page = 0, size = 20, sortBy = "toolsParamConfigId", sortDir = "asc"): Promise<NexusBuddyToolsParamConfigResponse> {
   try {
       const response = await apiClient.get<NexusBuddyToolsParamConfigResponse>(
           `/nexusbuddy/admin/tools-param-configs/tool/${toolsConfigId}?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch NexusBuddy tools param configs by tool failed: ${(error as Error).message}`);
   }
}

export async function createNexusBuddyToolsParamConfig(payload: NexusBuddyToolsParamConfigRequest): Promise<NexusBuddyToolsParamConfig> {
   try {
       const response = await apiClient.post<NexusBuddyToolsParamConfig>(
           `/nexusbuddy/admin/tools-param-configs`,
           payload
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Create NexusBuddy tools param config failed: ${(error as Error).message}`);
   }
}

export async function updateNexusBuddyToolsParamConfig(toolsParamConfigId: number, payload: NexusBuddyToolsParamConfigRequest): Promise<NexusBuddyToolsParamConfig> {
   try {
       const response = await apiClient.put<NexusBuddyToolsParamConfig>(
           `/nexusbuddy/admin/tools-param-configs/${toolsParamConfigId}`,
           payload
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Update NexusBuddy tools param config failed: ${(error as Error).message}`);
   }
}

export async function deactivateNexusBuddyToolsParamConfig(toolsParamConfigId: number): Promise<string> {
   try {
       const response = await apiClient.delete<string | { message: string }>(
           `/nexusbuddy/admin/tools-param-configs/${toolsParamConfigId}`
       );
       if (typeof response.data === "string") {
           return response.data;
       }
       return response.data?.message || "Tools param config deactivated successfully";
   } catch (error: unknown) {
       throw new Error(`Deactivate NexusBuddy tools param config failed: ${(error as Error).message}`);
   }
}

// ============================================================================
// NEXUS BUDDY DASHBOARD API FUNCTIONS
// ============================================================================

import type {
    DashboardSummaryResponse,
    ClientHealthResponse,
    RequestTrendsResponse,
    ToolUsageResponse,
    PerformanceResponse,
    ConfigInsightsResponse,
    DashboardQueryParams,
} from "@/types/nexus-buddy-dashboard";

export async function getNexusBuddyDashboardSummary(params: DashboardQueryParams = {}): Promise<DashboardSummaryResponse> {
   try {
       const searchParams = new URLSearchParams();
       if (params.range) searchParams.set("range", params.range);
       if (params.start) searchParams.set("start", params.start);
       if (params.end) searchParams.set("end", params.end);
       if (params.clientIds && params.clientIds.length > 0) {
           params.clientIds.forEach(id => searchParams.append("clientIds", id.toString()));
       }
       
       const response = await apiClient.get<DashboardSummaryResponse>(
           `/nexusbuddy/admin/dashboard/summary?${searchParams.toString()}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch NexusBuddy dashboard summary failed: ${(error as Error).message}`);
   }
}

export async function getNexusBuddyClientHealth(params: DashboardQueryParams = {}): Promise<ClientHealthResponse[]> {
   try {
       const searchParams = new URLSearchParams();
       if (params.range) searchParams.set("range", params.range);
       if (params.start) searchParams.set("start", params.start);
       if (params.end) searchParams.set("end", params.end);
       if (params.clientIds && params.clientIds.length > 0) {
           params.clientIds.forEach(id => searchParams.append("clientIds", id.toString()));
       }
       
       const response = await apiClient.get<ClientHealthResponse[]>(
           `/nexusbuddy/admin/dashboard/client-health?${searchParams.toString()}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch NexusBuddy client health failed: ${(error as Error).message}`);
   }
}

export async function getNexusBuddyRequestTrends(params: DashboardQueryParams = {}): Promise<RequestTrendsResponse> {
   try {
       const searchParams = new URLSearchParams();
       if (params.range) searchParams.set("range", params.range);
       if (params.start) searchParams.set("start", params.start);
       if (params.end) searchParams.set("end", params.end);
       if (params.clientIds && params.clientIds.length > 0) {
           params.clientIds.forEach(id => searchParams.append("clientIds", id.toString()));
       }
       
       const response = await apiClient.get<RequestTrendsResponse>(
           `/nexusbuddy/admin/dashboard/requests/trends?${searchParams.toString()}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch NexusBuddy request trends failed: ${(error as Error).message}`);
   }
}

export async function getNexusBuddyToolUsage(params: DashboardQueryParams = {}): Promise<ToolUsageResponse> {
   try {
       const searchParams = new URLSearchParams();
       if (params.range) searchParams.set("range", params.range);
       if (params.start) searchParams.set("start", params.start);
       if (params.end) searchParams.set("end", params.end);
       if (params.clientIds && params.clientIds.length > 0) {
           params.clientIds.forEach(id => searchParams.append("clientIds", id.toString()));
       }
       
       const response = await apiClient.get<ToolUsageResponse>(
           `/nexusbuddy/admin/dashboard/tools/usage?${searchParams.toString()}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch NexusBuddy tool usage failed: ${(error as Error).message}`);
   }
}

export async function getNexusBuddyPerformance(params: DashboardQueryParams = {}): Promise<PerformanceResponse> {
   try {
       const searchParams = new URLSearchParams();
       if (params.range) searchParams.set("range", params.range);
       if (params.start) searchParams.set("start", params.start);
       if (params.end) searchParams.set("end", params.end);
       if (params.clientIds && params.clientIds.length > 0) {
           params.clientIds.forEach(id => searchParams.append("clientIds", id.toString()));
       }
       
       const response = await apiClient.get<PerformanceResponse>(
           `/nexusbuddy/admin/dashboard/performance?${searchParams.toString()}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch NexusBuddy performance failed: ${(error as Error).message}`);
   }
}

export async function getNexusBuddyConfigInsights(): Promise<ConfigInsightsResponse> {
   try {
       const response = await apiClient.get<ConfigInsightsResponse>(
           `/nexusbuddy/admin/dashboard/config-insights`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch NexusBuddy config insights failed: ${(error as Error).message}`);
   }
}

// ============================================================================
// CLIENT INSIGHTS API FUNCTIONS
// ============================================================================

import type {
    ClientInsightsSummary,
    ResponseTimeDataPoint,
    HourlyHitsDataPoint,
    FailureGraphDataPoint,
    ToolInsightsData,
    LogEntry,
    ClientInsightsFilters,
    SpringPageResponse,
    PaginatedResponse,
    ClientInsightsResponse,
} from "@/types/client-insights";

export async function getClientInsights(clientId: number, params: { start?: string; end?: string; range?: string } = {}): Promise<ClientInsightsResponse> {
   try {
       const searchParams = new URLSearchParams();
       if (params.range) searchParams.set("range", params.range);
       if (params.start) searchParams.set("start", params.start);
       if (params.end) searchParams.set("end", params.end);
       
       const response = await apiClient.get<ClientInsightsResponse>(
           `/nexusbuddy/admin/client-insights/${clientId}?${searchParams.toString()}`
       );
       return response.data;
   } catch (error: unknown) {
       throw new Error(`Fetch client insights failed: ${(error as Error).message}`);
   }
}

export async function getClientToolInsights(clientId: number, params: { start?: string; end?: string; range?: string; page?: number; pageSize?: number } = {}): Promise<PaginatedResponse<ToolInsightsData>> {
   try {
       const searchParams = new URLSearchParams();
       if (params.range) searchParams.set("range", params.range);
       if (params.start) searchParams.set("start", params.start);
       if (params.end) searchParams.set("end", params.end);
       // Backend uses 0-based pageNo and pageOffset
       if (params.page !== undefined) searchParams.set("pageNo", params.page.toString());
       if (params.pageSize) searchParams.set("pageOffset", params.pageSize.toString());
       
       const response = await apiClient.get<SpringPageResponse<ToolInsightsData>>(
           `/nexusbuddy/admin/client-insights/${clientId}/tools?${searchParams.toString()}`
       );
       // Transform Spring Page to frontend PaginatedResponse
       const springPage = response.data;
       return {
           data: springPage.content,
           total: springPage.totalElements,
           page: springPage.number + 1, // Convert 0-based to 1-based for UI
           pageSize: springPage.size,
           totalPages: springPage.totalPages
       };
   } catch (error: unknown) {
       throw new Error(`Fetch client tool insights failed: ${(error as Error).message}`);
   }
}

export async function getClientLogs(clientId: number, filters: ClientInsightsFilters): Promise<PaginatedResponse<LogEntry>> {
   try {
       const searchParams = new URLSearchParams();
       if (filters.toolName) searchParams.set("toolName", filters.toolName);
       if (filters.success !== undefined) searchParams.set("status", filters.success ? "success" : "failure");
       if (filters.statusCode) searchParams.set("statusCode", filters.statusCode.toString());
       if (filters.httpMethod) searchParams.set("httpMethod", filters.httpMethod);
       if (filters.fromDate) searchParams.set("startDate", filters.fromDate);
       if (filters.toDate) searchParams.set("endDate", filters.toDate);
       // Backend uses 0-based pageNo and pageOffset
       searchParams.set("pageNo", filters.page.toString());
       searchParams.set("pageOffset", filters.pageSize.toString());
       
       const response = await apiClient.get<SpringPageResponse<LogEntry>>(
           `/nexusbuddy/admin/client-insights/${clientId}/logs?${searchParams.toString()}`
       );
       // Transform Spring Page to frontend PaginatedResponse
       const springPage = response.data;
       return {
           data: springPage.content,
           total: springPage.totalElements,
           page: springPage.number + 1, // Convert 0-based to 1-based for UI
           pageSize: springPage.size,
           totalPages: springPage.totalPages
       };
   } catch (error: unknown) {
       throw new Error(`Fetch client logs failed: ${(error as Error).message}`);
   }
}
