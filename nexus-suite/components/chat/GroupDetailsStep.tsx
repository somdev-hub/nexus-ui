'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/store/chatStore';
import type { User } from '@/types/chat';
import {
	Loader2,
	Plus,
	Users
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';

interface GroupDetailsStepProps {
	orgId: number | null;
	onBack: () => void;
	onCreate: (payload: {
		name: string;
		description: string;
		avatar: File | null;
		participants: User[];
		admins: Set<number>;
	}) => void;
}

export function GroupDetailsStep({
	onCreate,
}: GroupDetailsStepProps) {
	const {
		setGroupName,
		setGroupDescription,
		setGroupAdmins,
		groupName,
		groupDescription,
		groupAdmins,
		selectedGroupUsers,
		isCreatingGroup,
	} = useChatStore();

	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

	const handleAvatarChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			setAvatarFile(file);
			const preview = URL.createObjectURL(file);
			setAvatarPreview(preview);
		},
		[]
	);

	const toggleAdmin = useCallback(
		(userId: number) => {
			const next = new Set(groupAdmins);
			if (next.has(userId)) next.delete(userId);
			else next.add(userId);
			setGroupAdmins(next);
		},
		[groupAdmins, setGroupAdmins]
	);

	const isAdmin = (userId: number) => groupAdmins.has(userId);

	const handleCreate = useCallback(() => {
		onCreate({
			name: groupName.trim(),
			description: groupDescription.trim(),
			avatar: avatarFile,
			participants: selectedGroupUsers,
			admins: groupAdmins,
		});
	}, [groupName, groupDescription, avatarFile, selectedGroupUsers, groupAdmins, onCreate]);

	const groupedParticipants = useMemo(() => {
		const sorted = [...selectedGroupUsers].sort((a, b) =>
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
	}, [selectedGroupUsers]);

	return (
		<div className="p-4 flex flex-col gap-4 flex-1 min-h-0">
			<div className="flex flex-col flex-1 min-h-0">
				<div className="flex flex-col items-center gap-4 shrink-0 mb-4">
					<div className="relative">
						{avatarPreview ? (
							<Image
								src={avatarPreview}
								alt="Group avatar"
								className="h-20 w-20 rounded-full object-cover overflow-hidden border-primary border"
								unoptimized
								sizes="80px"
								height={80}
								width={80}
							/>
						) : (
							<div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border overflow-hidden border-primary">
								<Users className="h-10 w-10 text-muted-foreground " />
							</div>
						)}
						<label className="absolute bottom-0 right-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors">
							<Plus className="h-3 w-3" />
							<input
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleAvatarChange}
							/>
						</label>
					</div>
					<div className="flex-1 space-y-2 min-w-0">
						<Input
							placeholder="Group name"
							value={groupName}
							onChange={(e) => setGroupName(e.target.value)}
						/>
						<Input
							placeholder="Description"
							value={groupDescription}
							onChange={(e) => setGroupDescription(e.target.value)}
						/>
					</div>
				</div>

				<div className="border-t pt-3">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 shrink-0">
						Participants
					</p>
					<ScrollArea className="flex-1 min-h-0">
						<div className="space-y-1">
							{groupedParticipants.length === 0 && (
								<p className="text-sm text-muted-foreground text-center py-4">
									No participants selected
								</p>
							)}
							{groupedParticipants.map(([letter, users]) => (
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
												className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
											>
												<div className="h-8 w-8 shrink-0">
													{user.profilePhoto ? (
														<Image
															src={user.profilePhoto}
															alt={user.name}
															className="h-8 w-8 rounded-full object-cover"
															unoptimized
															sizes="32px"
														/>
													) : (
														<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
															{user.name.charAt(0).toUpperCase()}
														</div>
													)}
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium truncate">
														{user.name}
													</p>
													<p className="text-xs text-muted-foreground truncate">
														{user.email}
													</p>
												</div>
												<Button
													size="sm"
													variant={isAdmin(user.id) ? 'ghost' : 'outline'}
													className="h-7 text-xs shrink-0 cursor-pointer"
													onClick={() => toggleAdmin(user.id)}
												>
													{isAdmin(user.id)
														? 'Remove Admin'
														: 'Make Admin'}
												</Button>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</ScrollArea>
				</div>
			</div>

			<div className="border-t pt-3 shrink-0">
				<Button
					onClick={handleCreate}
					disabled={
						!groupName.trim() ||
						selectedGroupUsers.length === 0 ||
						isCreatingGroup
					}
					className="w-full"
				>
					{isCreatingGroup ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						'Create Group'
					)}
				</Button>
			</div>
		</div>
	);
}
