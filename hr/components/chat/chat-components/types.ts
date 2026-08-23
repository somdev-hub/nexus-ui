/**
 * Chat Component Types (v2)
 *
 * Aligned with backend ChatMessage and ChatConversation entities
 */

export interface ChatMessageAttachment {
  chatMessageAttachmentId: number;
  fileName: string;
  dmsId: string;
  filePath: string;
  attachmentType: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ChatUser {
  id: string | number;
  name: string;
  profilePhoto?: string;
  avatar?: string;
  status?: "online" | "away" | "offline";
  email?: string;
  department?: string;
  phone?: string;
  role?: string;
}

export interface ChatMessage {
  id: string | number; // chatMessageId
  senderId: string | number; // participantId
  senderName: string;
  senderAvatar?: string;
  content: string; // chatMessageText
  timestamp: Date; // sentAt
  isOwn: boolean;
  status?: "sent" | "delivered" | "received" | "read";
  attachments?: ChatMessageAttachment[];
  isEdited?: boolean;
  messageSeenByList?: Array<{
    participantId: number;
    participantName: string;
    participantAvatar?: string;
  }>;
}

export interface ChatConversation {
  id: string | number; // chatConversationId
  name: string; // chatConversationName
  avatar?: string; // chatConversationAvatar
  description?: string; // chatConversationDescription
  lastMessage?: string;
  lastMessageSenderId?: number;
  lastMessageSenderName?: string;
  lastMessageTime?: Date; // lastMessageAt
  unreadCount?: number;
  isGroup: boolean; // type === "GROUP"
  participants: ChatUser[];
  type: "DIRECT" | "GROUP"; // chatConversationType
  orgId?: string | number;
  createdAt?: Date;
  participantIds?: number[];
  participantId?: number | string;
  participantName?: string | null;
  participantEmail?: string | null;
  participantRole?: string | null;
  participantAvatarUrl?: string | null;
  otherParticipantId?: number;
  otherParticipantName?: string;
  otherParticipantAvatar?: string;
}

export interface TypingIndicator {
  conversationId: number;
  userId: number;
  isTyping: boolean;
}
