"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onTyping?: () => void;
  isConnected?: boolean;
}

export function MessageInput({
  onSendMessage,
  onTyping,
  isConnected = true
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSend = () => {
    if (message.trim() && isConnected) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Notify typing with debounce
    if (onTyping && isConnected) {
      onTyping();

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        // Typing indicator will auto-stop after 3 seconds on the hook
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t bg-card shrink-0">
      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          disabled={!isConnected}
        >
          <Paperclip className="size-5" />
        </Button>
        <div className="flex-1 relative">
          <Textarea
            placeholder="Type a message..."
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className="min-h-10 max-h-32 resize-none pr-10"
            disabled={!isConnected}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 bottom-1 size-8"
            disabled={!isConnected}
          >
            <Smile className="size-5" />
          </Button>
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim() || !isConnected}
          size="icon"
          className="shrink-0"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
