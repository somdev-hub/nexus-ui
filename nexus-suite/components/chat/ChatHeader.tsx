'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ChatConversationParticipant } from '@/types/chat';
import { IconDotsVertical } from '@tabler/icons-react';
import {
	ArrowUpToLine,
	Download,
	Loader2,
	MessageSquare,
	Search,
	Trash2,
	Users,
	X,
} from 'lucide-react';
import { useChatStore, useChatUI, useChatActions } from '@/store/chatStore';
import { useUserMetadata } from '@/hooks/use-user-metadata';

export function ChatHeader() {
	const { userId: userIdStr, orgId: orgIdStr } = useUserMetadata();
	const userId = userIdStr ? Number(userIdStr) : null;
	const orgId = orgIdStr ? Number(orgIdStr) : null;
	const selectedConvDetails = useChatStore((s) => s.selectedConvDetails);
	const selectedConv = useChatStore((s) => {
		const convs = s.conversations;
		return (
			convs.find((c) => c.chatConversationId === s.selectedConvId) ?? null
		);
	});
	const ui = useChatUI();
	const actions = useChatActions();

	const displayName =
		selectedConvDetails?.chatConversationName ||
		selectedConv?.chatConversationName ||
		selectedConv?.otherParticipantName ||
		'Conversation';
	const avatarUrl =
		selectedConvDetails?.chatConversationAvatar ||
		selectedConv?.otherParticipantAvatar;
	const isGroupChat =
		selectedConvDetails?.chatConversationType === 'GROUP' ||
		selectedConv?.chatConversationType === 'GROUP';
	const avatarFallback = isGroupChat
		? null
		: selectedConvDetails?.chatConversationName?.charAt(0) ||
		selectedConv?.otherParticipantName?.charAt(0) ||
		displayName.charAt(0);

	const participants = selectedConvDetails?.chatConversationParticipants;

	const getParticipantStatusText = (
		participants: ChatConversationParticipant[] | undefined,
		currentUserId: number | null
	): string => {
		if (!participants || !participants.length) return '';

		const otherParticipants = participants.filter(
			(p) => p.participantId !== currentUserId
		);
		const isGroup = otherParticipants.length > 1;

		if (isGroup) {
			const onlineCount = otherParticipants.filter(
				(p) => p.chatParticipantCurrentStatus === 'ONLINE'
			).length;
			return `${otherParticipants.length} members${onlineCount > 0 ? `, ${onlineCount} online` : ''}`;
		}

		const other = otherParticipants[0];
		if (!other) return '';

		switch (other.chatParticipantCurrentStatus) {
			case 'ONLINE':
				return 'Online';
			case 'AWAY':
				return 'Away';
			case 'OFFLINE':
				if (other.lastSeenAt) {
					const lastSeen = new Date(other.lastSeenAt);
					const now = new Date();
					const diffMs = now.getTime() - lastSeen.getTime();
					const diffMins = Math.floor(diffMs / 60000);
					const diffHours = Math.floor(diffMins / 60);
					const diffDays = Math.floor(diffHours / 24);

					if (diffMins < 1) return 'Last seen just now';
					if (diffMins < 60) return `Last seen ${diffMins}m ago`;
					if (diffHours < 24) return `Last seen ${diffHours}h ago`;
					if (diffDays < 7) return `Last seen ${diffDays}d ago`;
					return `Last seen ${lastSeen.toLocaleDateString()}`;
				}
				return 'Offline';
			default:
				return 'Offline';
		}
	};

	const statusText = getParticipantStatusText(participants, userId ?? null);

	const isDetailsOpen = ui.isConversationDetailsOpen;

	return (
		<div
			className={cn(
				'flex items-center gap-3 p-3 border-b transition-colors',
				isDetailsOpen
					? 'bg-muted/30'
					: 'cursor-pointer hover:bg-muted/50'
			)}
			onClick={() => {
				if (!isDetailsOpen) {
					actions.setIsConversationDetailsOpen(true);
				}
			}}
		>
			{isDetailsOpen ? (
				<div className="flex items-center gap-1 w-full">
					<button
						onClick={(e) => {
							e.stopPropagation();
							actions.setIsConversationDetailsOpen(false);
						}}
						className="p-2 rounded-full hover:bg-muted transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
					<h2 className="text-md font-semibold">Conversation Details</h2>
				</div>
			) : (
				<>
					<div className="relative shrink-0">
						<Avatar className="h-10 w-10">
							<AvatarImage src={avatarUrl} />
							<AvatarFallback
								className={isGroupChat ? 'bg-primary/10' : ''}
							>
								{isGroupChat ? (
									<Users className="h-5 w-5 text-primary" />
								) : (
									avatarFallback
								)}
							</AvatarFallback>
						</Avatar>
						{participants && participants.length <= 2 && (
							<span
								className={cn(
									'absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background',
									participants.some(
										(p) =>
											p.participantId !== userId &&
											p.chatParticipantCurrentStatus ===
											'ONLINE'
									)
										? 'bg-green-500'
										: participants.some(
											(p) =>
												p.participantId !== userId &&
												p.chatParticipantCurrentStatus ===
												'AWAY'
										)
											? 'bg-yellow-500'
											: 'bg-gray-400'
								)}
							/>
						)}
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between gap-2">
							<div className="">
								<div className="flex items-center gap-2 min-w-0">
									<h3 className="font-semibold truncate">
										{displayName}
									</h3>
									{selectedConvDetails?.isInterOrg && (
										<Badge
											variant="secondary"
											className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
										>
											Inter-org
										</Badge>
									)}
								</div>

								<p className="text-xs text-muted-foreground truncate">
									{statusText ||
										selectedConvDetails?.chatConversationDescription ||
										'No status available'}
								</p>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
									<Button
										size="icon"
										variant="outline"
										className="h-9 w-9"
										aria-label="Conversation options"
									>
										<IconDotsVertical className="h-5 w-5" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-56" align="end" onClick={(e) => e.stopPropagation()}>
									<DropdownMenuItem
										onClick={() =>
											actions.clearChatForSelf(
												selectedConvDetails!
													.chatConversationId,
												userId!,
												orgId!
											)
										}
										disabled={ui.isClearingChat}
										className="flex items-center gap-2"
									>
										{ui.isClearingChat ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<MessageSquare className="h-4 w-4" />
										)}
										Clear Chat (Self)
									</DropdownMenuItem>
									{(selectedConvDetails?.chatConversationParticipants?.find(
										(p) => p.participantId === userId
									)?.isAdmin ||
										selectedConvDetails?.chatConversationParticipants?.find(
											(p) => p.participantId === userId
										)?.isChatCreator) && (
											<DropdownMenuItem
												onClick={() =>
													actions.setIsDeleteDialogOpen(true)
												}
												disabled={ui.isDeletingConversation}
												className="flex items-center gap-2 text-destructive"
											>
												{ui.isDeletingConversation ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Trash2 className="h-4 w-4" />
												)}
												{selectedConvDetails?.chatConversationType ===
													'GROUP'
													? 'Delete Group'
													: 'Delete Conversation'}
											</DropdownMenuItem>
										)}
									<DropdownMenuItem
										onClick={() =>
											actions.downloadChat(
												selectedConvDetails!
													.chatConversationId,
												userId!,
												orgId!
											)
										}
										disabled={ui.isDownloadingChat}
										className="flex items-center gap-2"
									>
										{ui.isDownloadingChat ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Download className="h-4 w-4" />
										)}
										Download Chat
									</DropdownMenuItem>
									{selectedConvDetails?.chatConversationType ===
										'GROUP' &&
										(selectedConvDetails?.chatConversationParticipants?.find(
											(p) => p.participantId === userId
										)?.isAdmin ||
											selectedConvDetails?.chatConversationParticipants?.find(
												(p) => p.participantId === userId
											)?.isChatCreator) && (
											<DropdownMenuItem
												onClick={() =>
													actions.setIsManageGroupOpen(
														true
													)
												}
												className="flex items-center gap-2"
											>
												<Users className="h-4 w-4" />
												Edit Group Info
											</DropdownMenuItem>
										)}
									<DropdownMenuItem
										onClick={() =>
											actions.setIsSearchInChatOpen(true)
										}
										className="flex items-center gap-2"
									>
										<Search className="h-4 w-4" />
										Search in Chat
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => {
											const scrollArea =
												document.querySelector(
													'[data-messages-scroll]'
												);
											const viewport =
												scrollArea?.querySelector(
													'[data-slot="scroll-area-viewport"]'
												);
											if (viewport) {
												viewport.scrollTo({
													top: 0,
													behavior: 'smooth',
												});
											}
										}}
										className="flex items-center gap-2"
									>
										<ArrowUpToLine className="h-4 w-4" />
										Go to First Message
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</>
			)}
		</div>
	);
}