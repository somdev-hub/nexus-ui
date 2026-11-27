"use client";

import { useChatStore } from "@/store/chatStore";

export function TypingIndicator() {
  const typingUsers = useChatStore((s) => s.typingUsers);
  const participants = useChatStore((s) => s.selectedConvDetails?.chatConversationParticipants);

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