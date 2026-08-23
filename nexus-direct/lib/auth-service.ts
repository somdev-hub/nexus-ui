import apiClient from "@/lib/api-client";
import apiClientPublic from "@/lib/api-client-public";
import {
  Applicant,
  ApplicantApplicationSchema,
  ApplicantEducation,
  ApplicantExperience,
  ApplicantRecruitmentMapping,
  ApplicantSkill,
  ApplicationDetailsWithStatusHistory,
  ApplicationStatus,
  CompanyInsightDto,
  CompanyOpeningsCardDto,
  DashboardStatsDto,
  HasApplicantAppliedResponse,
  Recruitment,
  RecruitmentApplicantTableResponse,
  RecruitmentFilter,
  ShippingPartnerInsightDto,
} from "@/types";
import { PaginatedResponse } from "@/types/paginated-response";
import { AxiosResponse } from "axios";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    personalEmail: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

export interface ApiAuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  name: string;
  role: string;
  personalEmail: string;
}

export interface LoginRequest {
  personalEmail: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  personalEmail?: string;
  address?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gender: string;
  age: number;
  dateOfBirth: string; // ISO string
  password: string;
  profilePicture: File | string | null;
}

export interface User {
  id: string;
  personalEmail: string;
  name: string;
  role: string;
  avatar?: string;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  try {
    console.log("[AUTH SERVICE] Logging in user:", credentials.personalEmail);

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
    console.log(
      "[AUTH SERVICE] Login successful, user:",
      data.user?.personalEmail,
    );

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
    console.log(
      "[AUTH SERVICE] Starting signup for email:",
      data.personalEmail,
    );

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
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            personalEmail: data.personalEmail,
            address: data.address,
            city: data.city,
            state: data.state,
            country: data.country,
            pincode: data.pincode,
            gender: data.gender,
            age: data.age,
            dateOfBirth: data.dateOfBirth,
            password: data.password,
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
      data_response.user?.personalEmail,
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
  // if (!GlobalConfig.wowoFeatures.auth) {
  //     return "dev-token-" + Date.now();
  // }

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

export async function getApplicant(
  applicantId: number,
): Promise<Applicant | null> {
  try {
    const response = await apiClient.get<Applicant>(
      `/iam/recruitment/applicant/${applicantId}`,
    );
    if (response.status !== 200) {
      throw new Error("Failed to fetch applicant");
    }
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching applicant:", error);
    throw new Error("Failed to fetch applicant: " + (error as Error).message);
  }
}

export async function addApplicantEducation(
  education: ApplicantEducation,
  userId?: number,
) {
  try {
    const response = await apiClient.post<ApplicantEducation>(
      `/iam/recruitment/applicant/education?userId=${userId}`,
      education,
    );
    return response;
  } catch (error: unknown) {
    console.error("Error adding applicant education:", error);
    throw new Error(
      "Failed to add applicant education: " + (error as Error).message,
    );
  }
}

export async function addApplicantExperience(
  experience: ApplicantExperience,
  userId?: number,
) {
  try {
    const response = await apiClient.post<ApplicantExperience>(
      `/iam/recruitment/applicant/experience?userId=${userId}`,
      experience,
    );
    return response;
  } catch (error: unknown) {
    console.error("Error adding applicant experience:", error);
    throw new Error(
      "Failed to add applicant experience: " + (error as Error).message,
    );
  }
}

export async function addApplicantSkill(
  skill: ApplicantSkill,
  userId?: number,
) {
  try {
    const response = await apiClient.post<ApplicantSkill>(
      `/iam/recruitment/applicant/skill?userId=${userId}`,
      skill,
    );
    return response;
  } catch (error: unknown) {
    console.error("Error adding applicant skill:", error);
    throw new Error(
      "Failed to add applicant skill: " + (error as Error).message,
    );
  }
}

export async function updateApplicant(applicant: Applicant, userId?: number) {
  try {
    const response = await apiClient.put<Applicant>(
      `/iam/recruitment/applicant?userId=${userId}`,
      applicant,
    );
    return response;
  } catch (error: unknown) {
    console.error("Error updating applicant:", error);
    throw new Error("Failed to update applicant: " + (error as Error).message);
  }
}

export async function getOpeningsToday(
  pageNo: number,
  pageOffset: number,
  status: string,
  orgName: string,
  location: string,
  query: string,
): Promise<
  AxiosResponse<PaginatedResponse<RecruitmentApplicantTableResponse>>
> {
  try {
    return await apiClient.get<
      PaginatedResponse<RecruitmentApplicantTableResponse>
    >(
      `/iam/recruitment/openings-today?pageNo=${pageNo}&pageOffset=${pageOffset}&status=${status}&orgName=${orgName}&location=${location}&query=${encodeURIComponent(query)}`,
    );
  } catch (error: unknown) {
    console.error("Error fetching openings:", error);
    throw new Error("Failed to fetch openings: " + (error as Error).message);
  }
}

export async function getOpeningsBeforeToday(
  pageNo: number,
  pageOffset: number,
  status: string,
  orgName: string,
  location: string,
  query: string,
): Promise<
  AxiosResponse<PaginatedResponse<RecruitmentApplicantTableResponse>>
> {
  try {
    return await apiClient.get<
      PaginatedResponse<RecruitmentApplicantTableResponse>
    >(
      `/iam/recruitment/openings-before-today?pageNo=${pageNo}&pageOffset=${pageOffset}&status=${status}&orgName=${orgName}&location=${location}&query=${encodeURIComponent(query)}`,
    );
  } catch (error: unknown) {
    console.error("Error fetching openings:", error);
    throw new Error("Failed to fetch openings: " + (error as Error).message);
  }
}

export async function getPositionPieGraph() {
  try {
    return await apiClient.get(`/iam/recruitment/position-pie-graph`);
  } catch (e) {
    throw new Error(
      "Failed to fetch position pie graph: " + (e as Error).message,
    );
  }
}

export interface ExperienceWiseOpeningsMap {
  [experienceLevel: string]: number;
}

export async function getOpeningsExperienceWise(): Promise<
  AxiosResponse<ExperienceWiseOpeningsMap>
> {
  try {
    return await apiClient.get<ExperienceWiseOpeningsMap>(
      `/iam/recruitment/openings-experience-wise`,
    );
  } catch (e) {
    throw new Error(
      "Failed to fetch openings experience-wise: " + (e as Error).message,
    );
  }
}

export async function companyWiseOpeningCount(
  pageNo: number,
  pageOffset: number,
): Promise<AxiosResponse<PaginatedResponse<CompanyOpeningsCardDto>>> {
  try {
    return await apiClient.get<PaginatedResponse<CompanyOpeningsCardDto>>(
      `/iam/recruitment/company-wise-opening-count?pageNo=${pageNo}&pageOffset=${pageOffset}`,
    );
  } catch (e) {
    throw new Error(
      "Failed to fetch company-wise opening count: " + (e as Error).message,
    );
  }
}

export async function getRecruitmentById(
  recruitmentId: number,
): Promise<AxiosResponse<Recruitment>> {
  try {
    return await apiClient.get<Recruitment>(
      `/iam/recruitment/applicant-view/${recruitmentId}`,
    );
  } catch (e) {
    throw new Error(
      "Failed to fetch recruitment by ID: " + (e as Error).message,
    );
  }
}

export async function getRecruitmentFilterOptions(): Promise<
  AxiosResponse<RecruitmentFilter>
> {
  try {
    return await apiClient.get<RecruitmentFilter>(`/iam/recruitment/filter`);
  } catch (e) {
    throw new Error(
      "Failed to fetch recruitment filter options: " + (e as Error).message,
    );
  }
}

export async function searchRecruitment(
  query: string,
  pageNo: number,
  pageOffset: number,
): Promise<
  AxiosResponse<PaginatedResponse<RecruitmentApplicantTableResponse>>
> {
  try {
    return await apiClient.get<
      PaginatedResponse<RecruitmentApplicantTableResponse>
    >(
      `/iam/recruitment/search?name=${encodeURIComponent(query)}&pageNo=${pageNo}&pageOffset=${pageOffset}`,
    );
  } catch (e) {
    throw new Error("Failed to search recruitment: " + (e as Error).message);
  }
}

export async function addApplicantDocument(
  userId: number,
  document: File,
): Promise<AxiosResponse<any>> {
  try {
    const formData = new FormData();
    formData.append("document", document);
    return await apiClient.post<AxiosResponse<any>>(
      `/iam/recruitment/applicant/document?userId=${userId}`,
      formData,
    );
  } catch (e) {
    throw new Error(
      "Failed to add applicant document: " + (e as Error).message,
    );
  }
}

export async function deleteApplicantDocument(
  userId: number,
  documentId: number | undefined,
): Promise<AxiosResponse<any>> {
  try {
    if (documentId === undefined) {
      throw new Error("Invalid document ID");
    }
    return await apiClient.delete<AxiosResponse<any>>(
      `/iam/recruitment/applicant/document?userId=${userId}&hrDocumentId=${documentId}`,
    );
  } catch (e) {
    throw new Error(
      "Failed to delete applicant document: " + (e as Error).message,
    );
  }
}

export async function applyForRecruitment(
  userId: number,
  recruitmentId: number,
  hrDocumentIds: number[],
): Promise<AxiosResponse<ApplicantRecruitmentMapping>> {
  try {
    const payload = {
      recruitmentId,
      userId,
      hrDocumentIds,
    };

    return await apiClient.post<ApplicantRecruitmentMapping>(
      `/iam/recruitment/applicant/apply`,
      payload,
    );
  } catch (e) {
    throw new Error("Failed to apply for recruitment: " + (e as Error).message);
  }
}

export async function getApplicantApplications(
  userId: number,
  pageNo: number,
  pageOffset: number,
  status?: ApplicationStatus,
): Promise<AxiosResponse<PaginatedResponse<ApplicantApplicationSchema>>> {
  try {
    const statusParam = status ? `&status=${status}` : "";
    return await apiClient.get<PaginatedResponse<ApplicantApplicationSchema>>(
      `/iam/recruitment/applicant/applications?userId=${userId}&pageNo=${pageNo}&pageOffset=${pageOffset}${statusParam}`,
    );
  } catch (e) {
    throw new Error(
      "Failed to fetch applicant applications: " + (e as Error).message,
    );
  }
}

export async function hasApplicantApplied(
  userId: number,
  recruitmentId: number,
): Promise<AxiosResponse<HasApplicantAppliedResponse>> {
  try {
    return await apiClient.get<HasApplicantAppliedResponse>(
      `/iam/recruitment/has-applied?userId=${userId}&recruitmentId=${recruitmentId}`,
    );
  } catch (e) {
    throw new Error(
      "Failed to check if applicant has applied: " + (e as Error).message,
    );
  }
}

export async function getApplicationDetailsWithStatusHistory(
  recruitmentId: number,
  userId: number,
): Promise<AxiosResponse<ApplicationDetailsWithStatusHistory>> {
  try {
    return await apiClient.get<ApplicationDetailsWithStatusHistory>(
      `/iam/recruitment/applicant/application/with-status?recruitmentId=${recruitmentId}&userId=${userId}`,
    );
  } catch (e) {
    throw new Error(
      "Failed to fetch application details with status history: " +
        (e as Error).message,
    );
  }
}

// New dashboard API functions
export async function getCompanyInsights(): Promise<
  AxiosResponse<CompanyInsightDto[]>
> {
  try {
    return await apiClient.get<CompanyInsightDto[]>(
      `/iam/recruitment/company-insights`,
    );
  } catch (e) {
    throw new Error(
      "Failed to fetch company insights: " + (e as Error).message,
    );
  }
}

export async function getDashboardStats(): Promise<
  AxiosResponse<DashboardStatsDto[]>
> {
  try {
    return await apiClient.get<DashboardStatsDto[]>(
      `/iam/recruitment/dashboard-stats`,
    );
  } catch (e) {
    throw new Error("Failed to fetch dashboard stats: " + (e as Error).message);
  }
}

// ============================================
// NexusBuddy Chat APIs (via IAM proxy)
// ============================================

export interface NexusBuddyChatRequest {
  message: string;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  clientIds?: number[];
  conversationId?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
}

export interface NexusBuddyChatResponse {
  message: string;
  conversationId: string;
  timestamp: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
  }>;
}

export async function nexusBuddyChat(
  request: NexusBuddyChatRequest,
): Promise<NexusBuddyChatResponse> {
  try {
    const response = await apiClient.post<NexusBuddyChatResponse>(
      `/nexusbuddy/api/chat`,
      request,
    );
    return response.data;
  } catch (error: unknown) {
    console.error("NexusBuddy chat error:", error);
    throw new Error("NexusBuddy chat failed: " + (error as Error).message);
  }
}

export async function nexusBuddyChatWithConversation(
  request: NexusBuddyChatRequest,
): Promise<NexusBuddyChatResponse> {
  try {
    const response = await apiClient.post<NexusBuddyChatResponse>(
      `/nexusbuddy/api/chat/conversation`,
      request,
    );
    return response.data;
  } catch (error: unknown) {
    console.error("NexusBuddy chat with conversation error:", error);
    throw new Error(
      "NexusBuddy chat with conversation failed: " + (error as Error).message,
    );
  }
}

export async function nexusBuddyDirectChat(
  prompt: string,
): Promise<NexusBuddyChatResponse> {
  try {
    const response = await apiClient.post<NexusBuddyChatResponse>(
      `/nexusbuddy/api/chat/direct`,
      prompt,
      { headers: { "Content-Type": "text/plain" } },
    );
    return response.data;
  } catch (error: unknown) {
    console.error("NexusBuddy direct chat error:", error);
    throw new Error(
      "NexusBuddy direct chat failed: " + (error as Error).message,
    );
  }
}

export async function nexusBuddyHealthCheck(): Promise<{ status: string }> {
  try {
    const response = await apiClient.get<{ status: string }>(
      `/nexusbuddy/api/chat/health`,
    );
    return response.data;
  } catch (error: unknown) {
    console.error("NexusBuddy health check error:", error);
    throw new Error(
      "NexusBuddy health check failed: " + (error as Error).message,
    );
  }
}

// Streaming chat - uses fetch directly to handle SSE
export async function* nexusBuddyStreamChat(
  request: NexusBuddyChatRequest,
): AsyncGenerator<string> {
  try {
    const response = await fetch(
      "/api/proxy?path=/nexusbuddy/api/chat/stream",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Stream failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value);
      }
    }
  } catch (error: unknown) {
    console.error("NexusBuddy stream chat error:", error);
    throw new Error(
      "NexusBuddy stream chat failed: " + (error as Error).message,
    );
  }
}

// ============================================
// NexusBuddy Domain-based Chat APIs (via IAM proxy)
// ============================================

export async function nexusBuddyChatByDomain(
  request: NexusBuddyChatRequest,
  domain: string,
): Promise<NexusBuddyChatResponse> {
  try {
    const response = await fetch(
      `/api/proxy?path=/nexusbuddy/api/chat/by-domain&domain=${encodeURIComponent(domain)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        credentials: "include",
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Chat failed: ${response.status}`);
    }

    return response.json();
  } catch (error: unknown) {
    console.error("NexusBuddy chat by domain error:", error);
    throw new Error(
      "NexusBuddy chat by domain failed: " + (error as Error).message,
    );
  }
}

export async function* nexusBuddyStreamChatByDomain(
  request: NexusBuddyChatRequest,
  domain: string,
): AsyncGenerator<string> {
  try {
    const response = await fetch(
      `/api/proxy?path=/nexusbuddy/api/chat/stream/by-domain&domain=${encodeURIComponent(domain)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Stream failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value);
      }
    }
  } catch (error: unknown) {
    console.error("NexusBuddy stream chat by domain error:", error);
    throw new Error(
      "NexusBuddy stream chat by domain failed: " + (error as Error).message,
    );
  }
}

// ============================================
// NexusBuddy Test Streaming API (for debugging)
// ============================================

export async function* nexusBuddyStreamTestLogs(
  request: NexusBuddyChatRequest,
): AsyncGenerator<string> {
  try {
    const response = await fetch(
      "/api/proxy?path=/nexusbuddy/api/chat/stream/test",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Stream failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value);
      }
    }
  } catch (error: unknown) {
    console.error("NexusBuddy stream test logs error:", error);
    throw new Error(
      "NexusBuddy stream test logs failed: " + (error as Error).message,
    );
  }
}

// ============================================
// Recruitment Mapping APIs (via IAM proxy)
// ============================================

export interface ApplicantStatusUpdateRequest {
  status: ApplicationStatus;
  interviewType?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewDuration?: string;
  interviewMode?: string;
  interviewLocation?: string;
  interviewUrl?: string;
  interviewerName?: string;
  interviewConfirmationLink?: string;
  interviewConfirmationDeadline?: string;
  interviewerRemarks?: string;
  interviewerId?: number;
}

export async function getApplicantByRecruitmentMapping(
  applicantId: number,
  recruitmentId: number,
): Promise<AxiosResponse<Applicant>> {
  try {
    return await apiClient.get<Applicant>(
      `/iam/recruitment/applicant/recruitment-mapping?applicantId=${applicantId}&recruitmentId=${recruitmentId}`,
    );
  } catch (e) {
    throw new Error(
      "Failed to fetch applicant by recruitment mapping: " +
        (e as Error).message,
    );
  }
}

export async function updateApplicantRecruitmentStatus(
  applicantId: number,
  recruitmentId: number,
  request: ApplicantStatusUpdateRequest,
): Promise<AxiosResponse<any>> {
  try {
    return await apiClient.put<any>(
      `/iam/recruitment/applicant/recruitment-mapping/status?applicantId=${applicantId}&recruitmentId=${recruitmentId}`,
      request,
    );
  } catch (e) {
    throw new Error(
      "Failed to update applicant recruitment status: " + (e as Error).message,
    );
  }
}

export interface ScheduledInterview {
  recruitmentInterviewId: number;
  applicantRecruitmentMappingId: number;
  applicantId: number;
  applicantName: string;
  applicantEmail: string;
  recruitmentId: number;
  recruitmentTitle: string;
  roleName: string;
  departmentName: string;
  interviewType: string;
  interviewDate: string;
  interviewTime: string;
  interviewDuration: string;
  interviewMode: string;
  interviewLocation: string;
  interviewUrl: string;
  interviewerName: string;
  interviewerEmail: string;
  interviewStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedInterviewsResponse {
  content: ScheduledInterview[];
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

export async function getAllScheduledInterviews(
  orgId: number,
  options?: {
    pageNo?: number;
    pageOffset?: number;
    interviewType?: string;
    interviewMode?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<AxiosResponse<PaginatedInterviewsResponse>> {
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
    if (options?.interviewType) {
      queryParams.append("interviewType", options.interviewType);
    }
    if (options?.interviewMode) {
      queryParams.append("interviewMode", options.interviewMode);
    }
    if (options?.startDate) {
      queryParams.append("startDate", options.startDate);
    }
    if (options?.endDate) {
      queryParams.append("endDate", options.endDate);
    }

    return await apiClient.get<PaginatedInterviewsResponse>(
      `/iam/recruitment/interviews/scheduled?${queryParams.toString()}`,
    );
  } catch (e) {
    throw new Error(
      "Failed to fetch all scheduled interviews: " + (e as Error).message,
    );
  }
}

export async function getMyInterviews(
  orgId: number,
  interviewerEmail: string,
  options?: {
    pageNo?: number;
    pageOffset?: number;
    interviewType?: string;
    interviewMode?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<AxiosResponse<PaginatedInterviewsResponse>> {
  try {
    const queryParams = new URLSearchParams({
      orgId: String(orgId),
      interviewerEmail: interviewerEmail,
    });

    if (typeof options?.pageNo === "number") {
      queryParams.append("pageNo", String(options.pageNo));
    }
    if (typeof options?.pageOffset === "number") {
      queryParams.append("pageOffset", String(options.pageOffset));
    }
    if (options?.interviewType) {
      queryParams.append("interviewType", options.interviewType);
    }
    if (options?.interviewMode) {
      queryParams.append("interviewMode", options.interviewMode);
    }
    if (options?.startDate) {
      queryParams.append("startDate", options.startDate);
    }
    if (options?.endDate) {
      queryParams.append("endDate", options.endDate);
    }

    return await apiClient.get<PaginatedInterviewsResponse>(
      `/iam/recruitment/interviews/my-interviews?${queryParams.toString()}`,
    );
  } catch (e) {
    throw new Error("Failed to fetch my interviews: " + (e as Error).message);
  }
}

// ============================================
// PUBLIC RECRUITMENT API FUNCTIONS (no auth required)
// Uses dedicated public endpoints: /iam/public/recruitment/**
// ============================================

export async function getPublicRecruitmentById(
  recruitmentId: number,
): Promise<AxiosResponse<Recruitment>> {
  try {
    return await apiClientPublic.get<Recruitment>(
      `/iam/public/recruitment/applicant-view/${recruitmentId}`,
    );
  } catch (e) {
    throw new Error(
      "Failed to fetch public recruitment by ID: " + (e as Error).message,
    );
  }
}

export async function getPublicRecruitmentFilterOptions(): Promise<
  AxiosResponse<RecruitmentFilter>
> {
  try {
    return await apiClientPublic.get<RecruitmentFilter>(`/iam/public/recruitment/filter`);
  } catch (e) {
    throw new Error(
      "Failed to fetch public recruitment filter options: " + (e as Error).message,
    );
  }
}

export async function getPublicOpeningsToday(
  pageNo: number,
  pageOffset: number,
  status: string,
  orgName: string,
  location: string,
  query: string,
): Promise<
  AxiosResponse<PaginatedResponse<RecruitmentApplicantTableResponse>>
> {
  try {
    return await apiClientPublic.get<
      PaginatedResponse<RecruitmentApplicantTableResponse>
    >(
      `/iam/public/recruitment/openings-today?pageNo=${pageNo}&pageOffset=${pageOffset}&status=${status}&orgName=${orgName}&location=${location}&query=${encodeURIComponent(query)}`,
    );
  } catch (error: unknown) {
    console.error("Error fetching public openings:", error);
    throw new Error("Failed to fetch public openings: " + (error as Error).message);
  }
}

export async function getPublicOpeningsBeforeToday(
  pageNo: number,
  pageOffset: number,
  status: string,
  orgName: string,
  location: string,
  query: string,
): Promise<
  AxiosResponse<PaginatedResponse<RecruitmentApplicantTableResponse>>
> {
  try {
    return await apiClientPublic.get<
      PaginatedResponse<RecruitmentApplicantTableResponse>
    >(
      `/iam/public/recruitment/openings-before-today?pageNo=${pageNo}&pageOffset=${pageOffset}&status=${status}&orgName=${orgName}&location=${location}&query=${encodeURIComponent(query)}`,
    );
  } catch (error: unknown) {
    console.error("Error fetching public openings:", error);
    throw new Error("Failed to fetch public openings: " + (error as Error).message);
  }
}

export async function getPublicPositionPieGraph() {
  try {
    return await apiClientPublic.get(`/iam/public/recruitment/position-pie-graph`);
  } catch (e) {
    throw new Error(
      "Failed to fetch public position pie graph: " + (e as Error).message,
    );
  }
}

export async function getPublicOpeningsExperienceWise(): Promise<
  AxiosResponse<ExperienceWiseOpeningsMap>
> {
  try {
    return await apiClientPublic.get<ExperienceWiseOpeningsMap>(
      `/iam/public/recruitment/openings-experience-wise`,
    );
  } catch (e) {
    throw new Error(
      "Failed to fetch public openings experience-wise: " + (e as Error).message,
    );
  }
}

export async function getPublicCompanyWiseOpeningCount(
  pageNo: number,
  pageOffset: number,
): Promise<AxiosResponse<PaginatedResponse<CompanyOpeningsCardDto>>> {
  try {
    return await apiClientPublic.get<PaginatedResponse<CompanyOpeningsCardDto>>(
      `/iam/public/recruitment/company-wise-opening-count?pageNo=${pageNo}&pageOffset=${pageOffset}`,
    );
  } catch (e) {
    throw new Error(
      "Failed to fetch public company-wise opening count: " + (e as Error).message,
    );
  }
}

export async function getPublicRecruitmentSearch(
  query: string,
  pageNo: number,
  pageOffset: number,
): Promise<
  AxiosResponse<PaginatedResponse<RecruitmentApplicantTableResponse>>
> {
  try {
    return await apiClientPublic.get<
      PaginatedResponse<RecruitmentApplicantTableResponse>
    >(
      `/iam/public/recruitment/search?name=${encodeURIComponent(query)}&pageNo=${pageNo}&pageOffset=${pageOffset}`,
    );
  } catch (e) {
    throw new Error("Failed to search public recruitment: " + (e as Error).message);
  }
}

// ============================================
// BOOKMARK API FUNCTIONS (requires userId)
// ============================================

export interface BookmarkRecruitmentResponse {
  message: string;
  bookmarked: boolean;
}

export interface HasBookmarkedResponse {
  hasBookmarked: boolean;
}

export interface BookmarkCountResponse {
  bookmarkCount: number;
}

export interface BookmarkedRecruitment {
  recruitmentId: number;
  title: string;
  shortDescription: string;
  orgName: string;
  location: string;
  hiringType: string;
  hiringStatus: string;
  totalCompensation: string;
  openingTillDate: string;
  bookmarkedAt: string;
}

export interface PaginatedBookmarkedRecruitmentsResponse {
  content: BookmarkedRecruitment[];
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

export async function getBookmarkCount(
  recruitmentId: number,
  userId: number,
): Promise<AxiosResponse<BookmarkCountResponse>> {
  try {
    return await apiClientPublic.get<BookmarkCountResponse>(
      `/iam/recruitment/bookmark/count?recruitmentId=${recruitmentId}&userId=${userId}`,
    );
  } catch (e) {
    throw new Error("Failed to fetch bookmark count: " + (e as Error).message);
  }
}

export async function bookmarkRecruitmentAuth(
  recruitmentId: number,
  userId: number,
): Promise<AxiosResponse<BookmarkRecruitmentResponse>> {
  try {
    return await apiClient.post<BookmarkRecruitmentResponse>(
      `/iam/recruitment/bookmark?recruitmentId=${recruitmentId}&userId=${userId}`,
      {},
    );
  } catch (e) {
    throw new Error("Failed to bookmark recruitment: " + (e as Error).message);
  }
}

export async function unbookmarkRecruitmentAuth(
  recruitmentId: number,
  userId: number,
): Promise<AxiosResponse<BookmarkRecruitmentResponse>> {
  try {
    return await apiClient.delete<BookmarkRecruitmentResponse>(
      `/iam/recruitment/bookmark?recruitmentId=${recruitmentId}&userId=${userId}`,
    );
  } catch (e) {
    throw new Error("Failed to unbookmark recruitment: " + (e as Error).message);
  }
}

export async function hasBookmarkedRecruitmentAuth(
  recruitmentId: number,
  userId: number,
): Promise<AxiosResponse<HasBookmarkedResponse>> {
  try {
    return await apiClient.get<HasBookmarkedResponse>(
      `/iam/recruitment/bookmark/status?recruitmentId=${recruitmentId}&userId=${userId}`,
    );
  } catch (e) {
    throw new Error("Failed to check bookmark status: " + (e as Error).message);
  }
}

export async function getBookmarkCountAuth(
  recruitmentId: number,
  userId: number,
): Promise<AxiosResponse<BookmarkCountResponse>> {
  try {
    return await apiClient.get<BookmarkCountResponse>(
      `/iam/recruitment/bookmark/count?recruitmentId=${recruitmentId}&userId=${userId}`,
    );
  } catch (e) {
    throw new Error("Failed to fetch bookmark count: " + (e as Error).message);
  }
}

export async function getBookmarkedRecruitmentsAuth(
  pageNo: number = 0,
  pageOffset: number = 10,
  userId: number,
): Promise<AxiosResponse<PaginatedBookmarkedRecruitmentsResponse>> {
  try {
    return await apiClient.get<PaginatedBookmarkedRecruitmentsResponse>(
      `/iam/recruitment/bookmarks?pageNo=${pageNo}&pageOffset=${pageOffset}&userId=${userId}`,
    );
  } catch (e) {
    throw new Error("Failed to fetch bookmarked recruitments: " + (e as Error).message);
  }
}
