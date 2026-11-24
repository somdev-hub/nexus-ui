"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { chatApiService, ChatConversation, ChatConversationParticipant, ChatMessage, CreateConversationPayload, User } from "@/lib/chat-api";
import { chatWebSocketService } from "@/lib/chat-websocket";
import { cn } from "@/lib/utils";
import { Building2, Check, CheckCheck, Loader2, MessageCircle, Plus, Search, Send, Users, Trash2, Download, ArrowUpToLine, MessageSquare } from "lucide-react";
import { IconDotsVertical } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface WsMessagePayload {
	chatMessageId?: number;
	chatMessageText?: string;
	chatMessageType?: ChatMessage["chatMessageType"];
	chatMessageStatus?: ChatMessage["chatMessageStatus"];
	sentAt?: string;
	deliveredAt?: string;
	receivedAt?: string;
	updatedAt?: string;
	chatConversationParticipant?: {
		participantId?: number;
		participantName?: string;
		participantEmail?: string;
		participantAvatar?: string;
	};
	chatMessageAttachmentList?: ChatMessage["chatMessageAttachmentList"];
	messageSeenByList?: ChatMessage["messageSeenByList"];
}

export function ChatInterface() {
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

	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	const [creatingUserId, setCreatingUserId] = useState<number | null>(null);
	// Group creation
	const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
	const [groupName, setGroupName] = useState("");
	const [groupDescription, setGroupDescription] = useState("");
	const [selectedGroupUsers, setSelectedGroupUsers] = useState<User[]>([]);
	const [groupSearchQuery, setGroupSearchQuery] = useState("");
	const [groupSearchResults, setGroupSearchResults] = useState<User[]>([]);
	const [isGroupSearching, setIsGroupSearching] = useState(false);
	const [isCreatingGroup, setIsCreatingGroup] = useState(false);
	// Group management
	const [isManageGroupOpen, setIsManageGroupOpen] = useState(false);
	const [manageGroupName, setManageGroupName] = useState("");
	const [manageGroupDescription, setManageGroupDescription] = useState("");
	const [manageSearchQuery, setManageSearchQuery] = useState("");
	const [manageSearchResults, setManageSearchResults] = useState<User[]>([]);
	const [isManageSearching, setIsManageSearching] = useState(false);
	const [selectedToAdd, setSelectedToAdd] = useState<User[]>([]);
	const [actionLoading, setActionLoading] = useState<{ memberId: number; action: "admin" | "remove" } | null>(null);
	const [isSavingGroupDetails, setIsSavingGroupDetails] = useState(false);
	const [isAddingMembers, setIsAddingMembers] = useState(false);
	const [isSearchingInChat, setIsSearchingInChat] = useState(false);
	const [isClearingChat, setIsClearingChat] = useState(false);
	const [isDeletingConversation, setIsDeletingConversation] = useState(false);
	const [isDownloadingChat, setIsDownloadingChat] = useState(false);
	const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
	const [selectedConvDetailsState, setSelectedConvDetails] = useState<ChatConversation | null>(null);
	const selectedConvDetails = selectedConvId ? selectedConvDetailsState : null;
	const [wsConnected, setWsConnected] = useState(false);
	const [typingUsers, setTypingUsers] = useState<number[]>([]);

	const messagesEndRef = useRef<HTMLDivElement>(null);



	// WebSocket connection lifecycle
	useEffect(() => {
		if (!userId || !orgId) return;
		let active = true;
		chatWebSocketService
			.connect({
				onConnect: () => { if (active) setWsConnected(true); },
				onDisconnect: () => { if (active) setWsConnected(false); },
				onError: (err) => { if (active) console.error("[CHAT WS] error:", err); },
			})
			.then(() => { if (active) setWsConnected(true); })
			.catch((e) => { if (active) { setWsConnected(false); console.error("[CHAT WS] connect failed:", e); } });
		return () => {
			active = false;
			chatWebSocketService.disconnect();
			setWsConnected(false);
		};
	}, [userId, orgId]);



	useEffect(() => {
		if (!userId || !orgId) return;
		const load = async () => {
			setIsLoadingConvs(true);
			try {
				const convs = await chatApiService.getConversations(userId, orgId);
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
				const msgs = await chatApiService.getMessages(selectedConvId, userId, orgId);
				setMessages(msgs);
			} catch (e) {
				console.error("Failed to load messages:", e);
			} finally {
				setIsLoadingMessages(false);
			}
		};
		load();
	}, [selectedConvId, userId, orgId]);

	// Fetch conversation details (includes participant statuses)
	useEffect(() => {
		if (!selectedConvId || !userId || !orgId) return;
		const loadDetails = async () => {
			try {
				const details = await chatApiService.getConversationDetails(selectedConvId, userId, orgId);
				setSelectedConvDetails(details);
			} catch (e) {
				const axiosError = e as { response?: { data: unknown; status: number }; message?: string };
				console.error("Failed to load conversation details:", axiosError);
				// Show full backend error response
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

	// Subscribe to presence updates over WebSocket
	useEffect(() => {
		if (!wsConnected) return;
		const unsub = chatWebSocketService.subscribe("/topic/presence", (data: unknown) => {
			const evt = (data ?? {}) as { userId?: number; status?: string; at?: string };
			if (!evt.userId) return;
			setSelectedConvDetails((prev) => {
				if (!prev?.chatConversationParticipants) return prev;
				const updated = prev.chatConversationParticipants.map((p) =>
					p.participantId === evt.userId
						? { ...p, chatParticipantCurrentStatus: (evt.status === "ONLINE" ? "ONLINE" : "OFFLINE") as "ONLINE" | "OFFLINE", lastSeenAt: evt.at || p.lastSeenAt }
						: p
				);
				return { ...prev, chatConversationParticipants: updated };
			});
		});
		return () => unsub();
	}, [wsConnected]);

	// Subscribe to the selected conversation's real-time messages + typing
	useEffect(() => {
		if (!wsConnected || !selectedConvId) return;
		const dest = `/topic/conversations/${selectedConvId}`;
		const unsubMsg = chatWebSocketService.subscribe(dest, (data: unknown) => {
			const evt = (data ?? {}) as { message?: WsMessagePayload } & WsMessagePayload;
			const m = (evt.message ?? evt) as WsMessagePayload;
			if (!m || typeof m.chatMessageId !== "number") return;
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
		const unsubTyping = chatWebSocketService.subscribe(`/topic/conversations/${selectedConvId}/typing`, (data: unknown) => {
			const evt = (data ?? {}) as { userId?: number; isTyping?: boolean };
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
		return () => {
			unsubMsg();
			unsubTyping();
		};
	}, [wsConnected, selectedConvId, userId]);

	const handleSearch = useCallback(async (query: string) => {
		if (!query.trim()) {
			setSearchResults([]);
			return;
		}
		setIsSearching(true);
		try {
			const results = await chatApiService.searchUsers(query);
			setSearchResults(results);
		} catch (e) {
			console.error("Search failed:", e);
			toast({ title: "Search failed", description: "Could not search users. Please try again.", variant: "destructive" });
		} finally {
			setIsSearching(false);
		}
	}, [toast]);

	// Debounced search
	useEffect(() => {
		if (!searchQuery.trim()) {
			const t = setTimeout(() => setSearchResults([]), 0);
			return () => clearTimeout(t);
		}
		const timer = setTimeout(() => {
			handleSearch(searchQuery);
		}, 500);
		return () => clearTimeout(timer);
	}, [searchQuery, handleSearch]);

	// Group search
	useEffect(() => {
		if (!groupSearchQuery.trim()) {
			const t = setTimeout(() => setGroupSearchResults([]), 0);
			return () => clearTimeout(t);
		}
		const timer = setTimeout(async () => {
			setIsGroupSearching(true);
			try {
				const results = await chatApiService.searchUsers(groupSearchQuery);
				setGroupSearchResults(results);
			} catch (e) {
				console.error(e);
			} finally {
				setIsGroupSearching(false);
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [groupSearchQuery]);

	// Manage group search
	useEffect(() => {
		if (!manageSearchQuery.trim()) {
			const t = setTimeout(() => setManageSearchResults([]), 0);
			return () => clearTimeout(t);
		}
		const timer = setTimeout(async () => {
			setIsManageSearching(true);
			try {
				const results = await chatApiService.searchUsers(manageSearchQuery);
				setManageSearchResults(results);
			} catch (e) {
				console.error(e);
			} finally {
				setIsManageSearching(false);
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [manageSearchQuery]);

	const handleCreateConversation = useCallback(async (targetUser: User) => {
		if (!userId || !orgId) return;

		setCreatingUserId(targetUser.id);
		try {
			const conv = await chatApiService.createConversation(
				{
					chatConversationType: "DIRECT",
					orgId: orgId,
					participantIds: [userId, targetUser.id],
					participants: [
						{
							participantId: userId,
							participantName: userName || "Me",
							participantEmail: "",
							isChatCreator: true,
							participantMob: "",
							participantRole: "USER",
							chatParticipantType: "MEMBER",
							participantAvatar: userAvatar,
							orgId: orgId,
							orgName: undefined,
							orgType: undefined,
						},
						{
							participantId: targetUser.id,
							participantName: targetUser.name,
							participantEmail: targetUser.email,
							isChatCreator: false,
							participantMob: targetUser.phone || "",
							participantRole: targetUser.role || "USER",
							chatParticipantType: "MEMBER",
							participantAvatar: targetUser.profilePhoto,
							orgId: targetUser.orgId,
							orgName: targetUser.orgName,
							orgType: targetUser.orgType,
						},
					],
				},
				orgId,
				userId
			);
			setConversations(prev => [conv, ...prev]);
			setSelectedConvId(conv.chatConversationId);
			setIsSearchOpen(false);
			setSearchQuery("");
			setSearchResults([]);
			toast({ title: `Chat started with ${targetUser.name}` });
		} catch (e: unknown) {
			const err = e as { response?: { data?: { description?: string; message?: string; serviceName?: string } }; message?: string };
			const errorMsg = err?.response?.data?.description || err?.response?.data?.message || err?.message || "Failed to start chat";
			console.error("Failed to create conversation:", JSON.stringify(err?.response?.data), e);
			toast({ title: "Failed to start chat", description: errorMsg, variant: "destructive" });
		} finally {

			setCreatingUserId(null);
		}
	}, [userId, orgId, userName, userAvatar, toast]);

	const handleCreateGroup = useCallback(async () => {
		if (!userId || !orgId || !groupName.trim() || selectedGroupUsers.length === 0) return;
		setIsCreatingGroup(true);
		try {
			const participants = [
				{ participantId: userId, participantName: userName || "Me", participantEmail: "", isChatCreator: true, participantMob: "", participantRole: "USER", chatParticipantType: "MEMBER", participantAvatar: userAvatar, orgId: orgId, orgName: undefined, orgType: undefined },
				...selectedGroupUsers.map((u) => ({
					participantId: u.id,
					participantName: u.name,
					participantEmail: u.email,
					isChatCreator: false,
					participantMob: u.phone || "",
					participantRole: u.role || "USER",
					chatParticipantType: "MEMBER",
					participantAvatar: u.profilePhoto,
					orgId: u.orgId,
					orgName: u.orgName,
					orgType: u.orgType,
				})),
			];
			const conv = await chatApiService.createConversation(
				{
					chatConversationName: groupName.trim(),
					chatConversationDescription: groupDescription.trim() || undefined,
					chatConversationType: "GROUP",
					orgId: orgId,
					participantIds: [userId, ...selectedGroupUsers.map((u) => u.id)],
					participants: participants as NonNullable<CreateConversationPayload["participants"]>,
				},
				orgId,
				userId
			);
			setConversations((prev) => [conv, ...prev]);
			setSelectedConvId(conv.chatConversationId);
			setIsGroupDialogOpen(false);
			setGroupName("");
			setGroupDescription("");
			setSelectedGroupUsers([]);
			setGroupSearchQuery("");
			setGroupSearchResults([]);
			toast({ title: `Group "${conv.chatConversationName}" created` });
		} catch (e: unknown) {
			console.error("Failed to create group:", e);
			toast({ title: "Failed to create group", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
		} finally {
			setIsCreatingGroup(false);
		}
	}, [userId, orgId, userName, userAvatar, groupName, groupDescription, selectedGroupUsers, toast]);

	const openManageGroup = useCallback(() => {
		if (!selectedConvDetails) return;
		setManageGroupName(selectedConvDetails.chatConversationName || "");
		setManageGroupDescription(selectedConvDetails.chatConversationDescription || "");
		setManageSearchQuery("");
		setManageSearchResults([]);
		setIsManageGroupOpen(true);
	}, [selectedConvDetails]);

	const handleSaveGroupDetails = useCallback(async () => {
		if (!selectedConvId || !userId || !orgId) return;
		setIsSavingGroupDetails(true);
		try {
			const updated = await chatApiService.updateConversation(selectedConvId, manageGroupName.trim() || undefined, manageGroupDescription.trim() || undefined, undefined, orgId, userId ?? undefined);
			setSelectedConvDetails(updated);
			setConversations((prev) => prev.map((c) => (c.chatConversationId === selectedConvId ? { ...c, chatConversationName: updated.chatConversationName } : c)));
			toast({ title: "Group updated" });
		} catch (e: unknown) {
			toast({ title: "Failed to update group", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
		} finally {
			setIsSavingGroupDetails(false);
		}
	}, [selectedConvId, userId, orgId, manageGroupName, manageGroupDescription, toast]);

	const handleAddGroupMembers = useCallback(async () => {
		if (!selectedConvId || !orgId || !userId || selectedToAdd.length === 0) return;
		setIsAddingMembers(true);
		try {
			await chatApiService.addParticipants(selectedConvId, selectedToAdd.map((u) => u.id), orgId, userId);
			// refresh details
			const details = await chatApiService.getConversationDetails(selectedConvId, userId, orgId);
			setSelectedConvDetails(details);
			setSelectedToAdd([]);
			setManageSearchQuery("");
			setManageSearchResults([]);
			toast({ title: "Members added" });
		} catch (e: unknown) {
			toast({ title: "Failed to add members", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
		} finally {
			setIsAddingMembers(false);
		}
	}, [selectedConvId, orgId, userId, selectedToAdd, toast]);

	const handleRemoveMember = useCallback(async (memberId: number) => {
		if (!selectedConvId || !orgId || !userId) return;
		setActionLoading({ memberId, action: "remove" });
		try {
			await chatApiService.removeParticipant(selectedConvId, memberId, orgId, userId);
			const details = await chatApiService.getConversationDetails(selectedConvId, userId, orgId);
			setSelectedConvDetails(details);
			toast({ title: "Member removed" });
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : "Unknown error";
			console.error("[REMOVE_MEMBER] Error:", e);
			toast({ title: "Failed to remove member", description: msg, variant: "destructive" });
		} finally {
			console.log("[REMOVE_MEMBER] Resetting loading state");
			setActionLoading(null);
		}
	}, [selectedConvId, orgId, userId, toast]);

	const handleSetAdmin = useCallback(async (memberId: number, isAdmin: boolean) => {
		if (!selectedConvId || !orgId || !userId) return;
		setActionLoading({ memberId, action: "admin" });
		try {
			await chatApiService.setAdmin(selectedConvId, memberId, userId, isAdmin, orgId);
			const details = await chatApiService.getConversationDetails(selectedConvId, userId, orgId);
			setSelectedConvDetails(details);
			toast({ title: isAdmin ? "Admin granted" : "Admin removed" });
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : "Unknown error";
			console.error("[SET_ADMIN] Error:", e);
			toast({ title: "Failed to update admin", description: msg, variant: "destructive" });
		} finally {
			console.log("[SET_ADMIN] Resetting loading state");
			setActionLoading(null);
		}
	}, [selectedConvId, orgId, userId, toast]);

	const handleClearChat = useCallback(async () => {
		if (!selectedConvId || !orgId || !userId) return;
		setIsClearingChat(true);
		try {
			await chatApiService.clearChatForSelf(selectedConvId, userId, orgId);
			const msgs = await chatApiService.getMessages(selectedConvId, userId, orgId);
			setMessages(msgs);
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
			await chatApiService.deleteConversation(selectedConvId, userId, orgId);
			setConversations((prev) => prev.filter((c) => c.chatConversationId !== selectedConvId));
			setSelectedConvId(null);
			setSelectedConvDetails(null);
			setMessages([]);
			toast({ title: "Conversation deleted" });
		} catch (e: unknown) {
			toast({ title: "Failed to delete conversation", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
		} finally {
			setIsDeletingConversation(false);
		}
	}, [selectedConvId, orgId, userId, toast]);

	const handleDownloadChat = useCallback(async () => {
		if (!selectedConvId || !orgId || !userId) return;
		setIsDownloadingChat(true);
		try {
			const blob = await chatApiService.downloadChat(selectedConvId, userId, orgId);
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

	const [searchQueryInChat, setSearchQueryInChat] = useState("");
	const [searchResultsInChat, setSearchResultsInChat] = useState<ChatMessage[]>([]);
	const [isSearchInChatOpen, setIsSearchInChatOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const handleSearchInChat = useCallback(async () => {
		if (!selectedConvId || !orgId || !userId || !searchQueryInChat.trim()) return;
		setIsSearchingInChat(true);
		try {
			const results = await chatApiService.searchMessages(selectedConvId, userId, orgId, searchQueryInChat);
			setSearchResultsInChat(results);
		} catch (e: unknown) {
			toast({ title: "Search failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
		} finally {
			setIsSearchingInChat(false);
		}
	}, [selectedConvId, orgId, userId, searchQueryInChat, toast]);

	const handleSendMessage = useCallback(async () => {
		if (!newMessage.trim() || !selectedConvId || !userId) return;
		setIsSending(true);
		try {
			const msg = await chatApiService.sendMessage(
				{
					chatConversationId: selectedConvId,
					participantId: userId,
					chatMessageText: newMessage,
					chatMessageType: "TEXT",
					chatMessageAttachmentList: [],
					clientMessageId: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
				},
				undefined,
				orgId ?? undefined
			);
			setMessages(prev => (prev.some((m) => m.chatMessageId === msg.chatMessageId) ? prev : [...prev, msg]));
			setNewMessage("");
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
	}, [newMessage, selectedConvId, userId, orgId, toast]);

	const selectedConv = conversations.find(c => c.chatConversationId === selectedConvId);

	const getOrgBadgeColor = (orgType?: string) => {
		switch (orgType?.toUpperCase()) {
			case "RETAILER": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "SUPPLIER": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "LOGISTICS": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
			default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
		}
	};

	// Helper to format participant status for header
	const getParticipantStatusText = useCallback((participants: ChatConversationParticipant[] | undefined, currentUserId: number | null): string => {
		if (!participants || !participants.length) return "";

		const otherParticipants = participants.filter(p => p.participantId !== currentUserId);
		const isGroup = otherParticipants.length > 1;

		if (isGroup) {
			const onlineCount = otherParticipants.filter(p => p.chatParticipantCurrentStatus === "ONLINE").length;
			return `${otherParticipants.length} members${onlineCount > 0 ? `, ${onlineCount} online` : ""}`;
		}

		// Direct chat - show other participant's status
		const other = otherParticipants[0];
		if (!other) return "";

		switch (other.chatParticipantCurrentStatus) {
			case "ONLINE":
				return "Online";
			case "AWAY":
				return "Away";
			case "OFFLINE":
				if (other.lastSeenAt) {
					const lastSeen = new Date(other.lastSeenAt);
					const now = new Date();
					const diffMs = now.getTime() - lastSeen.getTime();
					const diffMins = Math.floor(diffMs / 60000);
					const diffHours = Math.floor(diffMins / 60);
					const diffDays = Math.floor(diffHours / 24);

					if (diffMins < 1) return "Last seen just now";
					if (diffMins < 60) return `Last seen ${diffMins}m ago`;
					if (diffHours < 24) return `Last seen ${diffHours}h ago`;
					if (diffDays < 7) return `Last seen ${diffDays}d ago`;
					return `Last seen ${lastSeen.toLocaleDateString()}`;
				}
				return "Offline";
			default:
				return "Offline";
		}
	}, []);

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
			<div className="hidden md:flex md:flex-col md:w-80 lg:w-96 shrink-0 border-r h-full overflow-hidden">
				<div className="flex items-center justify-between p-3 border-b">
					<h3 className="font-semibold">Messages</h3>
					<div className="flex gap-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size="sm" variant="outline">
									<Plus className="h-4 w-4 mr-1" />
									New
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56">
								<DropdownMenuItem onClick={() => setIsSearchOpen(true)} className="flex items-center gap-2">
									<MessageCircle className="h-4 w-4" />
									New Chat
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setIsGroupDialogOpen(true)} className="flex items-center gap-2">
									<Users className="h-4 w-4" />
									New Group
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
							<DialogTrigger asChild>
								<Button style={{ display: 'none' }} />
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Start a new conversation</DialogTitle>
								</DialogHeader>
								<div className="space-y-4">
									<div className="flex gap-2">
										<Input
											placeholder="Search users by name..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
										/>
										<Button onClick={() => handleSearch(searchQuery)} disabled={isSearching}>
											{isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
										</Button>
									</div>
									<ScrollArea className="h-60">
										<div className="space-y-2">
											{searchResults.map((user) => (
												<div
													key={user.id}
													className={cn(
														"flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer",
														creatingUserId === user.id && "opacity-50 pointer-events-none"
													)}
													onClick={() => handleCreateConversation(user)}
												>
													<Avatar className="h-8 w-8">
														<AvatarImage src={user.profilePhoto} />
														<AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
													</Avatar>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium truncate">{user.name}</p>
														<p className="text-xs text-muted-foreground truncate">{user.email}</p>
														{user.orgName && user.orgId !== orgId && (
															<p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
																<Building2 className="h-3 w-3" />
																{user.orgName}
															</p>
														)}
													</div>
													{creatingUserId === user.id ? (
														<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
													) : (
														<>
															{user.orgType && (
																<Badge className={cn("text-[10px]", getOrgBadgeColor(user.orgType))}>
																	{user.orgType}
																</Badge>
															)}
														</>
													)}
												</div>
											))}
											{isSearching && (
												<div className="flex items-center justify-center py-4">
													<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
												</div>
											)}
											{searchResults.length === 0 && searchQuery && !isSearching && (
												<p className="text-sm text-muted-foreground text-center py-4">
													No users found
												</p>
											)}
										</div>
									</ScrollArea>
								</div>
							</DialogContent>
						</Dialog>
						<Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
							<DialogTrigger asChild>
								<Button style={{ display: 'none' }} />
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Create a group</DialogTitle>
								</DialogHeader>
								<div className="space-y-4">
									<Input placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
									<Input placeholder="Description (optional)" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} />
									<Input placeholder="Search users to add..." value={groupSearchQuery} onChange={(e) => setGroupSearchQuery(e.target.value)} />
									{isGroupSearching && (
										<div className="flex items-center justify-center py-2">
											<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
										</div>
									)}
									<ScrollArea className="h-40">
										<div className="space-y-2">
											{groupSearchResults.map((user) => {
												const selected = selectedGroupUsers.some((u) => u.id === user.id);
												return (
													<div
														key={user.id}
														className={cn("flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer", selected && "bg-muted")}
														onClick={() => setSelectedGroupUsers((prev) => selected ? prev.filter((u) => u.id !== user.id) : [...prev, user])}
													>
														<Avatar className="h-8 w-8"><AvatarImage src={user.profilePhoto} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
														<div className="flex-1 min-w-0">
															<p className="text-sm font-medium truncate">{user.name}</p>
															<p className="text-xs text-muted-foreground truncate">{user.email}</p>
														</div>
														{selected && <Check className="h-4 w-4 text-primary" />}
													</div>
												);
											})}
										</div>
									</ScrollArea>
									{selectedGroupUsers.length > 0 && (
										<div className="text-xs text-muted-foreground">Selected: {selectedGroupUsers.map((u) => u.name).join(", ")}</div>
									)}
									<Button onClick={handleCreateGroup} disabled={isCreatingGroup || !groupName.trim() || selectedGroupUsers.length === 0} className="w-full">
										{isCreatingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Group"}
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				</div>
				<ScrollArea className="flex-1">
					<div className="p-2 space-y-1">
						{isLoadingConvs ? (
							<div className="p-2 space-y-3">
								{Array.from({ length: 6 }).map((_, i) => (
									<div key={i} className="flex items-center gap-3 p-2">
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
								No conversations yet. <span className="font-bold">Start a new chat!</span>
							</p>
						) : (
							// Sort: conversations without lastMessageAt (new) first, then by lastMessageAt descending
							[...conversations].sort((a, b) => {
								const aNew = !a.lastMessageAt;
								const bNew = !b.lastMessageAt;
								if (aNew !== bNew) return aNew ? -1 : 1;
								if (aNew) {
									const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
									const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
									return cb - ca;
								}
								const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
								const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
								return timeB - timeA;
							}).map((conv) => {
								const displayName = conv.chatConversationName || conv.otherParticipantName || "Conversation";
								const avatarUrl = conv.otherParticipantAvatar;
								const isGroup = conv.chatConversationType === "GROUP";
								const avatarFallback = isGroup ? null : (conv.otherParticipantName?.charAt(0) || displayName.charAt(0));
								const lastMsg = conv.lastMessage || <span className="text-primary font-medium">Start a conversation</span>;
								const lastMsgTime = conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

								return (
									<div
										key={conv.chatConversationId}
										className={cn(
											"p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors",
											selectedConvId === conv.chatConversationId && "bg-muted"
										)}
										onClick={() => { setSelectedConvDetails(null); setSelectedConvId(conv.chatConversationId); setTypingUsers([]); }}
									>
										<div className="flex items-center gap-3">
											<Avatar className="h-10 w-10 shrink-0">
												<AvatarImage src={avatarUrl} />
												<AvatarFallback className={isGroup ? "bg-primary/10" : ""}>
													{isGroup ? <Users className="h-5 w-5 text-primary" /> : avatarFallback}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between gap-2">
													<div className="flex gap-2 items-center">
														<p className="text-sm font-medium truncate">{displayName}</p>
														{conv.isInterOrg && (
															<div className="mt-1">
																<Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
																	Inter-org
																</Badge>
															</div>
														)}
													</div>
													<div className="flex items-center gap-1 shrink-0">
														{lastMsgTime && <span className="text-xs text-muted-foreground">{lastMsgTime}</span>}
														{(conv.unreadCount ?? 0) > 0 && (
															<Badge variant="default" className="text-[10px] h-4 min-w-4 px-1.5 rounded-full">
																{conv.unreadCount}
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

			{/* Main Chat Area */}
			<div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
				{selectedConvId ? (
					<>
						<div className="flex items-center gap-3 p-3 border-b">
							{(() => {
								const displayName = selectedConvDetails?.chatConversationName || selectedConv?.chatConversationName || selectedConv?.otherParticipantName || "Conversation";
								const avatarUrl = selectedConvDetails?.chatConversationAvatar || selectedConv?.otherParticipantAvatar;
								const isGroupChat = selectedConvDetails?.chatConversationType === "GROUP" || selectedConv?.chatConversationType === "GROUP";
								const avatarFallback = isGroupChat ? null : (selectedConvDetails?.chatConversationName?.charAt(0) || selectedConv?.otherParticipantName?.charAt(0) || displayName.charAt(0));

								// Use conversation details for status, fallback to conversation list data
								const participants = selectedConvDetails?.chatConversationParticipants;
								const statusText = getParticipantStatusText(participants, userId);

								return (
									<div className="flex items-center gap-3 w-full">
										<div className="relative shrink-0">
											<Avatar className="h-10 w-10">
												<AvatarImage src={avatarUrl} />
												<AvatarFallback className={isGroupChat ? "bg-primary/10" : ""}>
													{isGroupChat ? <Users className="h-5 w-5 text-primary" /> : avatarFallback}
												</AvatarFallback>
											</Avatar>
											{/* Online indicator dot for direct chats */}
											{participants && participants.length <= 2 && (
												<span className={cn(
													"absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background",
													participants.some(p => p.participantId !== userId && p.chatParticipantCurrentStatus === "ONLINE")
														? "bg-green-500"
														: participants.some(p => p.participantId !== userId && p.chatParticipantCurrentStatus === "AWAY")
															? "bg-yellow-500"
															: "bg-gray-400"
												)} />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-2">
												<div className="">
													<div className="flex items-center gap-2 min-w-0">
														<h3 className="font-semibold truncate">{displayName}</h3>
														{selectedConvDetails?.isInterOrg && (
															<Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Inter-org</Badge>
														)}
													</div>

													<p className="text-xs text-muted-foreground truncate">
														{statusText || selectedConvDetails?.chatConversationDescription || "No status available"}
													</p>
												</div>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button size="icon" variant="outline" className="h-9 w-9" aria-label="Conversation options">
															<IconDotsVertical className="h-5 w-5" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent className="w-56" align="end">
														<DropdownMenuItem
															onClick={handleClearChat}
															disabled={isClearingChat}
															className="flex items-center gap-2"
														>
															{isClearingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
															Clear Chat (Self)
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => setIsDeleteDialogOpen(true)}
															disabled={isDeletingConversation}
															className="flex items-center gap-2 text-destructive"
														>
															{isDeletingConversation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
															{selectedConvDetails?.chatConversationType === "GROUP" ? "Delete Group" : "Delete Conversation"}
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={handleDownloadChat}
															disabled={isDownloadingChat}
															className="flex items-center gap-2"
														>
															{isDownloadingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
															Download Chat
														</DropdownMenuItem>
														{selectedConvDetails?.chatConversationType === "GROUP" && (
															<DropdownMenuItem
																onClick={() => {
																	openManageGroup();
																}}
																className="flex items-center gap-2"
															>
																<Users className="h-4 w-4" />
																Edit Group Info
															</DropdownMenuItem>
														)}
														<DropdownMenuItem
															onClick={() => setIsSearchInChatOpen(true)}
															className="flex items-center gap-2"
														>
															<Search className="h-4 w-4" />
															Search in Chat
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => {
																const scrollArea = document.querySelector('[data-messages-scroll]');
																const viewport = scrollArea?.querySelector('[data-slot="scroll-area-viewport"]');
																if (viewport) {
																	viewport.scrollTo({ top: 0, behavior: 'smooth' });
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
									</div>
								);
							})()}
						</div>
						<ScrollArea data-messages-scroll className="flex-1 min-h-0 p-4">
							{isLoadingMessages ? (
								<div className="space-y-4">
									{Array.from({ length: 5 }).map((_, i) => (
										<div key={i} className={cn("flex gap-2", i % 2 === 0 ? "flex-row" : "flex-row-reverse")}>
											<Skeleton className="h-8 w-8 rounded-full shrink-0" />
											<div className="space-y-1">
												<Skeleton className="h-3 w-20" />
												<Skeleton className={cn("h-10 rounded-2xl", i % 2 === 0 ? "w-48" : "w-36")} />
											</div>
										</div>
									))}
								</div>
							) : messages.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-8">
									No messages yet. Start the conversation!
								</p>
							) : (
								<div className="space-y-4">
									{messages.map((msg) => {
										const participant = msg.chatConversationParticipant;
										const isMe = participant?.participantId === userId;
										return (
											<div
												key={msg.chatMessageId}
												className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}
											>
												<Avatar className="h-8 w-8 shrink-0">
													<AvatarImage src={participant?.participantAvatar} />
													<AvatarFallback>{(participant?.participantName || "?").charAt(0)}</AvatarFallback>
												</Avatar>
												<div className={cn("max-w-[70%]", isMe ? "items-end" : "items-start")}>
													<div className="flex items-center gap-1 mb-1">
														<span className="text-xs font-medium">{participant?.participantName || "Unknown"}</span>
														{participant?.orgType && (
															<Badge className={cn("text-[9px] px-1", getOrgBadgeColor(participant.orgType))}>
																{participant.orgType}
															</Badge>
														)}
													</div>
													<div className={cn(
														"rounded-2xl px-3 py-2 text-sm",
														isMe ? "bg-primary text-primary-foreground" : "bg-muted"
													)}>
														{msg.chatMessageText}
													</div>
													<div className="flex items-center gap-1 mt-1">
														<p className="text-[10px] text-muted-foreground">
															{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
														</p>
														{isMe && (
															<span className="text-muted-foreground">
																{msg.messageSeenByList && msg.messageSeenByList.length > 0 ? (
																	<CheckCheck className="h-3 w-3 text-blue-500" />
																) : msg.chatMessageStatus === "DELIVERED" || msg.chatMessageStatus === "RECEIVED" ? (
																	<CheckCheck className="h-3 w-3" />
																) : (
																	<Check className="h-3 w-3" />
																)}
															</span>
														)}
													</div>
												</div>
											</div>
										);
									})}
									<div ref={messagesEndRef} />
								</div>
							)}
						</ScrollArea>
						{typingUsers.length > 0 && (
							<div className="px-3 py-1 text-xs text-muted-foreground italic">
								{typingUsers
									.map((id) => selectedConvDetails?.chatConversationParticipants?.find((p) => p.participantId === id)?.participantName || "Someone")
									.join(", ")}{" "}
								{typingUsers.length > 1 ? "are" : "is"} typing...
							</div>
						)}
						<div className="p-3 border-t flex gap-2">
							<Input
								placeholder="Type a message..."
								value={newMessage}
								onChange={(e) => {
									setNewMessage(e.target.value);
									if (wsConnected && selectedConvId) {
										chatWebSocketService.send(`/app/cms/chat/ws/typing/${selectedConvId}`, {});
									}
								}}
								onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
								disabled={isSending}
								className="flex-1"
							/>
							<Button onClick={handleSendMessage} disabled={!newMessage.trim() || isSending}>
								{isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
							</Button>
						</div>
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
			<Dialog open={isManageGroupOpen} onOpenChange={setIsManageGroupOpen}>
				<DialogContent className="max-h-[80vh] overflow-y-auto thin-scrollbar">
					<DialogHeader>
						<DialogTitle>Manage Group</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="flex items-center gap-4">
							<Avatar className="h-12 w-12">
								<AvatarImage src={selectedConvDetails?.chatConversationAvatar} />
								<AvatarFallback className="bg-primary/10">
									<Users className="h-6 w-6 text-primary" />
								</AvatarFallback>
							</Avatar>
							<div className="flex-1">
								<label className="text-sm font-medium mb-1 block">Group Photo</label>
								<input
									type="file"
									accept="image/*"
									className="text-sm"
									onChange={async (e) => {
										const file = e.target.files?.[0];
										if (!file || !selectedConvId || !userId || !orgId) return;
										try {
											await chatApiService.updateConversation(selectedConvId, manageGroupName || undefined, manageGroupDescription || undefined, file, orgId, userId ?? undefined);
											const details = await chatApiService.getConversationDetails(selectedConvId, userId, orgId);
											setSelectedConvDetails(details);
											toast({ title: "Group photo updated" });
										} catch (err) {
											toast({ title: "Failed to update photo", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
										}
									}}
								/>
							</div>
						</div>
						<Input placeholder="Group name" value={manageGroupName} onChange={(e) => setManageGroupName(e.target.value)} />
						<Input placeholder="Description" value={manageGroupDescription} onChange={(e) => setManageGroupDescription(e.target.value)} />
						<Button onClick={handleSaveGroupDetails} disabled={isSavingGroupDetails} className="w-full">
							{isSavingGroupDetails ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Details"}
						</Button>
						<div className="border-t pt-3">
							<p className="text-sm font-medium mb-2">Members</p>
							<div className="space-y-2 max-h-32 overflow-y-auto thin-scrollbar">
								{selectedConvDetails?.chatConversationParticipants?.map((m) => (
									<div key={m.participantId} className="flex items-center gap-3 p-2 rounded-lg">
										<Avatar className="h-8 w-8"><AvatarImage src={m.participantAvatar} /><AvatarFallback>{(m.participantName || "?").charAt(0)}</AvatarFallback></Avatar>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<p className="text-sm font-medium truncate">{m.participantName}</p>
												{(m.isAdmin || m.isChatCreator) && <Badge variant="secondary" className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Admin</Badge>}
												{m.isChatCreator && <Badge variant="secondary" className="text-[9px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Creator</Badge>}
											</div>
											<p className="text-xs text-muted-foreground truncate">{m.participantRole}</p>
										</div>
										{m.participantId !== userId && (
											<div className="flex items-center gap-1">
												{(selectedConvDetails?.chatConversationParticipants?.find((p) => p.participantId === userId)?.isAdmin || selectedConvDetails?.chatConversationParticipants?.find((p) => p.participantId === userId)?.isChatCreator) && (
													<Button size="sm" variant="outline" className="h-7 text-xs" disabled={actionLoading?.memberId === m.participantId} onClick={() => handleSetAdmin(m.participantId, !m.isAdmin)}>
														{actionLoading?.memberId === m.participantId && actionLoading?.action === "admin" ? <Loader2 className="h-3 w-3 animate-spin" /> : (m.isAdmin ? "Remove Admin" : "Make Admin")}
													</Button>
												)}
												{(selectedConvDetails?.chatConversationParticipants?.find((p) => p.participantId === userId)?.isAdmin || selectedConvDetails?.chatConversationParticipants?.find((p) => p.participantId === userId)?.isChatCreator) && (
													<Button size="sm" variant="destructive" className="h-7 text-xs" disabled={actionLoading?.memberId === m.participantId} onClick={() => handleRemoveMember(m.participantId)}>
														{actionLoading?.memberId === m.participantId && actionLoading?.action === "remove" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Remove"}
													</Button>
												)}
											</div>
										)}
									</div>
								))}
							</div>
						</div>
						<div className="border-t pt-3">
							<p className="text-sm font-medium mb-2">Add Members</p>
							<Input placeholder="Search users..." value={manageSearchQuery} onChange={(e) => setManageSearchQuery(e.target.value)} />
							{isManageSearching && (
								<div className="flex items-center justify-center py-2">
									<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
								</div>
							)}
							<ScrollArea className="h-24 mt-2" scrollbarClassName="w-1.5">
								<div className="space-y-2">
									{manageSearchResults
										.filter((u) => !selectedConvDetails?.chatConversationParticipants?.some((m) => m.participantId === u.id))
										.map((user) => {
											const selected = selectedToAdd.some((u) => u.id === user.id);
											return (
												<div
													key={user.id}
													className={cn("flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer", selected && "bg-muted")}
													onClick={() => setSelectedToAdd((prev) => selected ? prev.filter((u) => u.id !== user.id) : [...prev, user])}
												>
													<Avatar className="h-8 w-8"><AvatarImage src={user.profilePhoto} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium truncate">{user.name}</p>
														<p className="text-xs text-muted-foreground truncate">{user.email}</p>
													</div>
													{selected && <Check className="h-4 w-4 text-primary" />}
												</div>
											);
										})}
								</div>
							</ScrollArea>
							{selectedToAdd.length > 0 && (
								<Button onClick={handleAddGroupMembers} disabled={isAddingMembers} className="w-full mt-2">
									{isAddingMembers ? <Loader2 className="h-4 w-4 animate-spin" /> : `Add Selected (${selectedToAdd.length})`}
								</Button>
							)}
						</div>
						<div className="border-t pt-3">
							<Button variant="destructive" className="w-full" disabled={isDeletingConversation} onClick={() => {
								setIsManageGroupOpen(false);
								setIsDeleteDialogOpen(true);
							}}>
								{isDeletingConversation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
								Delete Group
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			<Dialog open={isSearchInChatOpen} onOpenChange={setIsSearchInChatOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Search in Chat</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="flex gap-2">
							<Input
								placeholder="Search messages..."
								value={searchQueryInChat}
								onChange={(e) => setSearchQueryInChat(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearchInChat()}
							/>
							<Button onClick={handleSearchInChat} disabled={!searchQueryInChat.trim() || isSearchingInChat}>
								{isSearchingInChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
							</Button>
						</div>
						{searchResultsInChat.length > 0 && (
							<ScrollArea className="h-80">
								<div className="space-y-2">
									{searchResultsInChat.map((msg) => (
										<div key={msg.chatMessageId} className="p-3 border rounded-lg hover:bg-muted cursor-pointer">
											<div className="flex items-center gap-2 mb-1">
												<Avatar className="h-6 w-6">
													<AvatarImage src={msg.chatConversationParticipant?.participantAvatar} />
													<AvatarFallback>{msg.chatConversationParticipant?.participantName?.charAt(0) || "?"}</AvatarFallback>
												</Avatar>
												<p className="text-sm font-medium">{msg.chatConversationParticipant?.participantName}</p>
												<p className="text-xs text-muted-foreground">{new Date(msg.sentAt).toLocaleString()}</p>
											</div>
											<p className="text-sm ml-8">{msg.chatMessageText}</p>
										</div>
									))}
								</div>
							</ScrollArea>
						)}
						{searchQueryInChat && searchResultsInChat.length === 0 && !isSearchInChatOpen && (
							<p className="text-sm text-muted-foreground text-center py-4">No results found</p>
						)}
					</div>
				</DialogContent>
			</Dialog>
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete {selectedConvDetails?.chatConversationType === "GROUP" ? "this group and all its messages" : "this conversation and all its messages"}. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}