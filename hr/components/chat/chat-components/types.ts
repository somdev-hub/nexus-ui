export interface ChatUser {
  id: string | number;
  name: string;
  profilePhoto?: string;
  avatar?: string;
  status?: "online" | "away" | "offline";
  email?: string;
  department?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string | number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
}

export interface ChatConversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  isGroup: boolean;
  participants: ChatUser[];
  type: "DIRECT" | "GROUP";
  orgId?: string;
  createdAt?: Date;
  participantIds?: number[];
}
