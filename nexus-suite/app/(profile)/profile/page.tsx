'use client';

import '@/app/suite-calendar.css';
import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { useAuth } from '@/lib/auth-context';
import {
	getUserProfile,
	updateUserProfile,
	uploadAvatar,
	changePassword,
	authUserToProfile,
	type UserProfile,
	type UpdateProfileRequest,
} from '@/lib/services/user-profile-service';
import { getOrgTypeLabel, getRoleLabel } from './_components/profile-utils';
import { ProfileHero } from './_components/ProfileHero';
import { ProfileTabs } from './_components/ProfileTabs';
import { ProfileDrawers } from './_components/ProfileDrawers';

export default function ProfilePage() {
	const { user: authUser, isLoading: authLoading, logout } = useAuth();
	const {
		userId,
		email,
		name,
		phone,
		orgType,
		role,
		isAuthenticated,
		isLoading: metadataLoading,
	} = useUserMetadata();
	const { toast } = useToast();

	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);

	const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
	const [isImageDrawerOpen, setIsImageDrawerOpen] = useState(false);
	const [isPasswordDrawerOpen, setIsPasswordDrawerOpen] = useState(false);

	const [editForm, setEditForm] = useState<UpdateProfileRequest>({
		name: '',
		phone: '',
		address: '',
		personalEmail: '',
		gender: '',
		dateOfBirth: '',
	});

	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	useEffect(() => {
		let mounted = true;

		const fetchProfile = async () => {
			if (!isAuthenticated || !userId) {
				if (mounted) setLoading(false);
				return;
			}

			try {
				if (mounted) setLoading(true);
				const backendProfile = await getUserProfile(userId);
				if (!mounted) return;

				setProfile(backendProfile);
				setEditForm({
					name: backendProfile.name || '',
					phone: backendProfile.phone || '',
					address: backendProfile.address || '',
					personalEmail: backendProfile.personalEmail || '',
					gender: backendProfile.gender || '',
					dateOfBirth: backendProfile.dateOfBirth || '',
				});
			} catch (error) {
				console.warn('Failed to fetch from backend, using auth context:', error);
				if (!mounted) return;
				if (authUser) {
					const fallbackProfile = authUserToProfile(authUser);
					setProfile(fallbackProfile);
					setEditForm({
						name: fallbackProfile.name || '',
						phone: fallbackProfile.phone || '',
						address: '',
						personalEmail: '',
						gender: '',
						dateOfBirth: '',
					});
				}
			} finally {
				if (mounted) setLoading(false);
			}
		};

		fetchProfile();

		return () => {
			mounted = false;
		};
	}, [isAuthenticated, userId, authUser]);

	const handleEditChange = (field: keyof UpdateProfileRequest, value: string) => {
		setEditForm(prev => ({ ...prev, [field]: value }));
	};

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			toast({
				title: 'Invalid file type',
				description: 'Please select an image file.',
				variant: 'destructive',
			});
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast({
				title: 'File too large',
				description: 'Avatar must be less than 5MB.',
				variant: 'destructive',
			});
			return;
		}

		const reader = new FileReader();
		reader.onload = (event) => {
			setAvatarPreview(event.target?.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleSaveProfile = async () => {
		if (!userId) return;

		setSaving(true);
		try {
			const updatedProfile = await updateUserProfile(userId, editForm);
			setProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
			window.dispatchEvent(new Event('auth:profile-updated'));

			toast({
				title: 'Profile updated',
				description: 'Your profile has been saved successfully.',
			});

			setIsEditDrawerOpen(false);
		} catch (error: unknown) {
			const errorMsg = error instanceof Error ? error.message : 'Failed to update profile';
			toast({
				title: 'Error',
				description: errorMsg,
				variant: 'destructive',
			});
		} finally {
			setSaving(false);
		}
	};

	const handleUploadAvatar = async () => {
		const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
		const file = fileInput?.files?.[0];

		if (!file) {
			toast({
				title: 'No file selected',
				description: 'Please select an image to upload.',
				variant: 'destructive',
			});
			return;
		}

		setUploadingAvatar(true);
		try {
			const result = await uploadAvatar(file, userId!);
			setProfile(prev => prev ? { ...prev, profilePhoto: result.avatar } : null);
			setAvatarPreview(null);
			fileInput.value = '';

			window.dispatchEvent(new Event('auth:profile-updated'));

			toast({
				title: 'Avatar updated',
				description: 'Your profile picture has been changed.',
			});

			setIsImageDrawerOpen(false);
		} catch (error: unknown) {
			const errorMsg = error instanceof Error ? error.message : 'Failed to upload avatar';
			toast({
				title: 'Error',
				description: errorMsg,
				variant: 'destructive',
			});
		} finally {
			setUploadingAvatar(false);
		}
	};

	const handleChangePassword = async () => {
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			toast({
				title: 'Passwords do not match',
				description: 'Please ensure both passwords are the same.',
				variant: 'destructive',
			});
			return;
		}

		if (passwordForm.newPassword.length < 8) {
			toast({
				title: 'Password too short',
				description: 'Password must be at least 8 characters.',
				variant: 'destructive',
			});
			return;
		}

		try {
			await changePassword(passwordForm);
			toast({
				title: 'Password changed',
				description: 'Your password has been updated successfully.',
			});
			setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
			setIsPasswordDrawerOpen(false);
		} catch (error: unknown) {
			const errorMsg = error instanceof Error ? error.message : 'Failed to change password';
			toast({
				title: 'Error',
				description: errorMsg,
				variant: 'destructive',
			});
		}
	};

	const resetEditForm = () => {
		if (profile) {
			setEditForm({
				name: profile.name || '',
				phone: profile.phone || '',
				address: profile.address || '',
				personalEmail: profile.personalEmail || '',
				gender: profile.gender || '',
				dateOfBirth: profile.dateOfBirth || '',
			});
		}
	};

	const openEditDrawer = () => {
		resetEditForm();
		setIsEditDrawerOpen(true);
	};

	if (loading || authLoading || metadataLoading) {
		return (
			<div className="p-4 md:p-6">
				<div className="flex flex-col gap-6">
					<div className="flex gap-4">
						<Skeleton className="h-10 w-48" />
						<Skeleton className="h-10 w-32" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Skeleton className="h-64 w-full" />
						<Skeleton className="h-64 w-full" />
					</div>
				</div>
			</div>
		);
	}

	if (!isAuthenticated || !profile) {
		return (
			<div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[60vh]">
				<Card className="w-full max-w-md p-4 gap-2">
					<CardContent className="p-0 text-center py-8">
						<AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<CardTitle>Unable to load profile</CardTitle>
						<CardDescription>
							Please log in to view your profile.
						</CardDescription>
						<CardFooter className="p-0">
							<Button onClick={() => logout()}>Log Out</Button>
						</CardFooter>
					</CardContent>
				</Card>
			</div>
		);
	}

	const displayAvatar = avatarPreview || profile.profilePhoto || authUser?.avatar || '/avatars/default.jpg';
	const displayName = profile.name || name || 'User';
	const displayEmail = profile.email || email || 'user@example.com';
	const displayRole = getRoleLabel(profile.role || role || '');
	const displayOrgType = getOrgTypeLabel(profile.orgType || orgType);
	const displayPhone = profile.phone || phone || '—';
	const displayDepartment = profile.department || '—';
	const displayOrgName = profile.orgName || '—';
	const displayDefaultCurrency = profile.defaultCurrency || '—';

	return (
		<div className="p-4 md:p-6 space-y-8">
			<ProfileHero
				avatar={displayAvatar}
				displayName={displayName}
				displayRole={displayRole}
				displayDepartment={displayDepartment}
				displayOrgName={displayOrgName}
				displayOrgType={displayOrgType}
				onEditProfile={openEditDrawer}
				onLogout={logout}
				onEditAvatar={() => setIsImageDrawerOpen(true)}
			/>

			<ProfileTabs
				profile={profile}
				displayEmail={displayEmail}
				displayPhone={displayPhone}
				displayRole={displayRole}
				displayOrgType={displayOrgType}
				displayDefaultCurrency={displayDefaultCurrency}
			/>

			<ProfileDrawers
				displayAvatar={displayAvatar}
				isEditDrawerOpen={isEditDrawerOpen}
				setIsEditDrawerOpen={setIsEditDrawerOpen}
				editForm={editForm}
				handleEditChange={handleEditChange}
				handleSaveProfile={handleSaveProfile}
				saving={saving}
				isImageDrawerOpen={isImageDrawerOpen}
				setIsImageDrawerOpen={setIsImageDrawerOpen}
				avatarPreview={avatarPreview}
				setAvatarPreview={setAvatarPreview}
				handleAvatarChange={handleAvatarChange}
				handleUploadAvatar={handleUploadAvatar}
				uploadingAvatar={uploadingAvatar}
				isPasswordDrawerOpen={isPasswordDrawerOpen}
				setIsPasswordDrawerOpen={setIsPasswordDrawerOpen}
				passwordForm={passwordForm}
				setPasswordForm={setPasswordForm}
				showCurrentPassword={showCurrentPassword}
				setShowCurrentPassword={setShowCurrentPassword}
				showNewPassword={showNewPassword}
				setShowNewPassword={setShowNewPassword}
				showConfirmPassword={showConfirmPassword}
				setShowConfirmPassword={setShowConfirmPassword}
				handleChangePassword={handleChangePassword}
			/>
		</div>
	);
}

