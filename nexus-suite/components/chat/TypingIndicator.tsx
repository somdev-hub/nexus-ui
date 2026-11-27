"use client";

import type { ChatConversationParticipant } from "@/types/chat";

interface TypingIndicatorProps {
  typingUsers: number[];
  participants: ChatConversationParticipant[] | undefined;
  currentUserId: number | null;
}

export function TypingIndicator({
  typingUsers,
  participants,
  currentUserId,
}: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingUserNames = () => {
    return typingUsers
      .map((id) => participants?.find((p) => p.participantId === id)?.participantName || "Someone")
      .join(", ");
  };

  return (
    <div className="px-3 py-1 text-xs text-muted-foreground italic">
      {getTypingUserNames()}{" "}
      {typingUsers.length > 1 ? "are" : "is"} typing...
    </div>
  );
}