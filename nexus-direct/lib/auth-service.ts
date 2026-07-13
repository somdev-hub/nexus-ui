
import apiClient from "@/lib/api-client";
import {
    Applicant,
    ApplicantApplicationSchema,
    ApplicantEducation,
    ApplicantExperience,
    ApplicantRecruitmentMapping,
    ApplicantSkill, ApplicationDetailsWithStatusHistory, ApplicationStatus, CompanyOpeningsCardDto,
    HasApplicantAppliedResponse,
    Recruitment,
    RecruitmentApplicantTableResponse,
    RecruitmentFilter
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

        if (!response.ok) {
            const error = await response.json();
            console.error("[AUTH SERVICE] Login error:", error);
            throw new Error(error.error || "Login failed");
        }

        const data = await response.json();
        console.log("[AUTH SERVICE] Login successful, user:", data.user?.personalEmail);

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
        console.log("[AUTH SERVICE] Starting signup for email:", data.personalEmail);

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
                        password: data.password
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

export async function getApplicant(applicantId: number): Promise<Applicant | null> {
    try {
        const response = await apiClient.get<Applicant>(`/iam/recruitment/applicant/${applicantId}`);
        if (response.status !== 200) {
            throw new Error("Failed to fetch applicant");
        }
        return response.data;
    }
    catch (error: unknown) {
        console.error("Error fetching applicant:", error);
        throw new Error("Failed to fetch applicant: " + (error as Error).message);
    }
}

export async function addApplicantEducation(education: ApplicantEducation, userId?: number) {
    try {
        const response = await apiClient.post<ApplicantEducation>(`/iam/recruitment/applicant/education?userId=${userId}`, education);
        return response;
    }
    catch (error: unknown) {
        console.error("Error adding applicant education:", error);
        throw new Error("Failed to add applicant education: " + (error as Error).message);
    }
}

export async function addApplicantExperience(experience: ApplicantExperience, userId?: number) {
    try {
        const response = await apiClient.post<ApplicantExperience>(`/iam/recruitment/applicant/experience?userId=${userId}`, experience);
        return response;
    }
    catch (error: unknown) {
        console.error("Error adding applicant experience:", error);
        throw new Error("Failed to add applicant experience: " + (error as Error).message);
    }
}

export async function addApplicantSkill(skill: ApplicantSkill, userId?: number) {
    try {
        const response = await apiClient.post<ApplicantSkill>(`/iam/recruitment/applicant/skill?userId=${userId}`, skill);
        return response;
    }
    catch (error: unknown) {
        console.error("Error adding applicant skill:", error);
        throw new Error("Failed to add applicant skill: " + (error as Error).message);
    }
}

export async function updateApplicant(applicant: Applicant, userId?: number) {
    try {
        const response = await apiClient.put<Applicant>(`/iam/recruitment/applicant?userId=${userId}`, applicant);
        return response;
    }
    catch (error: unknown) {
        console.error("Error updating applicant:", error);
        throw new Error("Failed to update applicant: " + (error as Error).message);
    }
}

export async function getOpeningsToday(pageNo: number, pageOffset: number, status: string, orgName: string, location: string, query: string): Promise<AxiosResponse<PaginatedResponse<RecruitmentApplicantTableResponse>>> {
    try {
        return await apiClient.get<PaginatedResponse<RecruitmentApplicantTableResponse>>(`/iam/recruitment/openings-today?pageNo=${pageNo}&pageOffset=${pageOffset}&status=${status}&orgName=${orgName}&location=${location}&query=${encodeURIComponent(query)}`);
    }
    catch (error: unknown) {
        console.error("Error fetching openings:", error);
        throw new Error("Failed to fetch openings: " + (error as Error).message);
    }
}

export async function getOpeningsBeforeToday(pageNo: number, pageOffset: number, status: string, orgName: string, location: string, query: string): Promise<AxiosResponse<PaginatedResponse<RecruitmentApplicantTableResponse>>> {
    try {
        return await apiClient.get<PaginatedResponse<RecruitmentApplicantTableResponse>>(`/iam/recruitment/openings-before-today?pageNo=${pageNo}&pageOffset=${pageOffset}&status=${status}&orgName=${orgName}&location=${location}&query=${encodeURIComponent(query)}`);
    }
    catch (error: unknown) {
        console.error("Error fetching openings:", error);
        throw new Error("Failed to fetch openings: " + (error as Error).message);
    }
}

export async function getPositionPieGraph() {
    try {
        return await apiClient.get(`/iam/recruitment/position-pie-graph`);
    }
    catch (e) {
        throw new Error("Failed to fetch position pie graph: " + (e as Error).message);
    }
}

export interface ExperienceWiseOpeningsMap {
    [experienceLevel: string]: number;
}

export async function getOpeningsExperienceWise(): Promise<AxiosResponse<ExperienceWiseOpeningsMap>> {
    try {
        return await apiClient.get<ExperienceWiseOpeningsMap>(`/iam/recruitment/openings-experience-wise`);
    }
    catch (e) {
        throw new Error("Failed to fetch openings experience-wise: " + (e as Error).message);
    }
}

export async function companyWiseOpeningCount(pageNo: number, pageOffset: number): Promise<AxiosResponse<PaginatedResponse<CompanyOpeningsCardDto>>> {
    try {
        return await apiClient.get<PaginatedResponse<CompanyOpeningsCardDto>>(`/iam/recruitment/company-wise-opening-count?pageNo=${pageNo}&pageOffset=${pageOffset}`);
    }
    catch (e) {
        throw new Error("Failed to fetch company-wise opening count: " + (e as Error).message);
    }
}

export async function getRecruitmentById(recruitmentId: number): Promise<AxiosResponse<Recruitment>> {
    try {
        return await apiClient.get<Recruitment>(`/iam/recruitment/applicant-view/${recruitmentId}`);
    }
    catch (e) {
        throw new Error("Failed to fetch recruitment by ID: " + (e as Error).message);
    }
}

export async function getRecruitmentFilterOptions(): Promise<AxiosResponse<RecruitmentFilter>> {
    try {
        return await apiClient.get<RecruitmentFilter>(`/iam/recruitment/filter`);
    }
    catch (e) {
        throw new Error("Failed to fetch recruitment filter options: " + (e as Error).message);
    }
}

export async function searchRecruitment(query: string, pageNo: number, pageOffset: number): Promise<AxiosResponse<PaginatedResponse<RecruitmentApplicantTableResponse>>> {
    try {
        return await apiClient.get<PaginatedResponse<RecruitmentApplicantTableResponse>>(`/iam/recruitment/search?name=${encodeURIComponent(query)}&pageNo=${pageNo}&pageOffset=${pageOffset}`);
    }
    catch (e) {
        throw new Error("Failed to search recruitment: " + (e as Error).message);
    }
}

export async function addApplicantDocument(userId: number, document: File): Promise<AxiosResponse<any>> {
    try {
        const formData = new FormData();
        formData.append("document", document);
        return await apiClient.post<AxiosResponse<any>>(`/iam/recruitment/applicant/document?userId=${userId}`, formData);
    }
    catch (e) {
        throw new Error("Failed to add applicant document: " + (e as Error).message);
    }
}

export async function deleteApplicantDocument(userId: number, documentId: number | undefined): Promise<AxiosResponse<any>> {
    try {
        if (documentId === undefined) {
            throw new Error("Invalid document ID");
        }
        return await apiClient.delete<AxiosResponse<any>>(`/iam/recruitment/applicant/document?userId=${userId}&hrDocumentId=${documentId}`);
    }
    catch (e) {
        throw new Error("Failed to delete applicant document: " + (e as Error).message);
    }
}

export async function applyForRecruitment(userId: number, recruitmentId: number, hrDocumentIds: number[]): Promise<AxiosResponse<ApplicantRecruitmentMapping>> {
    try {
        const payload = {
            recruitmentId,
            userId,
            hrDocumentIds
        };

        return await apiClient.post<ApplicantRecruitmentMapping>(`/iam/recruitment/applicant/apply`, payload);
    }
    catch (e) {
        throw new Error("Failed to apply for recruitment: " + (e as Error).message);
    }
}

export async function getApplicantApplications(userId: number, pageNo: number, pageOffset: number, status?: ApplicationStatus): Promise<AxiosResponse<PaginatedResponse<ApplicantApplicationSchema>>> {
    try {
        const statusParam = status ? `&status=${status}` : '';
        return await apiClient.get<PaginatedResponse<ApplicantApplicationSchema>>(`/iam/recruitment/applicant/applications?userId=${userId}&pageNo=${pageNo}&pageOffset=${pageOffset}${statusParam}`);
    }
    catch (e) {
        throw new Error("Failed to fetch applicant applications: " + (e as Error).message);
    }
}

export async function hasApplicantApplied(userId: number, recruitmentId: number): Promise<AxiosResponse<HasApplicantAppliedResponse>> {
    try {
        return await apiClient.get<HasApplicantAppliedResponse>(`/iam/recruitment/has-applied?userId=${userId}&recruitmentId=${recruitmentId}`);
    }
    catch (e) {
        throw new Error("Failed to check if applicant has applied: " + (e as Error).message);
    }
}

export async function getApplicationDetailsWithStatusHistory(recruitmentId: number, userId: number): Promise<AxiosResponse<ApplicationDetailsWithStatusHistory>> {
    try {
        return await apiClient.get<ApplicationDetailsWithStatusHistory>(`/iam/recruitment/applicant/application/with-status?recruitmentId=${recruitmentId}&userId=${userId}`);
    }
    catch (e) {
        throw new Error("Failed to fetch application details with status history: " + (e as Error).message);
    }
}