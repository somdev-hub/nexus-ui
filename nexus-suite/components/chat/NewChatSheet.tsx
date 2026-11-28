'use client';

import { useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useChatStore, useChatActions } from '@/store/chatStore';
import type { User } from '@/types/chat';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import {
	Building2,
	ChevronLeft,
	ChevronRight,
	Loader2,
	Plus,
	Search,
	Users,
	X
} from 'lucide-react';
import { SelectUsersStep } from './SelectUsersStep';
import { GroupDetailsStep } from './GroupDetailsStep';

interface NewChatSheetProps {
	onStartDirectChat: (user: User) => void;
	orgId: number | null;
	groupedSuggestedUsers: [string, User[]][];
	contactTab: 'my' | 'partner';
	setContactTab: (tab: 'my' | 'partner') => void;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	isSearching: boolean;
	isLoadingOrgUsers: boolean;
	isLoadingPartners: boolean;
}

const getOrgBadgeColor = (orgType?: string) => {
	switch (orgType?.toUpperCase()) {
		case 'RETAILER':
			return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
		case 'SUPPLIER':
			return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-blue-200';
		case 'LOGISTICS':
			return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
		default:
			return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
	}
};

export function NewChatSheet({
	onStartDirectChat,
	orgId,
	groupedSuggestedUsers,
	contactTab,
	setContactTab,
	searchQuery,
	setSearchQuery,
	isSearching,
	isLoadingOrgUsers,
	isLoadingPartners,
}: NewChatSheetProps) {
	const {
		isNewChatSheetOpen,
		setIsNewChatSheetOpen,
		newChatStep,
		setNewChatStep,
		setSelectedGroupUsers,
	} = useChatStore();
	const actions = useChatActions();

	const { userId: userIdStr, orgId: orgIdStr, name: userName, avatar: userAvatar } =
		useUserMetadata();
	const userId = userIdStr ? Number(userIdStr) : null;
	const orgIdNum = orgIdStr ? Number(orgIdStr) : null;

	const handleCreateGroup = useCallback(
		async (payload: {
			name: string;
			description: string;
			avatar: File | null;
			participants: User[];
			admins: Set<number>;
		}) => {
			if (!userId || !orgIdNum) return;
			try {
				await actions.createGroupConversation(
					payload.name,
					payload.description,
					payload.participants,
					userId,
					orgIdNum,
					userName,
					userAvatar,
					payload.avatar,
					payload.admins
				);
				setIsNewChatSheetOpen(false);
				setNewChatStep('suggested');
			} catch (e) {
				console.error('Failed to create group:', e);
			}
		},
		[
			actions,
			userId,
			orgIdNum,
			userName,
			userAvatar,
			setIsNewChatSheetOpen,
			setNewChatStep,
		]
	);

	if (!isNewChatSheetOpen) return null;

	return (
		<div className="absolute left-0 top-0 h-full w-full border-l border-border bg-background z-50 shadow-lg flex flex-col animate-in slide-in-from-left duration-200">
			<div className="flex items-center gap-3 p-3 border-b bg-background">
				{newChatStep !== 'suggested' && (
					<button
						onClick={() => {
							if (newChatStep === 'select-users') {
								setNewChatStep('suggested');
							} else if (newChatStep === 'group-details') {
								setNewChatStep('select-users');
							}
						}}
						className="rounded-sm p-1 hover:bg-muted"
					>
						<ChevronLeft className="h-4 w-4" />
					</button>
				)}
				{newChatStep === 'suggested' && (
					<button
						onClick={() => setIsNewChatSheetOpen(false)}
						className="rounded-sm p-1 hover:bg-muted"
					>
						<X className="h-4 w-4" />
					</button>
				)}
				<h3 className="font-semibold">
					{newChatStep === 'suggested' && 'New conversation'}
					{newChatStep === 'select-users' && 'Select users'}
					{newChatStep === 'group-details' && 'Group details'}
				</h3>
			</div>
			{newChatStep === 'suggested' && (
				<SuggestedUsersStep
					onStartDirectChat={onStartDirectChat}
					orgId={orgId}
					groupedSuggestedUsers={groupedSuggestedUsers}
					contactTab={contactTab}
					setContactTab={setContactTab}
					searchQuery={searchQuery}
					setSearchQuery={setSearchQuery}
					isSearching={isSearching}
					isLoadingOrgUsers={isLoadingOrgUsers}
					isLoadingPartners={isLoadingPartners}
				/>
			)}
			{newChatStep === 'select-users' && (
				<SelectUsersStep
					orgId={orgId}
					contactTab={contactTab}
					setContactTab={setContactTab}
					onBack={() => setNewChatStep('suggested')}
					onNext={(selectedUsers) => {
						setSelectedGroupUsers(selectedUsers);
						setNewChatStep('group-details');
					}}
				/>
			)}
			{newChatStep === 'group-details' && (
				<GroupDetailsStep
					orgId={orgId}
					onBack={() => setNewChatStep('select-users')}
					onCreate={(payload) => {
						handleCreateGroup(payload);
					}}
				/>
			)}
		</div>
	);
}

function SuggestedUsersStep({
	onStartDirectChat,
	orgId,
	groupedSuggestedUsers,
	contactTab,
	setContactTab,
	searchQuery,
	setSearchQuery,
	isSearching,
	isLoadingOrgUsers,
	isLoadingPartners,
}: {
	onStartDirectChat: (user: User) => void;
	orgId: number | null;
	groupedSuggestedUsers: [string, User[]][];
	contactTab: 'my' | 'partner';
	setContactTab: (tab: 'my' | 'partner') => void;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	isSearching: boolean;
	isLoadingOrgUsers: boolean;
	isLoadingPartners: boolean;
}) {
	const { setNewChatStep, setIsNewChatSheetOpen } = useChatStore();

	return (
		<div className="p-4 flex flex-col gap-4 flex-1 min-h-0">
			<Button
				onClick={() => setNewChatStep('select-users')}
				className="w-full flex items-center justify-between shrink-0"
			>
				<span className="flex items-center gap-2">
					<Users className="h-4 w-4" />
					Create group
				</span>
				<ChevronRight className="h-4 w-4" />
			</Button>
			<div className="border-t pt-4 flex flex-col flex-1 min-h-0">
				<div className="flex gap-1 shrink-0 mb-3">
					<Button
						size="sm"
						variant={contactTab === 'my' ? 'default' : 'outline'}
						onClick={() => setContactTab('my')}
						className="flex-1"
					>
						My org
					</Button>
					<Button
						size="sm"
						variant={contactTab === 'partner' ? 'default' : 'outline'}
						onClick={() => setContactTab('partner')}
						className="flex-1"
					>
						Partner org
					</Button>
				</div>
				<div className="relative shrink-0 mb-3">
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search users..."
						className="h-9 pl-8 pr-2 text-sm"
					/>
					<Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				</div>
				<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 shrink-0">
					Suggested users
				</p>
				<ScrollArea className="flex-1 min-h-0">
					<div className="space-y-1">
						{groupedSuggestedUsers.length === 0 &&
							!isSearching &&
							!isLoadingOrgUsers &&
							!isLoadingPartners && (
								<p className="text-sm text-muted-foreground text-center py-4">
									{isLoadingOrgUsers ||
										isLoadingPartners
										? 'Loading...'
										: 'No users found'}
								</p>
							)}
						{groupedSuggestedUsers.map(([letter, users]) => (
							<div key={letter}>
								<div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 border-b border-border">
									{letter}
								</div>
								<div className="space-y-1">
									{users.map((user) => (
										<div
											key={user.id}
											className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
											onClick={() => {
												onStartDirectChat(user);
												setIsNewChatSheetOpen(false);
											}}
										>
											<Avatar className="h-8 w-8">
												<AvatarImage
													src={user.profilePhoto}
												/>
												<AvatarFallback>
													{user.name.charAt(0)}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate">
													{user.name}
												</p>
												<p className="text-xs text-muted-foreground truncate">
													{user.email}
												</p>
												{user.orgName &&
													user.orgId !== orgId && (
														<p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
															<Building2 className="h-3 w-3" />
															{user.orgName}
														</p>
													)}
											</div>
											{user.orgType && (
												<Badge
													className={cn(
														'text-[10px]',
														getOrgBadgeColor(
															user.orgType
														)
													)}
												>
													{user.orgType}
												</Badge>
											)}
											<Plus className="h-4 w-4 text-muted-foreground" />
										</div>
									))}
								</div>
							</div>
						))}
						{isSearching && (
							<div className="flex items-center justify-center py-4">
								<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
							</div>
						)}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
}

