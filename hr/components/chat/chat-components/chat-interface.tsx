"use client";

import { useState } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { MessageInput } from "./message-input";
import { ChatEmptyState } from "./empty-state";
import { UserSearchDialog } from "./user-search-dialog";
import {
  conversations as initialConversations,
  messages as initialMessages,
  ChatMessageType
} from "./data";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useChatWebSocket } from "@/hooks/use-chat-websocket";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function ChatInterface({userId = "0", orgId = "0" }: { orgId?: string, userId?: string }) {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [chatMessages, setChatMessages] = useState(initialMessages);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // Use initialConversations directly (in a real app, this would come from API)
  const conversations = initialConversations;

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
  const {
    isConnected,
    connectionError: wsError,
    sendMessage,
    notifyTyping,
    notifyStopTyping,
    notifyLeft
  } = useChatWebSocket({
    userId,
    conversationId: selectedConversationId || "",
    orgId,
    onMessageReceived: (message) => {
      // Add received message to chat
      if (selectedConversationId) {
        setChatMessages((prev) => ({
          ...prev,
          [selectedConversationId]: [
            ...(prev[selectedConversationId] || []),
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
    onTypingStatusChanged: (isTyping, userId) => {
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
    onPresenceChanged: (event, userId) => {
      console.log(`User ${userId} ${event} the conversation`);
    },
    onError: (error) => {
      console.error("Chat error:", error);
    }
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
      {/* Error Alert */}
      {wsError && (
        <Alert variant="destructive" className="m-2 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{wsError}</AlertDescription>
        </Alert>
      )}

      {/* Connection Status */}
      {!isConnected && !wsError && selectedConversationId && (
        <Alert variant="default" className="m-2 rounded-md bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Reconnecting to chat...
          </AlertDescription>
        </Alert>
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
      />
    </div>
  );
}
