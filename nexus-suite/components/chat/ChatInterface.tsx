'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { chatService } from '@/lib/services';
import type { ChatConversation, User } from '@/types/chat';
import { Flag, MessageCircle, Pin, X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

import {
    useChatActions,
    useChatStore,
    useChatUI,
    useConversations,
    useMessages,
    useSelectedConvDetails,
    useSelectedConvId,
} from '@/store/chatStore';

import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { ChatMessages } from './ChatMessages';
import { ChatSidebar } from './ChatSidebar';
import { DeleteConversationDialog } from './DeleteConversationDialog';
import { DeleteMessageDialog } from './DeleteMessageDialog';
import { ManageGroupDialog } from './ManageGroupDialog';
import { SearchInChatDialog } from './SearchInChatDialog';
import { TypingIndicator } from './TypingIndicator';

export function ChatInterface({
	initialConversationId,
}: {
	initialConversationId?: number | null;
}) {
	const {
		userId: userIdStr,
		orgId: orgIdStr,
		name: userName,
		avatar: userAvatar,
	} = useUserMetadata();
	const userId = userIdStr ? Number(userIdStr) : null;
	const orgId = orgIdStr ? Number(orgIdStr) : null;
	const { toast } = useToast();

	// State from store
	const conversations = useConversations();
	const selectedConvId = useSelectedConvId();
	const selectedConvDetails = useSelectedConvDetails();
	const selectedConv = conversations.find(c => c.chatConversationId === selectedConvId) ?? null;
	const messages = useMessages();
	const pinnedMessages = messages.filter((m) => m.isPinned);

	const ui = useChatUI();
	const actions = useChatActions();

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const chatMessagesRef = useRef<{
		scrollToMessage: (messageId: number) => void;
	} | null>(null);

	// Initialize on mount
	useEffect(() => {
		if (initialConversationId) {
			actions.setSelectedConvId(initialConversationId);
		}
		if (userId && orgId) {
			actions.loadConversations(userId, orgId);
			actions.connectWebSocket(userId, orgId);
		}
	}, [initialConversationId, userId, orgId, actions]);

	// Load messages when conversation changes
	useEffect(() => {
		if (selectedConvId && userId && orgId) {
			actions.loadMessages(selectedConvId, userId, orgId);
			actions.loadConversationDetails(selectedConvId, userId, orgId);
			// Reset details view when switching conversations (show chat, not details)
			actions.setIsConversationDetailsOpen(false);
			const cleanup = actions.setupSubscriptions(
				selectedConvId,
				userId,
				orgId
			);
			return cleanup;
		}
	}, [selectedConvId, userId, orgId, actions]);

	// Heartbeat
	useEffect(() => {
		if (!ui.wsConnected || !userId) return;
		const send = () => actions.sendHeartbeat(userId);
		send();
		const interval = setInterval(send, 20000);
		return () => clearInterval(interval);
	}, [ui.wsConnected, userId, actions]);

	// Scroll to bottom on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	// Update unread count periodically
	useEffect(() => {
		if (!userId || !orgId) return;
		const interval = setInterval(async () => {
			try {
				const fresh = await chatService.getConversations(userId, orgId);
				const prevMap = new Map(
					conversations.map((c) => [c.chatConversationId, c])
				);
				const updated = fresh.map((c: ChatConversation) => {
					const old = prevMap.get(c.chatConversationId);
					if (!old) return c;
					const hadNew =
						!!c.lastMessageAt &&
						!!old.lastMessageAt &&
						new Date(c.lastMessageAt).getTime() >
						new Date(old.lastMessageAt).getTime();
					return {
						...c,
						unreadCount: hadNew
							? (old.unreadCount ?? 0) + 1
							: selectedConvId === c.chatConversationId
								? 0
								: (old.unreadCount ?? c.unreadCount ?? 0),
					};
				});
				actions.setConversations(updated);
			} catch {
				// ignore
			}
		}, 5000);
		return () => clearInterval(interval);
	}, [userId, orgId, conversations, selectedConvId, actions]);

	// Global conversation subscriptions
	useEffect(() => {
		if (!ui.wsConnected) return;
		const ids = conversations
			.map((c) => c.chatConversationId)
			.sort((a, b) => a - b);
		const unsubs = chatService.subscribeToGlobalConversations(
			ids,
			(evt: {
				conversationId: number;
				lastMessage?: string;
				lastMessageAt?: string;
				senderId?: number | null;
			}) => {
				actions.updateConversation(evt.conversationId, {
					lastMessage: evt.lastMessage,
					lastMessageAt: evt.lastMessageAt,
					lastMessageSenderId: evt.senderId ?? undefined,
					unreadCount:
						evt.conversationId !== selectedConvId &&
							evt.senderId != null &&
							evt.senderId !== userId
							? (conversations.find(
								(c) =>
									c.chatConversationId ===
									evt.conversationId
							)?.unreadCount ?? 0) + 1
							: undefined,
				});
			}
		);
		return () =>
			unsubs.forEach((unsub) => {
				try {
					unsub();
				} catch { }
			});
	}, [ui.wsConnected, conversations, selectedConvId, userId, actions]);

	const handleCreateDirectChat = useCallback(
		async (targetUser: User) => {
			if (!userId || !orgId) return;
			const conv = await actions.createDirectConversation(
				targetUser,
				userId,
				orgId,
				userName,
				userAvatar
			);
			if (conv) {
				actions.setSelectedConvId(conv.chatConversationId);
				toast({ title: `Chat started with ${targetUser.name}` });
			} else {
				toast({
					title: 'Failed to start chat',
					variant: 'destructive',
				});
			}
		},
		[userId, orgId, userName, userAvatar, actions, toast]
	);

	const getOrgBadgeColor = (orgType?: string) => {
		switch (orgType?.toUpperCase()) {
			case 'RETAILER':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
			case 'SUPPLIER':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'LOGISTICS':
				return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
		}
	};

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
		<div className="flex w-full h-full">
			{/* Sidebar - Conversation List */}
			<ChatSidebar
				conversations={conversations}
				isLoadingConvs={useChatStore.getState().isLoadingConvs}
				selectedConvId={selectedConvId}
				onSelectConversation={actions.setSelectedConvId}
				onStartDirectChat={handleCreateDirectChat}
			/>

			{/* Main Chat Area */}
			<div className="flex-1 flex flex-col border rounded-r-lg overflow-hidden">
				{selectedConvId ? (
					<>
						<ChatHeader />

						{ui.isConversationDetailsOpen ? (
							<div className="flex-1 overflow-y-auto">
								<div className=" mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
									

									{/* Cover / Avatar area */}
									<div className="flex items-center gap-4 p-6">
										<div className="animate-in zoom-in-50 fade-in duration-300 delay-150">
											<Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
												<AvatarImage src={selectedConvDetails?.chatConversationAvatar || selectedConv?.otherParticipantAvatar} />
												<AvatarFallback className="text-2xl bg-primary/10 text-primary">
													{selectedConvDetails?.chatConversationName?.charAt(0) || selectedConv?.otherParticipantName?.charAt(0) || '?'}
												</AvatarFallback>
											</Avatar>
										</div>
										{/* Name & Type */}
										<div>
											<h3 className="text-2xl font-bold animate-in fade-in slide-in-from-left-2 duration-300 delay-300">
												{selectedConvDetails?.chatConversationName || selectedConv?.chatConversationName || selectedConv?.otherParticipantName || 'Conversation'}
											</h3>
											<div className="flex items-center gap-2 mt-1">
												<Badge variant="secondary" className="text-xs">
													{selectedConvDetails?.chatConversationType || 'Direct'}
												</Badge>
												{selectedConvDetails?.isInterOrg && (
													<Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
														Inter-org
													</Badge>
												)}
											</div>
											{selectedConvDetails?.chatConversationDescription && (
												<p className="text-sm text-muted-foreground mt-2">
													{selectedConvDetails.chatConversationDescription}
												</p>
											)}
										</div>
									</div>

									<div className=" px-6 pb-6 space-y-6">

										<Separator />

										{/* Participants */}
										<div className="space-y-3">
											<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
												Participants ({selectedConvDetails?.chatConversationParticipants?.length || 0})
											</h4>
											<div className="space-y-2">
												{selectedConvDetails?.chatConversationParticipants?.map((p) => (
													<div key={p.participantId} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
														<Avatar className="h-10 w-10">
															<AvatarImage src={p.participantAvatar} />
															<AvatarFallback>{(p.participantName || '?').charAt(0)}</AvatarFallback>
														</Avatar>
														<div className="flex-1 min-w-0">
															<p className="text-sm font-medium truncate">{p.participantName || 'Unknown'}</p>
															<p className="text-xs text-muted-foreground truncate">{p.participantEmail || ''}</p>
														</div>
														<div className="flex items-center gap-1">
															{p.isAdmin && <Badge variant="secondary" className="text-xs">Admin</Badge>}
															{p.isChatCreator && <Badge variant="outline" className="text-xs">Creator</Badge>}
															{p.chatParticipantCurrentStatus === 'ONLINE' && (
																<span className="h-2.5 w-2.5 rounded-full bg-green-500" />
															)}
														</div>
													</div>
												))}
											</div>
										</div>

										{/* Pinned Messages */}
										{pinnedMessages.length > 0 && (
											<div className="space-y-3">
												<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
													<Flag className="h-4 w-4" />
													Pinned Messages ({pinnedMessages.length})
												</h4>
												<div className="space-y-2">
													{pinnedMessages.map((msg) => (
														<button
															key={msg.chatMessageId}
															onClick={() => {
																actions.setIsConversationDetailsOpen(false);
																setTimeout(() => chatMessagesRef.current?.scrollToMessage(msg.chatMessageId), 100);
															}}
															className="w-full text-left p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
														>
															<p className="text-sm line-clamp-2">{msg.chatMessageText}</p>
															<p className="text-xs text-muted-foreground mt-1">
																{msg.chatConversationParticipant?.participantName || 'Unknown'} &middot; {new Date(msg.sentAt).toLocaleDateString()}
															</p>
														</button>
													))}
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						) : (
							<>
								{/* Pinned Messages Bar */}
								{pinnedMessages.length > 0 && (
									<div className="border-b bg-yellow-50/50 dark:bg-yellow-900/10 p-2">
										<div className="flex items-center gap-2">
											<Flag className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
											<span className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
												Pinned Messages
											</span>
											<div className="flex-1 h-px bg-yellow-200/50 dark:bg-yellow-800/50" />
										</div>
										<div className="flex gap-2 overflow-x-auto pb-2 mt-1">
											{pinnedMessages.map((msg) => (
												<div
													key={msg.chatMessageId}
													className="flex items-center rounded-lg bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-800 text-xs text-yellow-900 dark:text-yellow-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-colors whitespace-nowrap shrink-0"
												>
													<button
														type="button"
														aria-label={`Jump to pinned message: ${msg.chatMessageText?.slice(0, 50) ?? ''}`}
														onClick={() =>
															chatMessagesRef.current?.scrollToMessage(
																msg.chatMessageId
															)
														}
														className="flex items-center gap-1 px-3 py-1.5"
													>
														<Pin className="h-3 w-3 shrink-0" />
														<span className="truncate max-w-50">
															{msg.chatMessageText?.slice(
																0,
																50
															)}
															...
														</span>
													</button>
													<button
														type="button"
														aria-label="Unpin message"
														onClick={async (e) => {
															if (userId && orgId) {
																try {
																	await actions.pinMessage(
																		selectedConvId!,
																		msg.chatMessageId,
																		userId,
																		orgId,
																		true
																	);
																} catch (err) {
																	toast({
																		title: 'Failed to unpin message',
																		description:
																			err instanceof
																				Error
																				? err.message
																				: 'Unknown error',
																		variant:
																			'warning',
																	});
																}
															}
														}}
														className="ml-1 p-0.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded text-yellow-600 dark:text-yellow-400"
													>
														<X className="h-3 w-3" />
													</button>
												</div>
											))}
										</div>
									</div>
								)}

								<ChatMessages
									ref={chatMessagesRef}
									getOrgBadgeColor={getOrgBadgeColor}
								/>

								<TypingIndicator />

								<ChatInput />
							</>
						)}
					</>
				) : (
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center">
							<MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<p className="text-muted-foreground">
								Select a conversation or start a new chat
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Manage Group Dialog */}
			<ManageGroupDialog />

			{/* Search in Chat Dialog */}
			<SearchInChatDialog />

			{/* Delete Message Confirmation Dialog */}
			<DeleteMessageDialog />

			{/* Delete Conversation Dialog */}
			<DeleteConversationDialog />
		</div>
	);
}
