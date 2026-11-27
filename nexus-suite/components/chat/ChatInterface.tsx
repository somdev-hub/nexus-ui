"use client";

import { useToast } from "@/hooks/use-toast";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { chatService } from "@/lib/services";
import type { ChatConversation, ChatMessage } from "@/types/chat";
import { Flag, MessageCircle, Pin, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";
import { ChatSidebar } from "./ChatSidebar";
import { DeleteConversationDialog } from "./DeleteConversationDialog";
import { DeleteMessageDialog } from "./DeleteMessageDialog";
import { ManageGroupDialog } from "./ManageGroupDialog";
import { SearchInChatDialog } from "./SearchInChatDialog";
import { TypingIndicator } from "./TypingIndicator";

export function ChatInterface({ initialConversationId }: { initialConversationId?: number | null }) {
	const { userId: userIdStr, orgId: orgIdStr, name: userName, avatar: userAvatar } = useUserMetadata();
	const userId = userIdStr ? Number(userIdStr) : null;
	const orgId = orgIdStr ? Number(orgIdStr) : null;
	const { toast } = useToast();

	const [conversations, setConversations] = useState<ChatConversation[]>([]);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isLoadingConvs, setIsLoadingConvs] = useState(true);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);
	const [newMessage, setNewMessage] = useState("");
	const [isSending, setIsSending] = useState(false);

	const [isManageGroupOpen, setIsManageGroupOpen] = useState(false);
	const [isSearchInChatOpen, setIsSearchInChatOpen] = useState(false);
	const [searchQueryInChat, setSearchQueryInChat] = useState("");
	const [searchResultsInChat, setSearchResultsInChat] = useState<ChatMessage[]>([]);
	const [isSearchingInChat, setIsSearchingInChat] = useState(false);

	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isClearingChat, setIsClearingChat] = useState(false);
	const [isDeletingConversation, setIsDeletingConversation] = useState(false);
	const [isDownloadingChat, setIsDownloadingChat] = useState(false);

	const [selectedConvId, setSelectedConvId] = useState<number | null>(() => initialConversationId ?? null);
	const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
	const [messageActionMenuId, setMessageActionMenuId] = useState<number | null>(null);
	const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
	const [replyMap, setReplyMap] = useState<Map<number, number>>(new Map());
	const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
	const [isDeleteMessageDialogOpen, setIsDeleteMessageDialogOpen] = useState(false);

	const [wsConnected, setWsConnected] = useState(false);
	const [typingUsers, setTypingUsers] = useState<number[]>([]);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const chatMessagesRef = useRef<{ scrollToMessage: (messageId: number) => void } | null>(null);

	const [selectedConvDetailsState, setSelectedConvDetails] = useState<ChatConversation | null>(null);
	const selectedConvDetails = selectedConvId ? selectedConvDetailsState : null;
	const selectedConvDetailsRef = useRef<ChatConversation | null>(null);
	useEffect(() => { selectedConvDetailsRef.current = selectedConvDetails; }, [selectedConvDetails]);
	const selectedConvIdRef = useRef<number | null>(null);
	useEffect(() => { selectedConvIdRef.current = selectedConvId; }, [selectedConvId]);
	const convSubsRef = useRef<Map<number, () => void>>(new Map());

	const firstUnreadIndex = useMemo(() => {
		const idx = messages.findIndex((m) => {
			const isMe = m.chatConversationParticipant?.participantId === userId;
			if (isMe) return false;
			return !(m.messageSeenByList && m.messageSeenByList.some((s) => s.participantId === userId));
		});
		return idx;
	}, [messages, userId]);

	// WebSocket connection lifecycle
	useEffect(() => {
		if (!userId || !orgId) return;
		let active = true;
		chatService
			.connectWebSocket({
				onConnect: () => { if (active) setWsConnected(true); },
				onDisconnect: () => { if (active) setWsConnected(false); },
				onError: (err) => { if (active) console.error("[CHAT WS] error:", err); },
			})
			.then(() => { if (active) setWsConnected(true); })
			.catch((e) => { if (active) { setWsConnected(false); console.error("[CHAT WS] connect failed:", e); } });
		return () => {
			active = false;
			chatService.disconnectWebSocket();
			setWsConnected(false);
		};
	}, [userId, orgId]);

	useEffect(() => {
		if (!userId || !orgId) return;
		const load = async () => {
			setIsLoadingConvs(true);
			try {
				const convs = await chatService.getConversations(userId, orgId);
				setConversations(convs);
			} catch (e) {
				console.error("Failed to load conversations:", e);
			} finally {
				setIsLoadingConvs(false);
			}
		};
		load();
	}, [userId, orgId]);

	useEffect(() => {
		if (!selectedConvId || !userId || !orgId) return;
		const load = async () => {
			setIsLoadingMessages(true);
			try {
				const msgs = await chatService.getMessages(selectedConvId, userId, orgId);
				setMessages([...msgs].reverse());
				setConversations((prev) =>
					prev.map((c) =>
						c.chatConversationId === selectedConvId ? { ...c, unreadCount: 0 } : c
					)
				);
			} catch (e) {
				console.error("Failed to load messages:", e);
			} finally {
				setIsLoadingMessages(false);
			}
		};
		load();
	}, [selectedConvId, userId, orgId, selectedConvDetails]);

	useEffect(() => {
		if (!selectedConvId || !userId || !orgId) return;
		const loadDetails = async () => {
			try {
				const details = await chatService.getConversationDetails(selectedConvId, userId, orgId);
				try {
					const ids = details.chatConversationParticipants?.map((p) => p.participantId) ?? [];
					if (ids.length) {
						const statuses = await chatService.getPresenceStatuses(ids);
						details.chatConversationParticipants = details.chatConversationParticipants?.map((p) => ({
							...p,
							chatParticipantCurrentStatus: statuses[p.participantId] ? "ONLINE" : (p.chatParticipantCurrentStatus || "OFFLINE"),
						}));
					}
				} catch (e) {
					console.warn("Failed to fetch presence statuses", e);
				}
				setSelectedConvDetails(details);
			} catch (e) {
				const axiosError = e as { response?: { data: unknown; status: number }; message?: string };
				console.error("Failed to load conversation details:", axiosError);
				const fullError = axiosError.response?.data
					? JSON.stringify(axiosError.response.data, null, 2)
					: axiosError.message || "Unknown error";
				toast({
					title: "Failed to load conversation details",
					description: fullError,
					variant: "destructive"
				});
				setSelectedConvDetails(null);
			}
		};
		loadDetails();
	}, [selectedConvId, userId, orgId, toast]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		if (!wsConnected) return;
		const unsub = chatService.subscribeToPresence((evt) => {
			setSelectedConvDetails((prev) => {
				if (!prev?.chatConversationParticipants) return prev;
				const updated = prev.chatConversationParticipants.map((p) =>
					p.participantId === evt.userId
						? { ...p, chatParticipantCurrentStatus: evt.status, lastSeenAt: evt.at || p.lastSeenAt }
						: p
				);
				return { ...prev, chatConversationParticipants: updated };
			});
		});
		return () => unsub();
	}, [wsConnected]);

	useEffect(() => {
		if (!wsConnected || !userId) return;
		const send = () => chatService.sendHeartbeat(userId);
		send();
		const interval = setInterval(send, 20000);
		return () => clearInterval(interval);
	}, [wsConnected, userId]);

	useEffect(() => {
		if (!wsConnected || !selectedConvId) return;

		const unsubMsg = chatService.subscribeToConversationMessages(selectedConvId, (m) => {
			if (!m || typeof m.chatMessageId !== "number") return;
			const senderParticipantId = m.chatConversationParticipant?.participantId;
			if (senderParticipantId && senderParticipantId !== userId) {
				chatService.acknowledgeMessage(m.chatMessageId);
			}
			const normalized: ChatMessage = {
				chatMessageId: m.chatMessageId,
				chatMessageText: m.chatMessageText,
				chatMessageType: m.chatMessageType || "TEXT",
				chatMessageStatus: m.chatMessageStatus || "SENT",
				sentAt: m.sentAt,
				deliveredAt: m.deliveredAt,
				receivedAt: m.receivedAt,
				updatedAt: m.updatedAt || m.sentAt,
				isEdited: false,
				chatConversationParticipant: m.chatConversationParticipant
					? {
						chatConversationParticipantsId: 0,
						participantId: m.chatConversationParticipant.participantId,
						participantName: m.chatConversationParticipant.participantName,
						participantEmail: m.chatConversationParticipant.participantEmail || "",
						participantMob: "",
						participantRole: "",
						participantAvatar: m.chatConversationParticipant.participantAvatar,
						isChatCreator: false,
						chatParticipantType: "DIRECT",
						joinedAt: "",
						lastSeenAt: "",
						chatParticipantStatus: "JOINED",
						chatParticipantCurrentStatus: "OFFLINE",
						lastRead: "",
						updatedAt: "",
						isActive: true,
					}
					: undefined,
				chatMessageAttachmentList: m.chatMessageAttachmentList || [],
				chatMessageIndividualStatuses: [],
				messageSeenByList: m.messageSeenByList,
			} as ChatMessage;
			setMessages((prev) => (prev.some((x) => x.chatMessageId === normalized.chatMessageId) ? prev : [...prev, normalized]));
			setConversations((prev) =>
				prev.map((c) =>
					c.chatConversationId === selectedConvId
						? { ...c, lastMessage: normalized.chatMessageText || String(normalized.chatMessageType), lastMessageAt: normalized.sentAt, lastMessageSenderId: normalized.chatConversationParticipant?.participantId }
						: c
				)
			);
		});

		const unsubTyping = chatService.subscribeToTyping(selectedConvId, (evt) => {
			const typingUserId = evt.userId;
			if (typeof typingUserId !== "number" || typingUserId === userId) return;
			setTypingUsers((prev) => {
				if (evt.isTyping) return prev.includes(typingUserId) ? prev : [...prev, typingUserId];
				return prev.filter((id) => id !== typingUserId);
			});
			if (evt.isTyping) {
				setTimeout(() => setTypingUsers((prev) => prev.filter((id) => id !== typingUserId)), 6000);
			}
		});

		const unsubStatus = chatService.subscribeToStatusUpdates(selectedConvId, (evt) => {
			const msgId = evt.messageId;
			const otherParticipants = (selectedConvDetailsRef.current?.chatConversationParticipants ?? []).filter((p) => p.participantId !== userId);
			setMessages((prev) =>
				prev.map((m) => {
					if (m.chatMessageId > msgId) return m;
					const seenBy = m.messageSeenByList && m.messageSeenByList.length
						? m.messageSeenByList
						: otherParticipants.map((p) => ({
							participantId: p.participantId,
							participantName: p.participantName,
							participantAvatar: p.participantAvatar,
						}));
					return { ...m, chatMessageStatus: evt.status, messageSeenByList: seenBy };
				})
			);
		});

		const unsubDeleted = chatService.subscribeToMessageDeleted(selectedConvId, (evt) => {
			if (evt.deleteForEveryone) {
				setMessages((prev) =>
					prev.map((m) =>
						m.chatMessageId === evt.messageId
							? { ...m, chatMessageText: "This message has been deleted", isDeleted: true, deletedForEveryone: true }
							: m
					)
				);
			}
		});

		const unsubPin = chatService.subscribeToPinEvents(selectedConvId, (evt) => {
			setMessages((prev) =>
				prev.map((m) =>
					m.chatMessageId === evt.messageId
						? { ...m, isPinned: evt.isPinned }
						: m
				)
			);
		});

		return () => {
			unsubMsg();
			unsubTyping();
			unsubStatus();
			unsubDeleted();
			unsubPin();
		};
	}, [wsConnected, selectedConvId, userId]);

	useEffect(() => {
		if (!userId || !orgId) return;
		const interval = setInterval(async () => {
			try {
				const fresh = await chatService.getConversations(userId, orgId);
				setConversations((prev) => {
					const prevMap = new Map(prev.map((c) => [c.chatConversationId, c]));
					return fresh.map((c) => {
						const old = prevMap.get(c.chatConversationId);
						if (!old) return c;
						const hadNew =
							!!c.lastMessageAt &&
							!!old.lastMessageAt &&
							new Date(c.lastMessageAt).getTime() > new Date(old.lastMessageAt).getTime();
						return {
							...c,
							unreadCount: hadNew
								? (old.unreadCount ?? 0) + 1
								: selectedConvIdRef.current === c.chatConversationId
									? 0
									: (old.unreadCount ?? c.unreadCount ?? 0),
						};
					});
				});
			} catch {
				// ignore
			}
		}, 5000);
		return () => clearInterval(interval);
	}, [userId, orgId]);

	useEffect(() => {
		if (!wsConnected) return;
		const ids = conversations.map((c) => c.chatConversationId).sort((a, b) => a - b);
		const subsSnapshot = convSubsRef.current;
		const unsubs = chatService.subscribeToGlobalConversations(ids, (evt) => {
			setConversations((prev) => {
				const idx = prev.findIndex((c) => c.chatConversationId === evt.conversationId);
				if (idx === -1) return prev;
				const updated = [...prev];
				const conv = { ...updated[idx] };
				if (evt.lastMessage) conv.lastMessage = evt.lastMessage;
				if (evt.lastMessageAt) conv.lastMessageAt = evt.lastMessageAt;
				if (evt.senderId != null) conv.lastMessageSenderId = evt.senderId;
				if (evt.conversationId !== selectedConvIdRef.current && evt.senderId != null && evt.senderId !== userId) {
					conv.unreadCount = (conv.unreadCount ?? 0) + 1;
				}
				updated.splice(idx, 1);
				updated.unshift(conv);
				return updated;
			});
		});
		unsubs.forEach((unsub, index) => {
			convSubsRef.current.set(ids[index], unsub);
		});
		return () => {
			for (const [id, unsub] of Array.from(subsSnapshot.entries())) {
				if (!ids.includes(id)) {
					try { unsub(); } catch { /* ignore */ }
					subsSnapshot.delete(id);
				}
			}
		};
	}, [wsConnected, selectedConvId, userId, conversations]);

	const handleClearChat = useCallback(async () => {
		if (!selectedConvId || !orgId || !userId) return;
		setIsClearingChat(true);
		try {
			await chatService.clearChatForSelf(selectedConvId, userId, orgId);
			const msgs = await chatService.getMessages(selectedConvId, userId, orgId);
			setMessages([...msgs].reverse());
			toast({ title: "Chat cleared for you" });
		} catch (e: unknown) {
			toast({ title: "Failed to clear chat", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
		} finally {
			setIsClearingChat(false);
		}
	}, [selectedConvId, orgId, userId, toast]);

	const handleDeleteConversation = useCallback(async () => {
		if (!selectedConvId || !orgId || !userId) return;
		setIsDeletingConversation(true);
		try {
			await chatService.deleteConversation(selectedConvId, userId, orgId);
			setConversations((prev) => prev.filter((c) => c.chatConversationId !== selectedConvId));
			setSelectedConvId(null);
			setSelectedConvDetails(null);
			setMessages([]);
			toast({ title: "Conversation deleted" });
		} catch (e: unknown) {
			toast({ title: "Failed to delete conversation", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
		} finally {
			setIsDeletingConversation(false);
			setIsDeleteDialogOpen(false);
		}
	}, [selectedConvId, orgId, userId, toast]);

	const handleDownloadChat = useCallback(async () => {
		if (!selectedConvId || !orgId || !userId) return;
		setIsDownloadingChat(true);
		try {
			const blob = await chatService.downloadChat(selectedConvId, userId, orgId);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `chat-${selectedConvId}.txt`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast({ title: "Chat downloaded" });
		} catch (e: unknown) {
			toast({ title: "Failed to download chat", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
		} finally {
			setIsDownloadingChat(false);
		}
	}, [selectedConvId, orgId, userId, toast]);

	const handleSearchInChat = useCallback(async () => {
		if (!selectedConvId || !orgId || !userId || !searchQueryInChat.trim()) return;
		setIsSearchingInChat(true);
		try {
			const results = await chatService.searchMessages(selectedConvId, userId, orgId, searchQueryInChat);
			setSearchResultsInChat(results);
		} catch (e: unknown) {
			toast({ title: "Search failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
		} finally {
			setIsSearchingInChat(false);
		}
	}, [selectedConvId, orgId, userId, searchQueryInChat, toast]);

	const handleCancelReply = useCallback(() => {
		setReplyingTo(null);
	}, []);

	const handleReplyMessage = useCallback((message: ChatMessage) => {
		setReplyingTo(message);
		setMessageActionMenuId(null);
	}, []);

	const handlePinMessage = useCallback(async (messageId: number) => {
		if (!selectedConvId || !orgId || !userId) return;
		const message = messages.find(m => m.chatMessageId === messageId);
		const isPinned = message?.isPinned || false;

		try {
			if (isPinned) {
				await chatService.unpinMessage(selectedConvId, messageId, userId, orgId);
				toast({ title: "Message unpinned" });
			} else {
				await chatService.pinMessage(selectedConvId, messageId, userId, orgId);
				toast({ title: "Message pinned" });
			}
			setMessageActionMenuId(null);
		} catch (e: unknown) {
			console.error("Failed to pin/unpin message:", e);
			toast({ title: "Failed to update pin", variant: "destructive" });
		}
	}, [selectedConvId, orgId, userId, toast, messages]);

	const handleDeleteMessage = useCallback((message: ChatMessage) => {
		setMessageToDelete(message);
		setIsDeleteMessageDialogOpen(true);
		setMessageActionMenuId(null);
	}, []);

	const handleConfirmDeleteMessage = useCallback(async (deleteForEveryone: boolean) => {
		if (!messageToDelete || !selectedConvId || !orgId || !userId) return;
		try {
			await chatService.deleteMessage(selectedConvId, messageToDelete.chatMessageId, userId, orgId, deleteForEveryone);
			if (deleteForEveryone) {
				setMessages((prev) =>
					prev.map((m) =>
						m.chatMessageId === messageToDelete.chatMessageId
							? { ...m, chatMessageText: "This message has been deleted", isDeleted: true, deletedForEveryone: true }
							: m
					)
				);
			} else {
				setMessages((prev) => prev.filter((m) => m.chatMessageId !== messageToDelete.chatMessageId));
			}
			toast({ title: deleteForEveryone ? "Message deleted for everyone" : "Message deleted for you" });
		} catch (e: unknown) {
			toast({ title: "Failed to delete message", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
		} finally {
			setIsDeleteMessageDialogOpen(false);
			setMessageToDelete(null);
		}
	}, [messageToDelete, selectedConvId, orgId, userId, toast]);

	const handleCopyMessage = useCallback(async (text: string) => {
		try {
			if (navigator?.clipboard?.writeText) {
				await navigator.clipboard.writeText(text);
			} else {
				const ta = document.createElement("textarea");
				ta.value = text;
				document.body.appendChild(ta);
				ta.select();
				document.execCommand("copy");
				document.body.removeChild(ta);
			}
			toast({ title: "Copied to clipboard" });
		} catch (e) {
			console.error("Copy failed:", e);
			toast({ title: "Failed to copy", variant: "destructive" });
		}
	}, [toast]);

	const handleSendMessage = useCallback(async () => {
		if (!newMessage.trim() || !selectedConvId || !userId) return;
		setIsSending(true);
		try {
			const msg = await chatService.sendMessage(
				{
					chatConversationId: selectedConvId,
					participantId: userId,
					chatMessageText: newMessage,
					chatMessageType: "TEXT",
					chatMessageAttachmentList: [],
					clientMessageId: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
					...(replyingTo && { chatMessageId: replyingTo.chatMessageId }),
				},
				undefined,
				orgId ?? undefined
			);
			setMessages(prev => (prev.some((m) => m.chatMessageId === msg.chatMessageId) ? prev : [...prev, msg]));
			setNewMessage("");
			if (replyingTo) {
				setReplyMap(prev => {
					const next = new Map(prev);
					next.set(msg.chatMessageId, replyingTo.chatMessageId);
					return next;
				});
			}
			setReplyingTo(null);
			setConversations((prev) => {
				const updated = prev.map((c) =>
					c.chatConversationId === selectedConvId
						? { ...c, lastMessage: msg.chatMessageText || "Message", lastMessageAt: msg.sentAt, lastMessageSenderId: userId ?? undefined }
						: c
				);
				const idx = updated.findIndex((c) => c.chatConversationId === selectedConvId);
				if (idx > 0) {
					const [item] = updated.splice(idx, 1);
					updated.unshift(item);
				}
				return updated;
			});
		} catch (e) {
			console.error("Failed to send message:", e);
			toast({ title: "Failed to send message", variant: "destructive" });
		} finally {
			setIsSending(false);
		}
	}, [newMessage, selectedConvId, userId, orgId, toast, replyingTo]);

	const handleSaveGroupDetails = useCallback(async () => {
		// This will be called from ManageGroupDialog
	}, []);

	const handleAddGroupMembers = useCallback(async () => {
		// This will be called from ManageGroupDialog
	}, []);

	const handleSetAdmin = useCallback(async (memberId: number, isAdmin: boolean) => {
		if (!selectedConvId || !orgId || !userId) return;
		try {
			await chatService.setAdmin(selectedConvId, memberId, userId, isAdmin, orgId);
			const details = await chatService.getConversationDetails(selectedConvId, userId, orgId);
			setSelectedConvDetails(details);
			toast({ title: isAdmin ? "Admin granted" : "Admin removed" });
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : "Unknown error";
			console.error("[SET_ADMIN] Error:", e);
			toast({ title: "Failed to update admin", description: msg, variant: "destructive" });
		}
	}, [selectedConvId, orgId, userId, toast]);

	const handleRemoveMember = useCallback(async (memberId: number) => {
		if (!selectedConvId || !orgId || !userId) return;
		try {
			await chatService.removeParticipant(selectedConvId, memberId, orgId, userId);
			const details = await chatService.getConversationDetails(selectedConvId, userId, orgId);
			setSelectedConvDetails(details);
			toast({ title: "Member removed" });
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : "Unknown error";
			console.error("[REMOVE_MEMBER] Error:", e);
			toast({ title: "Failed to remove member", description: msg, variant: "destructive" });
		}
	}, [selectedConvId, orgId, userId, toast]);

	const handleDeleteGroup = useCallback(async () => {
		// This will be called from ManageGroupDialog
		if (!selectedConvId || !orgId || !userId) return;
		setIsDeletingConversation(true);
		try {
			await chatService.deleteConversation(selectedConvId, userId, orgId);
			setConversations((prev) => prev.filter((c) => c.chatConversationId !== selectedConvId));
			setSelectedConvId(null);
			setSelectedConvDetails(null);
			setMessages([]);
			toast({ title: "Group deleted" });
			setIsManageGroupOpen(false);
		} catch (e: unknown) {
			toast({ title: "Failed to delete group", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
		} finally {
			setIsDeletingConversation(false);
			setIsDeleteDialogOpen(false);
		}
	}, [selectedConvId, orgId, userId, toast]);

	const openManageGroup = useCallback(() => {
		setIsManageGroupOpen(true);
	}, []);

	const scrollToTop = useCallback(() => {
		const scrollArea = document.querySelector('[data-messages-scroll]');
		const viewport = scrollArea?.querySelector('[data-slot="scroll-area-viewport"]');
		if (viewport) {
			viewport.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}, []);

	const sendTypingIndicator = useCallback((convId: number, userId: number, isTyping: boolean) => {
		if (wsConnected) {
			chatService.sendTypingIndicator(convId, userId, isTyping);
		}
	}, [wsConnected]);

	const selectedConv = conversations.find(c => c.chatConversationId === selectedConvId) ?? null;

	const getOrgBadgeColor = (orgType?: string) => {
		switch (orgType?.toUpperCase()) {
			case "RETAILER": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "SUPPLIER": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "LOGISTICS": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
			default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
		}
	};

	if (!userId || !orgId) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Please log in to use chat.</p>
			</div>
		);
	}

	return (
		<div className="flex w-full h-full">
			{/* Sidebar - Conversation List */}
			<ChatSidebar
				conversations={conversations}
				isLoadingConvs={isLoadingConvs}
				selectedConvId={selectedConvId}
				onSelectConversation={setSelectedConvId}
				onCreateDirectChat={(conv) => { }}
			/>

			{/* Main Chat Area */}
			<div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
				{selectedConvId ? (
					<>
						<ChatHeader
							selectedConvDetails={selectedConvDetails}
							selectedConv={selectedConv}
							userId={userId}
							orgId={orgId}
							isClearingChat={isClearingChat}
							isDeletingConversation={isDeletingConversation}
							isDownloadingChat={isDownloadingChat}
							isSearchInChatOpen={isSearchInChatOpen}
							setIsSearchInChatOpen={setIsSearchInChatOpen}
							onClearChat={handleClearChat}
							onDeleteConversation={() => setIsDeleteDialogOpen(true)}
							onDownloadChat={handleDownloadChat}
							onOpenManageGroup={openManageGroup}
							onScrollToTop={scrollToTop}
						/>

						{/* Pinned Messages Bar */}
						{messages.filter(m => m.isPinned).length > 0 && (
							<div className="border-b bg-yellow-50/50 dark:bg-yellow-900/10 p-2">
								<div className="flex items-center gap-2">
									<Flag className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
									<span className="text-xs font-medium text-yellow-800 dark:text-yellow-300">Pinned Messages</span>
									<div className="flex-1 h-px bg-yellow-200/50 dark:bg-yellow-800/50" />
								</div>
								<div className="flex gap-2 overflow-x-auto pb-2 mt-1">
									{messages.filter(m => m.isPinned).map((msg) => (
										<button
											key={msg.chatMessageId}
											onClick={() => chatMessagesRef.current?.scrollToMessage(msg.chatMessageId)}
											className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-800 text-xs text-yellow-900 dark:text-yellow-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-colors whitespace-nowrap shrink-0"
										>
											<Pin className="h-3 w-3 shrink-0" />
											<span className="truncate max-w-50">
												{msg.chatMessageText?.slice(0, 50)}...
											</span>
											<button
												onClick={(e) => {
													e.stopPropagation();
													handlePinMessage(msg.chatMessageId);
												}}
												className="ml-1 p-0.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded text-yellow-600 dark:text-yellow-400"
											>
												<X className="h-3 w-3" />
											</button>
										</button>
									))}
								</div>
							</div>
						)}

						<ChatMessages
							ref={chatMessagesRef}
							messages={messages}
							isLoadingMessages={isLoadingMessages}
							userId={userId}
							replyMap={replyMap}
							hoveredMessageId={hoveredMessageId}
							setHoveredMessageId={setHoveredMessageId}
							messageActionMenuId={messageActionMenuId}
							setMessageActionMenuId={setMessageActionMenuId}
							replyingTo={replyingTo}
							onReplyMessage={handleReplyMessage}
							onPinMessage={handlePinMessage}
							onCopyMessage={handleCopyMessage}
							onDeleteMessage={handleDeleteMessage}
							firstUnreadIndex={firstUnreadIndex}
							getOrgBadgeColor={getOrgBadgeColor}
						/>

						<TypingIndicator
							typingUsers={typingUsers}
							participants={selectedConvDetails?.chatConversationParticipants}
							currentUserId={userId}
						/>

						<ChatInput
							newMessage={newMessage}
							setNewMessage={setNewMessage}
							isSending={isSending}
							replyingTo={replyingTo}
							onSendMessage={handleSendMessage}
							onCancelReply={handleCancelReply}
							wsConnected={wsConnected}
							selectedConvId={selectedConvId}
							userId={userId}
							sendTypingIndicator={sendTypingIndicator}
						/>
					</>
				) : (
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center">
							<MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<p className="text-muted-foreground">Select a conversation or start a new chat</p>
						</div>
					</div>
				)}
			</div>

			{/* Manage Group Dialog */}
			<ManageGroupDialog
				isOpen={isManageGroupOpen}
				onOpenChange={setIsManageGroupOpen}
				selectedConvDetails={selectedConvDetails}
				selectedConvId={selectedConvId}
				onSaveDetails={handleSaveGroupDetails}
				onAddMembers={handleAddGroupMembers}
				onSetAdmin={handleSetAdmin}
				onRemoveMember={handleRemoveMember}
				onDeleteGroup={handleDeleteGroup}
			/>

			{/* Search in Chat Dialog */}
			<SearchInChatDialog
				isOpen={isSearchInChatOpen}
				onOpenChange={setIsSearchInChatOpen}
				searchQuery={searchQueryInChat}
				setSearchQuery={setSearchQueryInChat}
				searchResults={searchResultsInChat}
				isSearching={isSearchingInChat}
				onSearch={handleSearchInChat}
			/>

			{/* Delete Message Confirmation Dialog */}
			<DeleteMessageDialog
				isOpen={isDeleteMessageDialogOpen}
				onOpenChange={setIsDeleteMessageDialogOpen}
				messageToDelete={messageToDelete}
				userId={userId}
				onConfirmDelete={handleConfirmDeleteMessage}
			/>

			{/* Delete Conversation Dialog */}
			<DeleteConversationDialog
				isOpen={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				selectedConvDetails={selectedConvDetails}
				isDeleting={isDeletingConversation}
				onConfirmDelete={handleDeleteConversation}
			/>
		</div>
	);
}