"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChatMessage } from "./types";
import { MessageBubble } from "./message-bubble";
import { useEffect, useRef } from "react";

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
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
        {Object.entries(groupedMessages).map(([date, msgs],i) => (
          <div key={i} className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground font-medium shrink-0">
                {date}
              </span>
              <Separator className="flex-1" />
            </div>
            <div className="flex flex-col gap-3">
              {msgs.map((msg,i) => (
                <MessageBubble key={i} message={msg} />
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
