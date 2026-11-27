"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/chat";

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  isSending: boolean;
  replyingTo: ChatMessage | null;
  onSendMessage: () => void;
  onCancelReply: () => void;
  wsConnected: boolean;
  selectedConvId: number | null;
  userId: number | null;
  sendTypingIndicator: (convId: number, userId: number, isTyping: boolean) => void;
}

export function ChatInput({
  newMessage,
  setNewMessage,
  isSending,
  replyingTo,
  onSendMessage,
  onCancelReply,
  wsConnected,
  selectedConvId,
  userId,
  sendTypingIndicator,
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (replyingTo) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [replyingTo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (wsConnected && selectedConvId && userId) {
      sendTypingIndicator(selectedConvId, userId, true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <>
      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="p-2 border-t bg-muted/50 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 min-w-0 border-l-2 border-primary pl-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary truncate">
                {replyingTo.chatConversationParticipant?.participantName || "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {replyingTo.chatMessageText || ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={onCancelReply}
              aria-label="Cancel reply"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <div className="p-3 border-t flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          className="flex-1"
        />
        <Button onClick={onSendMessage} disabled={!newMessage.trim() || isSending}>
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </>
  );
}