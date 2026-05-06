"use client";

import { useState } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { MessageInput } from "./message-input";
import { ChatEmptyState } from "./empty-state";
import {
  conversations,
  messages as initialMessages,
  ChatMessage as ChatMessageType
} from "./data";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function ChatInterface() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [chatMessages, setChatMessages] = useState(initialMessages);

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  const currentMessages =
    selectedConversationId && chatMessages[selectedConversationId]
      ? chatMessages[selectedConversationId]
      : [];

  const handleSendMessage = (content: string) => {
    if (!selectedConversationId) return;

    const newMessage: ChatMessageType = {
      id: `m${Date.now()}`,
      senderId: "user-0",
      senderName: "You",
      content,
      timestamp: new Date(),
      isOwn: true
    };

    setChatMessages((prev) => ({
      ...prev,
      [selectedConversationId]: [
        ...(prev[selectedConversationId] || []),
        newMessage
      ]
    }));
  };

  const handleBack = () => {
    setSelectedConversationId(null);
  };

  return (
    <div className="flex w-full h-full bg-background">
      {/* Sidebar - visible on md+ screens */}
      <div className="hidden md:flex md:flex-col md:w-80 lg:w-96 shrink-0 border-r h-full overflow-hidden">
        <ChatSidebar
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
        />
      </div>

      {/* Mobile view */}
      <div className="flex flex-col w-full h-full md:hidden">
        {!selectedConversationId ? (
          <ChatSidebar
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
          />
        ) : (
          <>
            <div className="flex items-center gap-2 p-3 border-b bg-card shrink-0">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="size-5" />
              </Button>
              <ChatHeader conversation={selectedConversation!} isMobile />
            </div>
            <ChatMessages messages={currentMessages} />
            <MessageInput onSendMessage={handleSendMessage} />
          </>
        )}
      </div>

      {/* Desktop chat area */}
      <div className="hidden md:flex md:flex-col flex-1 h-full min-w-0 overflow-hidden">
        {selectedConversation ? (
          <>
            <ChatHeader conversation={selectedConversation} />
            <ChatMessages messages={currentMessages} />
            <MessageInput onSendMessage={handleSendMessage} />
          </>
        ) : (
          <ChatEmptyState />
        )}
      </div>
    </div>
  );
}
