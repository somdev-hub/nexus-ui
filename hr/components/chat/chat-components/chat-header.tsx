"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatConversation } from "./types";
import { getInitials, getStatusColor } from "./data";
import { Phone, Video, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  conversation: ChatConversation;
  isMobile?: boolean;
}

export function ChatHeader({
  conversation,
  isMobile = false
}: ChatHeaderProps) {
  if (isMobile) {
    return (
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative shrink-0">
          <Avatar className="size-9">
            <AvatarImage src={conversation?.avatar} alt={conversation?.name} />
            <AvatarFallback>{getInitials(conversation?.name)}</AvatarFallback>
          </Avatar>
          {conversation?.participants.length > 0 && (
            <span
              className={cn(
                "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card",
                getStatusColor(conversation.participants[0].status)
              )}
            />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-medium text-sm truncate">{conversation?.name}</h2>
          <p className="text-xs text-muted-foreground">
            {conversation?.isGroup
              ? `${conversation?.participants.length} members`
              : conversation?.participants[0]?.status === "online"
                ? "Active now"
                : "Offline"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <Avatar className="size-10">
            <AvatarImage src={conversation.avatar} alt={conversation.name} />
            <AvatarFallback>{getInitials(conversation.name)}</AvatarFallback>
          </Avatar>
          {conversation.participants.length > 0 && (
            <span
              className={cn(
                "absolute bottom-0 right-0 size-3 rounded-full border-2 border-card",
                getStatusColor(conversation.participants[0].status)
              )}
            />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold truncate">{conversation.name}</h2>
          <p className="text-xs text-muted-foreground">
            {conversation.isGroup
              ? `${conversation.participants.length} members`
              : conversation.participants[0]?.status === "online"
                ? "Active now"
                : "Offline"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon">
          <Phone className="size-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="size-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="size-4" />
        </Button>
      </div>
    </div>
  );
}
