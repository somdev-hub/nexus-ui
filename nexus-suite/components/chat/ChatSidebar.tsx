'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { chatService } from '@/lib/services';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chatStore';
import type { ChatConversation, User } from '@/types/chat';
import { Plus, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NewChatSheet } from './NewChatSheet';

interface ChatSidebarProps {
	conversations: ChatConversation[];
	isLoadingConvs: boolean;
	selectedConvId: number | null;
	onSelectConversation: (convId: number) => void;
	onStartDirectChat: (user: User) => void;
}

export function ChatSidebar({
	conversations,
	isLoadingConvs,
	selectedConvId,
	onSelectConversation,
	onStartDirectChat,
}: ChatSidebarProps) {
	const {
		userId: userIdStr,
		orgId: orgIdStr,
	} = useUserMetadata();
	const userId = userIdStr ? Number(userIdStr) : null;
	const orgId = orgIdStr ? Number(orgIdStr) : null;
	const { toast } = useToast();

	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	const {
		contactTab,
		setContactTab,
		orgUsers,
		partnerOrgs,
		isLoadingOrgUsers,
		isLoadingPartners,
		setNewChatStep,
		setIsNewChatSheetOpen,
		loadOrgUsers,
		loadPartnerOrgs,
	} = useChatStore();

	const handleSearch = useCallback(
		async (query: string) => {
			if (!query.trim()) {
				setSearchResults([]);
				return;
			}
			setIsSearching(true);
			try {
				const results = await chatService.searchUsers(query);
				setSearchResults(results);
			} catch (e) {
				console.error('Search failed:', e);
				toast({
					title: 'Search failed',
					description: 'Could not search users. Please try again.',
					variant: 'destructive',
				});
			} finally {
				setIsSearching(false);
			}
		},
		[toast]
	);

	useEffect(() => {
		if (!searchQuery.trim()) {
			const t = setTimeout(() => setSearchResults([]), 0);
			return () => clearTimeout(t);
		}
		const timer = setTimeout(() => {
			handleSearch(searchQuery);
		}, 500);
		return () => clearTimeout(timer);
	}, [handleSearch, searchQuery]);

	useEffect(() => {
		if (!userId || !orgId) return;
		loadOrgUsers(orgId);
		loadPartnerOrgs(orgId);
	}, [userId, orgId, loadOrgUsers, loadPartnerOrgs]);

	const suggestedUsers = useMemo(() => {
		if (searchQuery) return searchResults;
		if (contactTab === 'my') return orgUsers;
		return partnerOrgs.flatMap((o) => o.users);
	}, [searchQuery, searchResults, contactTab, orgUsers, partnerOrgs]);

	const groupedSuggestedUsers = useMemo(() => {
		const sorted = [...suggestedUsers].sort((a, b) =>
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
	}, [suggestedUsers]);

	const handleCreateConversation = useCallback(
		(targetUser: User) => {
			if (!userId || !orgId) return;
			onStartDirectChat(targetUser);
		},
		[onStartDirectChat, userId, orgId]
	);

	if (!userId || !orgId) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">
					Please log in to use chat.
				</p>
			</div>
		);
	}

	return (
		<div className="hidden md:flex md:flex-col md:w-80 lg:w-96 shrink-0 border-r h-full overflow-hidden relative">
			<div className="flex items-center justify-between p-3 border-b">
				<h3 className="font-semibold">Messages</h3>
				<Button
					size="sm"
					variant="outline"
					onClick={() => {
						setNewChatStep('suggested');
						setIsNewChatSheetOpen(true);
					}}
				>
					<Plus className="h-4 w-4 mr-1" />
					New
				</Button>
			</div>

			<NewChatSheet
				onStartDirectChat={handleCreateConversation}
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

			<ScrollArea className="flex-1">
				<div className="p-2 space-y-1">
					{isLoadingConvs ? (
						<div className="p-2 space-y-3">
							{Array.from({ length: 6 }).map((_, i) => (
								<div
									key={i}
									className="flex items-center gap-3 p-2"
								>
									<Skeleton className="h-8 w-8 rounded-full" />
									<div className="flex-1 space-y-1">
										<Skeleton className="h-4 w-3/4" />
										<Skeleton className="h-3 w-1/2" />
									</div>
								</div>
							))}
						</div>
					) : conversations.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-8">
							No conversations yet.{' '}
							<span className="font-bold">Start a new chat!</span>
						</p>
					) : (
						[...conversations]
							.sort((a, b) => {
								const aNew = !a.lastMessageAt;
								const bNew = !b.lastMessageAt;
								if (aNew !== bNew) return aNew ? -1 : 1;
								if (aNew) {
									const ca = a.createdAt
										? new Date(a.createdAt).getTime()
										: 0;
									const cb = b.createdAt
										? new Date(b.createdAt).getTime()
										: 0;
									return cb - ca;
								}
								const timeA = a.lastMessageAt
									? new Date(a.lastMessageAt).getTime()
									: 0;
								const timeB = b.lastMessageAt
									? new Date(b.lastMessageAt).getTime()
									: 0;
								return timeB - timeA;
							})
							.map((conv) => {
								const displayName =
									conv.chatConversationName ||
									conv.otherParticipantName ||
									'Conversation';
								const avatarUrl = conv.otherParticipantAvatar;
								const isGroup =
									conv.chatConversationType === 'GROUP';
								const avatarFallback = isGroup
									? null
									: conv.otherParticipantName?.charAt(0) ||
									displayName.charAt(0);
								const lastMsg = conv.lastMessage || (
									<span className="text-primary font-medium">
										Start a conversation
									</span>
								);
								const lastMsgTime = conv.lastMessageAt
									? new Date(
										conv.lastMessageAt
									).toLocaleTimeString([], {
										hour: '2-digit',
										minute: '2-digit',
									})
									: '';

								return (
									<div
										key={conv.chatConversationId}
										className={cn(
											'p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors',
											selectedConvId ===
											conv.chatConversationId &&
											'bg-muted'
										)}
										onClick={() =>
											onSelectConversation(
												conv.chatConversationId
											)
										}
									>
										<div className="flex items-center gap-3">
											<Avatar className="h-10 w-10 shrink-0">
												<AvatarImage src={avatarUrl} />
												<AvatarFallback
													className={
														isGroup
															? 'bg-primary/10'
															: ''
													}
												>
													{isGroup ? (
														<Users className="h-5 w-5 text-primary" />
													) : (
														avatarFallback
													)}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between gap-2">
													<div className="flex gap-2 items-center">
														<p className="text-sm font-medium truncate">
															{displayName}
														</p>
														{conv.isInterOrg && (
															<div className="mt-1">
																<Badge
																	variant="secondary"
																	className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
																>
																	Inter-org
																</Badge>
															</div>
														)}
													</div>
													<div className="flex items-center gap-1 shrink-0">
														{lastMsgTime && (
															<span className="text-xs text-muted-foreground">
																{lastMsgTime}
															</span>
														)}
														{(conv.unreadCount ??
															0) > 0 && (
																<Badge
																	variant="default"
																	className="text-[10px] h-4 min-w-4 px-1.5 rounded-full"
																>
																	{
																		conv.unreadCount
																	}
																</Badge>
															)}
													</div>
												</div>
												<p className="text-sm text-muted-foreground truncate mt-0.5">
													{lastMsg}
												</p>
											</div>
										</div>
									</div>
								);
							})
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
