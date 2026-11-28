'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chatStore';
import type { User } from '@/types/chat';
import { Check, Loader2, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

interface SelectUsersStepProps {
	orgId: number | null;
	onBack: () => void;
	onNext: (selectedUsers: User[]) => void;
	contactTab: 'my' | 'partner';
	setContactTab: (tab: 'my' | 'partner') => void;
}

export function SelectUsersStep({
	onNext,
	contactTab,
	setContactTab,
}: SelectUsersStepProps) {
	const {
		setSelectedGroupUsers,
		selectedGroupUsers,
		orgUsers,
		partnerOrgs,
		isLoadingOrgUsers,
		isLoadingPartners,
	} = useChatStore();

	const [searchQuery, setSearchQuery] = useState('');

	const allUsers = useMemo(() => {
		if (contactTab === 'my') return orgUsers;
		return partnerOrgs.flatMap((o) => o.users);
	}, [contactTab, orgUsers, partnerOrgs]);

	const filteredUsers = useMemo(() => {
		if (!searchQuery.trim()) return allUsers;
		const q = searchQuery.toLowerCase();
		return allUsers.filter(
			(u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
		);
	}, [allUsers, searchQuery]);

	const groupedUsers = useMemo(() => {
		const sorted = [...filteredUsers].sort((a, b) =>
			a.name.localeCompare(b.name)
		);
		const groups = new Map<string, User[]>();
		for (const user of sorted) {
			const letter = user.name.charAt(0).toUpperCase();
			if (!groups.has(letter)) groups.set(letter, []);
			groups.get(letter)!.push(user);
		}
		return Array.from(groups.entries()).sort(([a], [b]) =>
			a.localeCompare(b)
		);
	}, [filteredUsers]);

	const isSelected = (userId: number) =>
		selectedGroupUsers.some((u) => u.id === userId);

	const toggleUser = (user: User) => {
		if (isSelected(user.id)) {
			setSelectedGroupUsers(
				selectedGroupUsers.filter((u) => u.id !== user.id)
			);
		} else {
			setSelectedGroupUsers([...selectedGroupUsers, user]);
		}
	};

	return (
		<div className="p-4 flex flex-col gap-4 flex-1 min-h-0">
			<div className="flex flex-col flex-1 min-h-0">
				<div className="relative shrink-0 mb-3">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search users..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>

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

				<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 shrink-0">
					Suggested users
				</p>

				<ScrollArea className="flex-1 min-h-0">
					<div className="space-y-1">
						{groupedUsers.length === 0 &&
							!isLoadingOrgUsers &&
							!isLoadingPartners && (
								<p className="text-sm text-muted-foreground text-center py-4">
									No users found
								</p>
							)}
						{groupedUsers.map(([letter, users]) => (
							<div key={`letter-${letter}`}>
								<div
									className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 border-b border-border"
								>
									{letter}
								</div>
								<div className="space-y-1">
									{users.map((user) => (
										<div
											key={user.id}
											className={cn(
												'flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer',
												isSelected(user.id) && 'bg-muted'
											)}
											onClick={() => toggleUser(user)}
										>
											{isSelected(user.id) ? (
												<Check className="h-4 w-4 text-primary" />
											) : (
												<Plus className="h-4 w-4 text-muted-foreground" />
											)}
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate">
													{user.name}
												</p>
												<p className="text-xs text-muted-foreground truncate">
													{user.email}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						))}
						{(isLoadingOrgUsers || isLoadingPartners) && (
							<div className="flex items-center justify-center py-4">
								<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
							</div>
						)}
					</div>
				</ScrollArea>
			</div>

			<div className="border-t pt-3 shrink-0">
				<Button
					onClick={() => onNext(selectedGroupUsers)}
					disabled={selectedGroupUsers.length === 0}
					className="w-full"
				>
					Next
				</Button>
			</div>
		</div>
	);
}
