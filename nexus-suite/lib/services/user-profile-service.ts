// ============================================================================
// USER PROFILE SERVICE - Profile Management for Nexus-Suite
// ============================================================================

import apiClient from '@/lib/api-client';
import type { User } from '@/lib/auth-service';

export interface AttendanceRecord {
    date: string;
    status: string;
    checkInTime?: string;
    checkOutTime?: string;
    hoursWorked?: number;
    breakHours?: number;
    overtimeHours?: number;
}

export interface LeaveRecord {
    leaveType: string;
    totalLeaves: number;
    leavesTaken: number;
    remainingLeaves: number;
}

export interface PositionHeld {
    title: string;
    department: string;
    fromDate?: string;
    toDate?: string;
    duration?: number;
}

export interface HrDocument {
    documentName: string;
    documentUrl: string;
    uploadedOn?: string;
    documentType: string;
}

export interface Compensation {
    netPay?: number;
    basePay?: number;
    hra?: number;
    totalBonuses?: number;
    totalDeductions?: number;
    pf?: number;
    grossPay?: number;
    others?: number;
    bonuses?: Array<{ bonusName: string; amount: number }>;
    deductions?: Array<{ deductionName: string; amount: number }>;
}

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    orgId: string;
    orgName?: string;
    orgType?: string;
    defaultCurrency?: string;
    userRoles?: string[];
    phone?: string;
    address?: string;
    profilePhoto?: string;
    personalEmail?: string;
    department?: string;
    gender?: string;
    age?: number;
    dateOfBirth?: string;
    notes?: string;
    createdAt?: string;
    // HR details
    jobTitle?: string;
    joiningDate?: string;
    annualSalary?: number;
    positionsHeld?: PositionHeld[];
    hrDocuments?: HrDocument[];
    attendanceRecords?: AttendanceRecord[];
    compensation?: Compensation;
    leaveRecords?: LeaveRecord[];
}

export interface UpdateProfileRequest {
    name?: string;
    phone?: string;
    address?: string;
    personalEmail?: string;
    gender?: string;
    dateOfBirth?: string;
}

export interface UploadAvatarResponse {
    avatar: string;
    message: string;
}

/**
 * Get current user's profile from backend
 * Fetches employee details (which includes HR data) and organization details in parallel
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
    try {
        const [employeeResponse, orgResponse] = await Promise.allSettled([
            apiClient.get<Record<string, unknown>>(`/iam/organizations/employee/details?userId=${userId}`),
            apiClient.get<{
                orgName: string;
                orgId: number;
                defaultCurrency: string;
                userRoles: string[];
                orgType: string;
            }>(`/iam/organizations/user-org/details?userId=${userId}`),
        ]);

        const profile: UserProfile = {} as UserProfile;

        if (employeeResponse.status === 'fulfilled' && employeeResponse.value.data) {
            const data = employeeResponse.value.data;
            profile.id = String(data.empId || data.id || userId);
            profile.name = String(data.fullName || data.name || '');
            profile.email = String(data.email || '');
            profile.phone = data.phone ? String(data.phone) : undefined;
            profile.address = data.address ? String(data.address) : undefined;
            profile.gender = data.gender ? String(data.gender) : undefined;
            profile.age = data.age ? Number(data.age) : undefined;
            profile.profilePhoto = data.profileImageUrl ? String(data.profileImageUrl) : undefined;
            profile.department = data.department ? String(data.department) : undefined;
            profile.jobTitle = data.jobTitle ? String(data.jobTitle) : undefined;
            profile.joiningDate = data.joiningDate ? String(data.joiningDate) : undefined;
            profile.annualSalary = data.annualSalary ? Number(data.annualSalary) : undefined;
            profile.role = data.role ? String(data.role) : 'USER';

            // Parse nested arrays
            if (Array.isArray(data.positionsHeld)) {
                profile.positionsHeld = data.positionsHeld as PositionHeld[];
            }
            if (Array.isArray(data.hrDocuments)) {
                profile.hrDocuments = data.hrDocuments as HrDocument[];
            }
            if (Array.isArray(data.attendanceRecords)) {
                profile.attendanceRecords = data.attendanceRecords as AttendanceRecord[];
            }
            if (Array.isArray(data.leaveRecords)) {
                profile.leaveRecords = data.leaveRecords as LeaveRecord[];
            }
            if (data.compensation && typeof data.compensation === 'object') {
                profile.compensation = data.compensation as Compensation;
            }
        }

        if (orgResponse.status === 'fulfilled' && orgResponse.value.data) {
            const orgData = orgResponse.value.data;
            profile.orgName = orgData.orgName || profile.orgName;
            profile.orgId = String(orgData.orgId || profile.orgId || userId);
            profile.orgType = orgData.orgType || profile.orgType;
            profile.defaultCurrency = orgData.defaultCurrency;
            profile.userRoles = orgData.userRoles;
        }

        // Fallback for id
        if (!profile.id) profile.id = userId;

        return profile;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error
            ? error.message
            : 'Failed to fetch user profile';
        console.error('Get user profile error:', error);
        throw new Error(errorMsg);
    }
}

/**
 * Update current user's profile
 */
export async function updateUserProfile(userId: string, data: UpdateProfileRequest): Promise<UserProfile> {
    try {
        const response = await apiClient.post<UserProfile>(`/iam/users/update?userId=${userId}`, data);
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error
            ? error.message
            : 'Failed to update user profile';
        console.error('Update user profile error:', error);
        throw new Error(errorMsg);
    }
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(file: File, userId: string): Promise<UploadAvatarResponse> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);

        const response = await apiClient.post<UploadAvatarResponse>(
            '/iam/users/update/profile-photo',
            formData
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error
            ? error.message
            : 'Failed to upload avatar';
        console.error('Upload avatar error:', error);
        throw new Error(errorMsg);
    }
}

/**
 * Change password
 */
export async function changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}): Promise<{ message: string }> {
    try {
        const response = await apiClient.post<{ message: string }>(
            '/iam/users/update/password',
            data
        );
        return response.data;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error
            ? error.message
            : 'Failed to change password';
        console.error('Change password error:', error);
        throw new Error(errorMsg);
    }
}

/**
 * Convert User from auth context to UserProfile
 */
export function authUserToProfile(user: User): UserProfile {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
        orgType: user.orgType,
        phone: user.phone,
        profilePhoto: user.avatar,
    };
}