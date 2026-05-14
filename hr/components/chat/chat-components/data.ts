import { ChatConversation, ChatMessage, ChatUser } from "./types";
import { chatApiService } from "@/lib/chat-api";

// Mock data for development/fallback
export const mockConversations: ChatConversation[] = [
  {
    id: "1",
    name: "Sarah Anderson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    lastMessage: "That sounds great! Let me check my calendar.",
    lastMessageTime: new Date(Date.now() - 5 * 60000),
    unreadCount: 2,
    isGroup: false,
    type: "DIRECT",
    participants: [
      {
        id: "user-1",
        name: "Sarah Anderson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        status: "online"
      }
    ]
  }
];

export const conversations = mockConversations;

export type ChatMessageType = ChatMessage;

// Export mock messages as fallback
export const messages: Record<string, ChatMessage[]> = {
  "1": [
    {
      id: "m1",
      senderId: "user-1",
      senderName: "Sarah Anderson",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      content: "Hey, how was your weekend?",
      timestamp: new Date(Date.now() - 20 * 60000),
      isOwn: false
    },
    {
      id: "m2",
      senderId: "user-0",
      senderName: "You",
      content: "Pretty good! Just relaxed at home. You?",
      timestamp: new Date(Date.now() - 18 * 60000),
      isOwn: true
    },
    {
      id: "m3",
      senderId: "user-1",
      senderName: "Sarah Anderson",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      content: "Nice! I went hiking with some friends",
      timestamp: new Date(Date.now() - 15 * 60000),
      isOwn: false
    },
    {
      id: "m4",
      senderId: "user-0",
      senderName: "You",
      content: "That sounds nice! We should grab coffee soon",
      timestamp: new Date(Date.now() - 10 * 60000),
      isOwn: true
    },
    {
      id: "m5",
      senderId: "user-1",
      senderName: "Sarah Anderson",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      content: "That sounds great! Let me check my calendar.",
      timestamp: new Date(Date.now() - 5 * 60000),
      isOwn: false
    }
  ],
  "2": [
    {
      id: "m6",
      senderId: "user-2",
      senderName: "John Smith",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
      content: "Morning everyone! Quick design sync at 10am?",
      timestamp: new Date(Date.now() - 30 * 60000),
      isOwn: false
    },
    {
      id: "m7",
      senderId: "user-3",
      senderName: "Emily Davis",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
      content: "Sounds good! I can make it",
      timestamp: new Date(Date.now() - 25 * 60000),
      isOwn: false
    },
    {
      id: "m8",
      senderId: "user-0",
      senderName: "You",
      content: "Count me in!",
      timestamp: new Date(Date.now() - 20 * 60000),
      isOwn: true
    },
    {
      id: "m9",
      senderId: "user-2",
      senderName: "John Smith",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
      content: "Just pushed the new design system updates",
      timestamp: new Date(Date.now() - 2 * 60000),
      isOwn: false
    }
  ]
};

export function getInitials(name: string): string {
  if(!name) return "";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function formatTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffInMinutes < 1) return "now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

export function getStatusColor(status?: string): string {
  switch (status) {
    case "online":
      return "bg-green-500";
    case "away":
      return "bg-yellow-500";
    case "offline":
      return "bg-gray-400";
    default:
      return "bg-gray-400";
  }
}

// API Integration Helpers
export async function fetchConversations(
  orgId: number
): Promise<ChatConversation[]> {
  try {
    const response = await chatApiService.getConversations(orgId);
    return response.content.map((conv) => {
      const participants = (conv.participants || []).map((p: any) => ({
        id: String(p.userId),
        name: p.userName || "",
        avatar: undefined,
        status: p.isActive ? "online" : "offline"
      }));

      return {
        id: String(conv.id),
        name: conv.name || "",
        type: conv.type || "DIRECT",
        isGroup: conv.type === "GROUP",
        participants,
        participantIds: conv.participantIds || [],
        avatar:
          (conv.avatar as string) ||
          (participants[0]
            ? undefined
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.name}`),
        lastMessage: conv.lastMessage || null,
        lastMessageTime: conv.lastMessageAt
          ? new Date(conv.lastMessageAt)
          : undefined,
        unreadCount: conv.unreadCount || 0,
        orgId: conv.orgId
      } as ChatConversation;
    });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return mockConversations;
  }
}

export async function fetchMessages(
  conversationId: string,
  orgId: string
): Promise<ChatMessage[]> {
  try {
    const response = await chatApiService.getMessages(
      conversationId,
      Number(orgId)
    );
    return response.content.map(
      (msg, index) =>
        ({
          id: msg.id || `m${index}`,
          senderId: msg.senderId,
          senderName: msg.senderName || "Unknown",
          senderAvatar: msg.senderAvatar,
          content: msg.content,
          timestamp: new Date(msg.timestamp ?? Date.now()),
          isOwn: msg.isOwn || false,
          status: msg.status || "delivered"
        }) as ChatMessage
    );
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return messages[conversationId] || [];
  }
}

export async function searchUsers(name: string): Promise<ChatUser[]> {
  try {
    const results = await chatApiService.searchUsers(name);
    return results.map((user) => ({
      id: user.id,
      name: user.name,
      profilePhoto: user.profilePhoto,
      email: user.email,
      department: user.department,
      avatar: user.profilePhoto
    }));
  } catch (error) {
    console.error("Failed to search users:", error);
    return [];
  }
}
