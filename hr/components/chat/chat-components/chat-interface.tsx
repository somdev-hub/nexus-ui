"use client";

import { useState, useRef, useEffect } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { MessageInput } from "./message-input";
import { ChatEmptyState } from "./empty-state";
import { UserSearchDialog } from "./user-search-dialog";
import {
  messages as initialMessages,
  ChatMessageType
} from "./data";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useChatWebSocket } from "@/hooks/use-chat-websocket";
import { AlertCircle } from "lucide-react";
import { chatApiService } from "@/lib/chat-api";

export function ChatInterface({
  userId = "0",
  orgId = "0"
}: {
  orgId?: string;
  userId?: string;
}) {
  console.log("🔁 RENDER");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [chatMessages, setChatMessages] = useState(initialMessages);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationError, setConversationError] = useState<string | null>(null);

  // Store state values in refs for callbacks to access without dependencies
  const selectedConvRef = useRef<string | null>(null);

  console.log(
    "🔁 ChatInterface re-rendered, selectedConversationId:",
    selectedConversationId
  );

  // Fetch conversations on component mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoadingConversations(true);
        setConversationError(null);
        const numOrgId = parseInt(orgId, 10) || 0;
        const numUserId=parseInt(userId) || 0;
        const result = await chatApiService.getConversations(numOrgId, numUserId);
        setConversations(result?.content || []);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
        setConversationError("Failed to load conversations");
      } finally {
        setIsLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [orgId]);

  // Update refs when state changes
  useEffect(() => {
    selectedConvRef.current = selectedConversationId;
  }, [selectedConversationId]);

  // Callbacks that never change - they use refs instead of closures
  // ✅ Create ref with empty object once
  const callbacksRef = useRef<{
    onMessageReceived?: (message: any) => void;
    onTypingStatusChanged?: (isTyping: boolean, userId: string) => void;
    onPresenceChanged?: (event: "joined" | "left", userId: string) => void;
    onError?: (error: string) => void;
  }>({
    // ✅ FIX ISSUE #8: Initialize with placeholder functions to prevent stale closures
    onMessageReceived: () => {},
    onTypingStatusChanged: () => {},
    onPresenceChanged: () => {},
    onError: () => {}
  });

  // ✅ Update .current ONLY on mount to prevent infinite reconnects
  useEffect(() => {
    callbacksRef.current = {
      onMessageReceived: (message: any) => {
        const convId = selectedConvRef.current;
        if (convId) {
          setChatMessages((prev) => ({
            ...prev,
            [convId]: [
              ...(prev[convId] || []),
              {
                id: message.id || `m${Date.now()}`,
                senderId: message.senderId,
                senderName: message.senderName || "Unknown",
                content: message.content,
                timestamp: new Date(message.timestamp || Date.now()),
                isOwn: message.isOwn || false,
                status: message.status
              }
            ]
          }));
        }
      },
      onTypingStatusChanged: (isTyping: boolean, userId: string) => {
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          if (isTyping) {
            updated.add(userId);
          } else {
            updated.delete(userId);
          }
          return updated;
        });
      },
      onPresenceChanged: (event: "joined" | "left", userId: string) => {
        console.log(`User ${userId} ${event} the conversation`);
      },
      onError: (error: string) => {
        console.error("Chat error:", error);
      }
    };
  }, []);

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  const currentMessages =
    selectedConversationId && chatMessages[selectedConversationId]
      ? chatMessages[selectedConversationId]
      : [];

  // Handle new conversation from search
  const handleNewConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsSearchDialogOpen(false);
  };

  // WebSocket hook for real-time messaging
  // ✅ Pass null-safe stable value
  const activeConversationId = selectedConversationId ?? "";

  const {
    isConnected,
    connectionError: wsError,
    sendMessage,
    notifyTyping,
    notifyStopTyping,
    notifyLeft
  } = useChatWebSocket({
    userId,
    conversationId: activeConversationId,
    orgId,
    callbacksRef
  });

  const handleSendMessage = (content: string) => {
    if (!selectedConversationId || !content.trim()) return;

    // Try to send via WebSocket
    const success = sendMessage(content);

    if (success) {
      // Add optimistic message
      const newMessage: ChatMessageType = {
        id: `m${Date.now()}`,
        senderId: "user-0",
        senderName: "You",
        content,
        timestamp: new Date(),
        isOwn: true,
        status: "sent"
      };

      setChatMessages((prev) => ({
        ...prev,
        [selectedConversationId]: [
          ...(prev[selectedConversationId] || []),
          newMessage
        ]
      }));

      // Notify stop typing
      notifyStopTyping();
    } else if (!isConnected) {
      // WebSocket not connected - would be caught by wsError state
    }
  };

  const handleBack = () => {
    // Notify user left before clearing state
    if (selectedConversationId) {
      notifyLeft();
      // Clear state after notification
      setSelectedConversationId(null);
      setTypingUsers(new Set());
    }
  };

  const handleTyping = () => {
    if (isConnected && selectedConversationId) {
      notifyTyping();
    }
  };

  return (
    <div className="flex w-full h-full bg-background flex-col">
      {/* Error Alerts */}
      {conversationError && (
        <div className="m-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {conversationError}
        </div>
      )}
      {wsError && (
        <div className="m-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {wsError}
        </div>
      )}

      <div className="flex w-full h-full">
        {/* Sidebar - visible on md+ screens */}
        <div className="hidden md:flex md:flex-col md:w-80 lg:w-96 shrink-0 border-r h-full overflow-hidden">
          <ChatSidebar
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            onNewChatClick={() => setIsSearchDialogOpen(true)}
          />
        </div>

        {/* Mobile view */}
        <div className="flex flex-col w-full h-full md:hidden">
          {!selectedConversationId ? (
            <ChatSidebar
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              onNewChatClick={() => setIsSearchDialogOpen(true)}
            />
          ) : (
            <>
              <div className="flex items-center gap-2 p-3 border-b bg-card shrink-0">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="size-5" />
                </Button>
                <ChatHeader conversation={selectedConversation!} isMobile />
              </div>
              <ChatMessages
                messages={currentMessages}
                typingUsers={typingUsers}
              />
              <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                isConnected={isConnected}
              />
            </>
          )}
        </div>

        {/* Desktop chat area */}
        <div className="hidden md:flex md:flex-col flex-1 h-full min-w-0 overflow-hidden">
          {selectedConversation ? (
            <>
              <ChatHeader conversation={selectedConversation} />
              <ChatMessages
                messages={currentMessages}
                typingUsers={typingUsers}
              />
              <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                isConnected={isConnected}
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
        orgId={orgId}
        userId={userId}
      />
    </div>
  );
}
