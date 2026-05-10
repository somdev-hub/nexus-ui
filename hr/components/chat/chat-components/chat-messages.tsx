"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChatMessage } from "./types";
import { MessageBubble } from "./message-bubble";
import { useEffect, useRef } from "react";

interface ChatMessagesProps {
  messages: ChatMessage[];
  typingUsers?: Set<string>;
}

export function ChatMessages({
  messages,
  typingUsers = new Set()
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const groupedMessages = messages.reduce(
    (acc, msg) => {
      const date = msg.timestamp.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric"
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(msg);
      return acc;
    },
    {} as Record<string, ChatMessage[]>
  );

  if (messages.length === 0) {
    return (
      <div className="flex-1 w-full flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground text-sm">
          No messages yet. Start the conversation!
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 h-72 w-full bg-muted/30">
      <div className="p-4">
        {Object.entries(groupedMessages).map(([date, msgs], i) => (
          <div key={i} className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground font-medium shrink-0">
                {date}
              </span>
              <Separator className="flex-1" />
            </div>
            <div className="flex flex-col gap-3">
              {msgs.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
            </div>
          </div>
        ))}
        {typingUsers.size > 0 && (
          <div className="flex items-center gap-2 py-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100" />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" />
            </div>
            <span className="text-xs text-muted-foreground">
              {typingUsers.size === 1
                ? "Someone is typing..."
                : `${typingUsers.size} people are typing...`}
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
