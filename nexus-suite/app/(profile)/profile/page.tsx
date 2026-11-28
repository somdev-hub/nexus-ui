'use client';

import '@/app/suite-calendar.css';
import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardTitle,
} from '@/components/ui/card';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { useAuth } from '@/lib/auth-context';
import { useProfileStore } from '@/store/profileStore';
import { getOrgTypeLabel, getRoleLabel } from './_components/profile-utils';
import { ProfileHero } from './_components/ProfileHero';
import { ProfileTabs } from './_components/ProfileTabs';
import { ProfileDrawers } from './_components/ProfileDrawers';
import { ProfileSkeleton } from './_components/ProfileSkeleton';

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

	const profile = useProfileStore((state) => state.profile);
	const loading = useProfileStore((state) => state.loading);
	const avatarPreview = useProfileStore((state) => state.avatarPreview);
	const setEditDrawerOpen = useProfileStore((state) => state.setEditDrawerOpen);
	const setImageDrawerOpen = useProfileStore((state) => state.setImageDrawerOpen);

	const fetchProfile = useProfileStore((state) => state.fetchProfile);
	const resetEditForm = useProfileStore((state) => state.resetEditForm);

	useEffect(() => {
		if (userId) {
			fetchProfile(userId, isAuthenticated);
		}
	}, [fetchProfile, userId, isAuthenticated]);

	const openEditDrawer = () => {
		resetEditForm();
		setEditDrawerOpen(true);
	};

	if (loading || authLoading || metadataLoading) {
		return <ProfileSkeleton />;
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

	const displayAvatar =
		avatarPreview ||
		profile.profilePhoto ||
		authUser?.avatar ||
		'/avatars/default.jpg';
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
				onEditAvatar={() => setImageDrawerOpen(true)}
			/>

			<ProfileTabs
				profile={profile}
				displayEmail={displayEmail}
				displayPhone={displayPhone}
				displayRole={displayRole}
				displayOrgType={displayOrgType}
				displayDefaultCurrency={displayDefaultCurrency}
			/>

			<ProfileDrawers />
		</div>
	);
}
