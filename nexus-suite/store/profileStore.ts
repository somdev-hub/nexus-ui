'use client';

import { create } from 'zustand';
import type {
    UserProfile,
    UpdateProfileRequest,
} from '@/lib/services/user-profile-service';

export type PasswordForm = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

interface ProfileState {
    // Profile data
    profile: UserProfile | null;
    loading: boolean;
    saving: boolean;
    uploadingAvatar: boolean;

    // Drawer state
    isEditDrawerOpen: boolean;
    isImageDrawerOpen: boolean;
    isPasswordDrawerOpen: boolean;

    // Forms
    editForm: UpdateProfileRequest;
    avatarPreview: string | null;
    passwordForm: PasswordForm;

    // Password visibility toggles
    showCurrentPassword: boolean;
    showNewPassword: boolean;
    showConfirmPassword: boolean;

    // Actions
    setProfile: (profile: UserProfile | null) => void;
    setLoading: (loading: boolean) => void;
    setSaving: (saving: boolean) => void;
    setUploadingAvatar: (uploading: boolean) => void;

    setEditDrawerOpen: (open: boolean) => void;
    setImageDrawerOpen: (open: boolean) => void;
    setPasswordDrawerOpen: (open: boolean) => void;

    setEditForm: (field: keyof UpdateProfileRequest, value: string) => void;
    resetEditForm: () => void;
    setAvatarPreview: (preview: string | null) => void;

    setPasswordForm: (field: keyof PasswordForm, value: string) => void;
    resetPasswordForm: () => void;
    setShowCurrentPassword: (show: boolean) => void;
    setShowNewPassword: (show: boolean) => void;
    setShowConfirmPassword: (show: boolean) => void;
    toggleShowCurrentPassword: () => void;
    toggleShowNewPassword: () => void;
    toggleShowConfirmPassword: () => void;

    // Async actions
    fetchProfile: (userId: string, isAuthenticated: boolean) => Promise<void>;
    saveProfile: (userId: string) => Promise<void>;
    uploadAvatar: (file: File, userId: string) => Promise<void>;
    changePassword: () => Promise<void>;
}

const initialEditForm: UpdateProfileRequest = {
    name: '',
    phone: '',
    address: '',
    personalEmail: '',
    gender: '',
    dateOfBirth: '',
};

const initialPasswordForm: PasswordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
};

export const useProfileStore = create<ProfileState>((set, get) => ({
    profile: null,
    loading: true,
    saving: false,
    uploadingAvatar: false,
    isEditDrawerOpen: false,
    isImageDrawerOpen: false,
    isPasswordDrawerOpen: false,
    editForm: { ...initialEditForm },
    avatarPreview: null,
    passwordForm: { ...initialPasswordForm },
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,

    setProfile: (profile) => set({ profile }),
    setLoading: (loading) => set({ loading }),
    setSaving: (saving) => set({ saving }),
    setUploadingAvatar: (uploadingAvatar) => set({ uploadingAvatar }),

    setEditDrawerOpen: (isEditDrawerOpen) => set({ isEditDrawerOpen }),
    setImageDrawerOpen: (isImageDrawerOpen) => set({ isImageDrawerOpen }),
    setPasswordDrawerOpen: (isPasswordDrawerOpen) => set({ isPasswordDrawerOpen }),

    setEditForm: (field, value) =>
        set((state) => ({
            editForm: { ...state.editForm, [field]: value },
        })),
    resetEditForm: () =>
        set((state) => ({
            editForm: state.profile
                ? {
                      name: state.profile.name || '',
                      phone: state.profile.phone || '',
                      address: state.profile.address || '',
                      personalEmail: state.profile.personalEmail || '',
                      gender: state.profile.gender || '',
                      dateOfBirth: state.profile.dateOfBirth || '',
                  }
                : { ...initialEditForm },
        })),
    setAvatarPreview: (avatarPreview) => set({ avatarPreview }),

    setPasswordForm: (field, value) =>
        set((state) => ({
            passwordForm: { ...state.passwordForm, [field]: value },
        })),
    resetPasswordForm: () =>
        set({ passwordForm: { ...initialPasswordForm } }),
    setShowCurrentPassword: (show) =>
        set({ showCurrentPassword: show }),
    setShowNewPassword: (show) => set({ showNewPassword: show }),
    setShowConfirmPassword: (show) => set({ showConfirmPassword: show }),
    toggleShowCurrentPassword: () =>
        set((state) => ({ showCurrentPassword: !state.showCurrentPassword })),
    toggleShowNewPassword: () =>
        set((state) => ({ showNewPassword: !state.showNewPassword })),
    toggleShowConfirmPassword: () =>
        set((state) => ({ showConfirmPassword: !state.showConfirmPassword })),

    fetchProfile: async (userId, isAuthenticated) => {
        if (!isAuthenticated || !userId) {
            set({ loading: false, profile: null });
            return;
        }

        set({ loading: true });
        try {
            const { getUserProfile } =
                await import('@/lib/services/user-profile-service');

            const backendProfile = await getUserProfile(userId);
            set({ profile: backendProfile });
            get().resetEditForm();
        } catch (error) {
            console.warn('Failed to fetch profile:', error);
        } finally {
            set({ loading: false });
        }
    },

    saveProfile: async (userId) => {
        const { editForm } = get();
        set({ saving: true });
        try {
            const { updateUserProfile } =
                await import('@/lib/services/user-profile-service');
            const updatedProfile = await updateUserProfile(userId, editForm);
            set((state) => ({
                profile: state.profile
                    ? { ...state.profile, ...updatedProfile }
                    : null,
                saving: false,
                isEditDrawerOpen: false,
            }));
            window.dispatchEvent(new Event('auth:profile-updated'));
        } catch (error: unknown) {
            const errorMsg =
                error instanceof Error ? error.message : 'Failed to update profile';
            console.error(errorMsg);
            set({ saving: false });
        }
    },

    uploadAvatar: async (file, userId) => {
        if (!file.type.startsWith('image/')) {
            console.warn('Invalid file type');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            console.warn('File too large');
            return;
        }

        set({ uploadingAvatar: true });
        try {
            const { uploadAvatar } =
                await import('@/lib/services/user-profile-service');
            const result = await uploadAvatar(file, userId);
            set((state) => ({
                profile: state.profile
                    ? { ...state.profile, profilePhoto: result.avatar }
                    : null,
                avatarPreview: null,
                uploadingAvatar: false,
                isImageDrawerOpen: false,
            }));
            window.dispatchEvent(new Event('auth:profile-updated'));
        } catch (error: unknown) {
            const errorMsg =
                error instanceof Error ? error.message : 'Failed to upload avatar';
            console.error(errorMsg);
            set({ uploadingAvatar: false });
        }
    },

    changePassword: async () => {
        const { passwordForm } = get();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            console.warn('Passwords do not match');
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            console.warn('Password too short');
            return;
        }

        try {
            const { changePassword } =
                await import('@/lib/services/user-profile-service');
            await changePassword(passwordForm);
            set({
                passwordForm: { ...initialPasswordForm },
                isPasswordDrawerOpen: false,
            });
        } catch (error: unknown) {
            const errorMsg =
                error instanceof Error ? error.message : 'Failed to change password';
            console.error(errorMsg);
        }
    },
}));
