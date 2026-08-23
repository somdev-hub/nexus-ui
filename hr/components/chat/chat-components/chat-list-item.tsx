"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChatConversation } from "./types";
import { formatTime, getInitials } from "./data";
import { Check, Minus, X } from "lucide-react";

interface ChatListItemProps {
  conversation: ChatConversation;
  isSelected: boolean;
  onClick: (id: string) => void;
  currentUserId?: string | number;
}

export function ChatListItem({
  conversation,
  isSelected,
  onClick,
  currentUserId
}: ChatListItemProps) {
  const primaryParticipant =
    conversation.participants.find(
      (participant) => String(participant.id) !== String(currentUserId)
    ) || conversation.participants[0];
  const status = primaryParticipant?.status ?? "offline";

  const hasUnread = (conversation.unreadCount || 0) > 0;
  const isLastMessageOwn =
    conversation.lastMessageSenderId !== undefined &&
    String(conversation.lastMessageSenderId) === String(currentUserId);
  const shouldHighlightLastMessage = hasUnread && !isLastMessageOwn;

  const statusIcon =
    status === "online" ? (
      <Check className="size-2.5 text-white" />
    ) : status === "away" ? (
      <Minus className="size-2.5 text-white" />
    ) : (
      <X className="size-2.5 text-white" />
    );

  const statusClass =
    status === "online"
      ? "bg-green-500"
      : status === "away"
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <button
      type="button"
      onClick={() => onClick(String(conversation.id))}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "bg-accent"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="size-10">
          <AvatarImage src={conversation.avatar} alt={conversation.name} />
          <AvatarFallback>{getInitials(conversation.name)}</AvatarFallback>
        </Avatar>
        {conversation.participants.length > 0 && (
          <span
            className={cn(
              "absolute bottom-0 right-0 size-4 rounded-full border-2 border-card flex items-center justify-center",
              statusClass
            )}
          >
            {statusIcon}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate text-foreground">
            {conversation.name}
          </p>
          <span className="text-xs text-muted-foreground shrink-0">
            {conversation.lastMessageTime
              ? formatTime(conversation.lastMessageTime)
              : ""}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <p
            className={cn(
              "text-xs truncate",
              !conversation.lastMessage
                ? "text-blue-500"
                : shouldHighlightLastMessage
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
            )}
          >
            {conversation.lastMessage || "New Conversation"}
          </p>
          {(conversation.unreadCount || 0) > 0 && (
            <Badge
              variant="default"
              className="shrink-0 text-xs h-5 min-w-5 px-1.5"
            >
              {conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
