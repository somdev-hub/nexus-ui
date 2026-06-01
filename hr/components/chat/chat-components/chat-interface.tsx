"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { MessageInput } from "./message-input";
import { ChatEmptyState } from "./empty-state";
import { UserSearchDialog } from "./user-search-dialog";
import { ChatConversation, ChatMessage, ChatUser } from "./types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useChatWebSocket } from "@/hooks/use-chat-websocket";
import { chatWebSocketService } from "@/lib/chat-websocket";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import {
  chatApiService,
  ChatConversation as ApiChatConversation
} from "@/lib/chat-api";
import { useToast } from "@/hooks/use-toast";

/**
 * ChatInterface Component (v2 Architecture)
 *
 * Main chat UI that orchestrates:
 * - Conversation list management
 * - WebSocket real-time messaging
 * - Message display and input
 * - User search and conversation creation
 *
 * Key Implementation Details:
 * - Uses real API calls (chatApiService) instead of mock data
 * - Manages WebSocket via use-chat-websocket hook
 * - Prevents infinite re-renders through careful ref/state management
 * - Implements fallback REST API for disconnections
 */

export function ChatInterface() {
  const {
    userId,
    orgId,
    name: userName,
    avatar: userAvatar,
    isLoading: isUserLoading
  } = useUserMetadata();
  const { toast } = useToast();

  // State
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationError, setConversationError] = useState<string | null>(
    null
  );
  const [chatMessages, setChatMessages] = useState<Map<number, ChatMessage[]>>(
    new Map()
  );
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // Refs for callbacks and lifecycle
  const selectedConvRef = useRef<string | null>(null);
  const conversationSubsRef = useRef<(() => void)[]>([]);
  const typingUserTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const callbacksRef = useRef<{
    onMessageReceived?: (message: any) => void;
    onTypingStatusChanged?: (isTyping: boolean, userId: number) => void;
    onPresenceStatusChanged?: (
      userId: number,
      status: "online" | "offline"
    ) => void;
    onError?: (error: string) => void;
  }>({});

  // cleanup conversation subscriptions
  const cleanupConversationSubs = useCallback(() => {
    conversationSubsRef.current.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        console.warn(
          "[CHAT INTERFACE] Error unsubscribing conversation topic",
          e
        );
      }
    });
    conversationSubsRef.current = [];
  }, []);

  // WebSocket hook will be initialized after participant and org IDs are available

  // Convert IDs to numbers for API calls
  const participantId = userId ? Number(userId) : null;
  const numOrgId = orgId ? Number(orgId) : null;

  // Validation
  const isUserReady = !!(participantId && numOrgId && !isUserLoading);

  // WebSocket hook (initialize after participant/org IDs are known)
  const { isConnected, connectionError, sendMessage, sendTypingIndicator } =
    useChatWebSocket({
      conversationId: selectedConversationId
        ? Number(selectedConversationId)
        : null,
      orgId: numOrgId!,
      participantId: participantId!,
      callbacksRef
    });

  /**
   * Load conversations from API
   */
  const loadConversations = useCallback(async () => {
    if (!isUserReady || !participantId || !numOrgId) return;

    try {
      setIsLoadingConversations(true);
      setConversationError(null);
      console.log(
        "[CHAT INTERFACE] Loading conversations for user:",
        participantId
      );

      const apiConversations = await chatApiService.getConversations(
        participantId,
        numOrgId
      );

      const uiConversations: ChatConversation[] =
        apiConversations &&
        apiConversations
          .filter((conv) => {
            // Filter out conversations without ID to prevent key warnings
            if (!conv.chatConversationId) {
              console.warn(
                "[CHAT INTERFACE] Skipping conversation without ID:",
                conv
              );
              return false;
            }
            return true;
          })
          .map((conv) => {
            const mappedParticipants = (
              conv.chatConversationParticipants || []
            ).map((p) => ({
              id: String(p.participantId),
              name: p.participantName,
              email: p.participantEmail,
              role: p.participantRole,
              profilePhoto: p.participantAvatar,
              status:
                p.chatParticipantCurrentStatus === "ONLINE"
                  ? ("online" as const)
                  : p.chatParticipantCurrentStatus === "AWAY"
                    ? ("away" as const)
                    : ("offline" as const)
            }));

            const participants =
              conv.chatConversationType === "DIRECT" && conv.otherParticipantId
                ? [
                    ...mappedParticipants.filter(
                      (p) => String(p.id) === String(conv.otherParticipantId)
                    ),
                    ...mappedParticipants.filter(
                      (p) => String(p.id) !== String(conv.otherParticipantId)
                    )
                  ]
                : mappedParticipants;

            return {
              id: String(conv.chatConversationId),
              name:
                conv.chatConversationType === "DIRECT"
                  ? conv.otherParticipantName || "Unnamed"
                  : conv.chatConversationName || "Unnamed",
              type: conv.chatConversationType,
              isGroup: conv.chatConversationType === "GROUP",
              participants,
              lastMessage: conv.lastMessage,
              lastMessageSenderId: conv.lastMessageSenderId,
              lastMessageSenderName: conv.lastMessageSenderName,
              lastMessageTime: conv.lastMessageAt
                ? new Date(conv.lastMessageAt)
                : undefined,
              unreadCount: conv.unreadCount || 0,
              avatar:
                conv.chatConversationType === "DIRECT"
                  ? conv.otherParticipantAvatar || conv.chatConversationAvatar
                  : conv.chatConversationAvatar,
              description: conv.chatConversationDescription,
              otherParticipantId: conv.otherParticipantId,
              otherParticipantName: conv.otherParticipantName,
              otherParticipantAvatar: conv.otherParticipantAvatar
            };
          });

      // Hydrate current online/offline presence for all conversation participants
      const presenceUserIds = Array.from(
        new Set(
          uiConversations.flatMap((conversation) =>
            (conversation.participants || [])
              .map((participant) => Number(participant.id))
              .filter((participantId) => Number.isFinite(participantId))
          )
        )
      );

      let presenceStatuses: Record<number, boolean> = {};
      if (presenceUserIds.length > 0) {
        try {
          const response =
            await chatApiService.getPresenceStatuses(presenceUserIds);
          presenceStatuses = Object.entries(response || {}).reduce(
            (acc, [key, value]) => {
              const numericKey = Number(key);
              if (Number.isFinite(numericKey)) {
                acc[numericKey] = Boolean(value);
              }
              return acc;
            },
            {} as Record<number, boolean>
          );
        } catch (presenceError) {
          console.warn(
            "[CHAT INTERFACE] Failed to hydrate presence statuses:",
            presenceError
          );
        }
      }

      const hydratedConversations = uiConversations.map((conversation) => ({
        ...conversation,
        participants: conversation.participants.map((participant) => ({
          ...participant,
          status:
            presenceStatuses[Number(participant.id)] !== undefined
              ? presenceStatuses[Number(participant.id)]
                ? "online"
                : "offline"
              : participant.status || "offline"
        }))
      }));

      setConversations(hydratedConversations);
      console.log(
        "[CHAT INTERFACE] Loaded",
        hydratedConversations?.length,
        "conversations"
      );
      // Subscribe to all conversation topics to receive real-time updates
      cleanupConversationSubs();
      hydratedConversations.forEach((conv) => {
        // skip subscribing to selected conversation because hook already subscribes to it
        if (String(conv.id) === String(selectedConversationId)) return;
        const convId = Number(conv.id);
        const unsub = chatWebSocketService.subscribe(
          `/topic/conversations/${convId}`,
          (data: any) => {
            try {
              const apiMessage = data?.message
                ? { ...data.message }
                : { ...data };
              if (!apiMessage.chatConversationId && data?.conversationId) {
                apiMessage.chatConversationId = data.conversationId;
              }
              callbacksRef.current?.onMessageReceived?.(apiMessage);
            } catch (e) {
              console.error(
                "[CHAT INTERFACE] Error in conversation subscription",
                e
              );
            }
          }
        );
        if (unsub) conversationSubsRef.current.push(unsub);
      });
    } catch (error) {
      console.error("[CHAT INTERFACE] Failed to load conversations:", error);
      setConversationError(
        error instanceof Error ? error.message : "Failed to load conversations"
      );
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setIsLoadingConversations(false);
    }
  }, [
    isUserReady,
    participantId,
    numOrgId,
    cleanupConversationSubs,
    selectedConversationId,
    toast
  ]);

  // ensure conversation subscriptions get cleaned up on unmount
  useEffect(() => {
    return () => {
      cleanupConversationSubs();
    };
  }, [cleanupConversationSubs]);

  // (Re)subscribe to conversation topics when WebSocket connection becomes active
  useEffect(() => {
    if (!isConnected || conversations.length === 0) return;

    console.log(
      "[CHAT INTERFACE] WS connected; (re)subscribing to conversation topics"
    );
    cleanupConversationSubs();
    conversations.forEach((conv) => {
      if (String(conv.id) === String(selectedConversationId)) return;
      const convId = Number(conv.id);
      const unsub = chatWebSocketService.subscribe(
        `/topic/conversations/${convId}`,
        (data: any) => {
          try {
            const apiMessage = data?.message
              ? { ...data.message }
              : { ...data };
            if (!apiMessage.chatConversationId && data?.conversationId) {
              apiMessage.chatConversationId = data.conversationId;
            }
            callbacksRef.current?.onMessageReceived?.(apiMessage);
          } catch (e) {
            console.error(
              "[CHAT INTERFACE] Error in conversation subscription",
              e
            );
          }
        }
      );
      if (unsub) conversationSubsRef.current.push(unsub);
    });

    return () => {
      cleanupConversationSubs();
    };
  }, [
    isConnected,
    conversations,
    selectedConversationId,
    cleanupConversationSubs
  ]);

  /**
   * Load messages for selected conversation
   */
  const loadMessages = useCallback(
    async (conversationIdStr: string) => {
      if (!isUserReady || !participantId || !numOrgId) return;

      const conversationId = Number(conversationIdStr);
      try {
        setIsLoadingMessages(true);
        console.log(
          "[CHAT INTERFACE] Loading messages for conversation:",
          conversationId
        );

        const apiMessages = await chatApiService.getMessages(
          conversationId,
          participantId,
          numOrgId
        );

        const uiMessages: ChatMessage[] = apiMessages
          .map((apiMsg) => ({
            id: String(apiMsg.chatMessageId),
            senderId: String(apiMsg.chatConversationParticipant.participantId),
            senderName: apiMsg.chatConversationParticipant.participantName,
            senderAvatar: apiMsg.chatConversationParticipant.participantAvatar,
            content: apiMsg.chatMessageText || "",
            timestamp: new Date(apiMsg.sentAt),
            isOwn:
              apiMsg.chatConversationParticipant.participantId ===
              participantId,
            status: apiMsg.chatMessageStatus.toLowerCase() as
              | "sent"
              | "delivered"
              | "received",
            attachments: apiMsg.chatMessageAttachmentList?.map((att) => ({
              chatMessageAttachmentId: att.chatMessageAttachmentId,
              fileName: att.fileName,
              dmsId: att.dmsId,
              filePath: att.filePath,
              attachmentType: att.attachmentType,
              createdAt: att.createdAt,
              updatedAt: att.updatedAt,
              isActive: att.isActive
            })),
            isEdited: apiMsg.isEdited,
            messageSeenByList: apiMsg.messageSeenByList
          }))
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        setChatMessages((prev) => {
          const map = new Map(prev);
          map.set(conversationId, uiMessages);
          return map;
        });

        console.log("[CHAT INTERFACE] Loaded", uiMessages.length, "messages");
      } catch (error) {
        console.error("[CHAT INTERFACE] Failed to load messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive"
        });
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [isUserReady, participantId, numOrgId, toast]
  );

  /**
   * Initialize conversations on mount
   */
  useEffect(() => {
    if (!isUserReady) return;
    void loadConversations();
  }, [isUserReady, loadConversations]);

  /**
   * Load messages when conversation is selected
   */
  useEffect(() => {
    if (!selectedConversationId || !isUserReady) return;
    void loadMessages(selectedConversationId);
  }, [selectedConversationId, isUserReady, loadMessages]);

  /**
   * Update ref when selected conversation changes
   */
  useEffect(() => {
    selectedConvRef.current = selectedConversationId;
  }, [selectedConversationId]);

  /**
   * Setup WebSocket callbacks
   */
  useEffect(() => {
    callbacksRef.current = {
      onMessageReceived: (payload: any) => {
        const apiMessage = payload?.message ? { ...payload.message } : payload;
        if (!apiMessage) return;

        console.log(
          "[CHAT INTERFACE] Received message:",
          apiMessage.chatMessageId || apiMessage.messageId
        );

        const conversationId = apiMessage.chatConversationId;
        const uiMessage: ChatMessage = {
          id: String(apiMessage.chatMessageId || apiMessage.messageId),
          senderId: String(
            apiMessage.chatConversationParticipant?.participantId ||
              apiMessage.participantId ||
              participantId
          ),
          senderName:
            apiMessage.chatConversationParticipant?.participantName ||
            apiMessage.participantName ||
            "Unknown",
          senderAvatar:
            apiMessage.chatConversationParticipant?.participantAvatar ||
            apiMessage.participantAvatar,
          content: apiMessage.chatMessageText || apiMessage.content || "",
          timestamp: new Date(
            apiMessage.sentAt || apiMessage.createdAt || Date.now()
          ),
          isOwn:
            String(
              apiMessage.chatConversationParticipant?.participantId ||
                apiMessage.participantId ||
                participantId
            ) === String(participantId),
          status: (
            apiMessage.chatMessageStatus ||
            apiMessage.status ||
            "sent"
          ).toLowerCase() as "sent" | "delivered" | "received" | "read",
          attachments: apiMessage.chatMessageAttachmentList?.map(
            (att: any) => ({
              chatMessageAttachmentId: att.chatMessageAttachmentId,
              fileName: att.fileName,
              dmsId: att.dmsId,
              filePath: att.filePath,
              attachmentType: att.attachmentType,
              createdAt: att.createdAt,
              updatedAt: att.updatedAt,
              isActive: att.isActive
            })
          ),
          messageSeenByList: apiMessage.messageSeenByList
        };

        setChatMessages((prev) => {
          const map = new Map(prev);
          const messages = map.get(conversationId) || [];

          const alreadyExists = messages.some(
            (m) => String(m.id) === String(uiMessage.id)
          );
          if (!alreadyExists) {
            // Replace matching optimistic temp message from sender echo.
            const optimisticIndex = messages.findIndex(
              (m) =>
                String(m.id).startsWith("temp-") &&
                m.isOwn === uiMessage.isOwn &&
                m.content === uiMessage.content
            );

            if (optimisticIndex >= 0) {
              const next = [...messages];
              next[optimisticIndex] = uiMessage;
              map.set(conversationId, next);
            } else {
              messages.push(uiMessage);
              map.set(conversationId, [...messages]);
            }
          }

          return map;
        });

        // Update conversation list
        setConversations((prev) =>
          prev.map((conv) =>
            String(conv.id) === String(conversationId)
              ? {
                  ...conv,
                  lastMessage: uiMessage.content,
                  lastMessageSenderId: Number(uiMessage.senderId),
                  lastMessageSenderName: uiMessage.senderName,
                  lastMessageTime: uiMessage.timestamp,
                  unreadCount: uiMessage.isOwn
                    ? 0
                    : String(conv.id) === String(selectedConversationId)
                      ? 0
                      : (conv.unreadCount || 0) + 1
                }
              : conv
          )
        );
      },

      onTypingStatusChanged: (isTyping: boolean, userId: number) => {
        const userIdStr = String(userId);
        if (userIdStr === String(participantId)) return; // Ignore own typing

        const existingTimeout = typingUserTimeoutsRef.current.get(userIdStr);
        if (existingTimeout) clearTimeout(existingTimeout);

        setTypingUsers((prev) => {
          const updated = new Set(prev);
          if (isTyping) {
            updated.add(userIdStr);
            // Auto-clear after 5 seconds
            const timeout = setTimeout(() => {
              setTypingUsers((curr) => {
                const next = new Set(curr);
                next.delete(userIdStr);
                return next;
              });
              typingUserTimeoutsRef.current.delete(userIdStr);
            }, 5000);
            typingUserTimeoutsRef.current.set(userIdStr, timeout);
          } else {
            updated.delete(userIdStr);
          }
          return updated;
        });
      },

      onPresenceStatusChanged: (
        userId: number,
        status: "online" | "offline"
      ) => {
        console.log(`[CHAT INTERFACE] User ${userId} is now ${status}`);
        // Update conversations to reflect the participant's online status
        setConversations((prev) =>
          prev.map((conv) => ({
            ...conv,
            participants: conv.participants.map((participant) =>
              String(participant.id) === String(userId)
                ? { ...participant, status }
                : participant
            )
          }))
        );
      },

      onError: (error: string) => {
        console.error("[CHAT INTERFACE] WebSocket error:", error);
        toast({
          title: "Connection Error",
          description: error,
          variant: "destructive"
        });
      }
    };
  }, [participantId, selectedConversationId, toast]);

  /**
   * WebSocket hook (already initialized above)
   */

  /**
   * Handle sending message
   */
  const handleSendMessage = useCallback(
    (text: string, attachments: any[] = []) => {
      if (!selectedConversationId) {
        toast({
          title: "Error",
          description: "No conversation selected",
          variant: "destructive"
        });
        return;
      }

      console.log(
        "[CHAT INTERFACE] Sending message with",
        attachments.length,
        "attachments"
      );

      // Create optimistic message to display immediately
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        senderId: String(participantId),
        senderName: userName || "You",
        senderAvatar: userAvatar,
        content: text,
        timestamp: new Date(),
        isOwn: true,
        status: "sent",
        attachments: attachments.map((att) => ({
          chatMessageAttachmentId: att.chatMessageAttachmentId || 0,
          fileName: att.fileName,
          dmsId: att.dmsId || "",
          filePath: att.filePath || "",
          attachmentType: att.attachmentType || "FILE",
          createdAt: att.createdAt || new Date().toISOString(),
          updatedAt: att.updatedAt || new Date().toISOString(),
          isActive: att.isActive !== false
        })),
        messageSeenByList: []
      };

      // Add optimistic message to UI immediately
      setChatMessages((prev) => {
        const map = new Map(prev);
        const conversationId = Number(selectedConversationId);
        const currentMessages = map.get(conversationId) || [];
        map.set(conversationId, [...currentMessages, optimisticMessage]);
        return map;
      });

      // Keep conversation preview in sync immediately for sender side
      setConversations((prev) =>
        prev.map((conv) =>
          String(conv.id) === String(selectedConversationId)
            ? {
                ...conv,
                lastMessage: text,
                lastMessageSenderId: participantId || undefined,
                lastMessageSenderName: userName || "You",
                lastMessageTime: new Date(),
                unreadCount: 0
              }
            : conv
        )
      );

      // Send to server
      const success = sendMessage(text, attachments);

      if (!success && !isConnected) {
        toast({
          title: "Offline",
          description:
            "Message sent but may not be delivered due to connection issues",
          variant: "default"
        });
      }
    },
    [
      selectedConversationId,
      participantId,
      userName,
      userAvatar,
      sendMessage,
      isConnected,
      toast
    ]
  );

  /**
   * Handle typing indicator
   */
  const handleTyping = useCallback(() => {
    if (isConnected && selectedConversationId) {
      sendTypingIndicator();
    }
  }, [isConnected, selectedConversationId, sendTypingIndicator]);

  /**
   * Handle conversation selection
   */
  const handleSelectConversation = useCallback((id: string) => {
    console.log("[CHAT INTERFACE] Selecting conversation:", id);
    setSelectedConversationId(id);
    // Mark as read
    setConversations((prev) =>
      prev.map((conv) =>
        String(conv.id) === String(id) ? { ...conv, unreadCount: 0 } : conv
      )
    );
  }, []);

  /**
   * Handle new conversation created
   */
  const handleNewConversation = useCallback(
    (conversation: ApiChatConversation, selectedUser: ChatUser) => {
      console.log(
        "[CHAT INTERFACE] New conversation with user:",
        selectedUser.id
      );
      setIsSearchDialogOpen(false);
      // Reload conversations to get the new one
      void loadConversations();
    },
    [loadConversations]
  );

  /**
   * Handle back button on mobile
   */
  const handleBack = useCallback(() => {
    setSelectedConversationId(null);
    setTypingUsers(new Set());
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    const timeouts = typingUserTimeoutsRef.current;

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const selectedConversation =
    conversations &&
    conversations.find((c) => String(c.id) === String(selectedConversationId));
  const currentMessages = selectedConversationId
    ? chatMessages.get(Number(selectedConversationId)) || []
    : [];

  if (!isUserReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex w-full h-full bg-background flex-col">
      {/* Error Alerts */}
      {conversationError && (
        <div className="m-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {conversationError}
        </div>
      )}
      {connectionError && (
        <div className="m-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {connectionError}
        </div>
      )}

      <div className="flex w-full h-full">
        {/* Sidebar - visible on md+ screens */}
        <div className="hidden md:flex md:flex-col md:w-80 lg:w-96 shrink-0 border-r h-full overflow-hidden">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <ChatSidebar
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              onNewChatClick={() => setIsSearchDialogOpen(true)}
              currentUserId={participantId}
            />
          )}
        </div>

        {/* Mobile view */}
        <div className="flex flex-col w-full h-full md:hidden">
          {!selectedConversation ? (
            isLoadingConversations ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <ChatSidebar
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                onSelectConversation={handleSelectConversation}
                onNewChatClick={() => setIsSearchDialogOpen(true)}
                currentUserId={participantId}
              />
            )
          ) : (
            <>
              <div className="flex items-center gap-2 p-3 border-b bg-card shrink-0">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="size-5" />
                </Button>
                <ChatHeader
                  conversation={selectedConversation}
                  isMobile
                  currentUserId={participantId}
                />
              </div>
              <ChatMessages
                messages={currentMessages}
                typingUsers={typingUsers}
              />
              <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                isConnected={isConnected}
                orgId={numOrgId}
                participantId={participantId}
              />
            </>
          )}
        </div>

        {/* Desktop chat area */}
        <div className="hidden md:flex md:flex-col flex-1 h-full min-w-0 overflow-hidden">
          {selectedConversation ? (
            <>
              <ChatHeader
                conversation={selectedConversation}
                currentUserId={participantId}
              />
              {isLoadingMessages ? (
                <div className="flex items-center justify-center flex-1">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <ChatMessages
                  messages={currentMessages}
                  typingUsers={typingUsers}
                />
              )}
              <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                isConnected={isConnected}
                orgId={numOrgId}
                participantId={participantId}
              />
            </>
          ) : (
            <ChatEmptyState />
          )}
        </div>
      </div>

      {/* User Search Dialog */}
      <UserSearchDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onUserSelected={handleNewConversation}
        orgId={orgId!}
        userId={userId!}
      />
    </div>
  );
}
