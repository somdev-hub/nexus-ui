import apiClient from "@/lib/api-client";

const IAM_PATH = "/iam";

interface ChatMessage {
  id?: string;
  conversationId: string;
  content: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  timestamp?: Date;
  isOwn?: boolean;
  status?: "sent" | "delivered" | "read";
}

interface ChatConversation {
  id: string;
  name: string;
  avatar?: string;
  participants?: Array<{
    id: string | number;
    name: string;
    avatar?: string;
    status?: "online" | "away" | "offline";
  }>;
  unreadCount?: number;
  type: "DIRECT" | "GROUP";
  participantIds: number[];
  orgId: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt?: Date;
}

interface CreateConversationPayload {
  type: "DIRECT" | "GROUP";
  participantIds: number[];
  orgId: string;
}

interface ConversationStats {
  conversationId: string;
  totalMessages: number;
  deliveredMessages: number;
  participantCount: number;
  createdAt: Date;
}

//  {
//     "address": "Some state",
//     "department": "HUMAN_RESOURCES",
//     "email": "hari.singh@cosmos.com",
//     "id": 29,
//     "name": "Hari Singh",
//     "personalEmail": "operatorgold69@gmail.com",
//     "phone": "8989810110",
//     "profilePhoto": "https://ipfs.filebase.io/ipfs/QmeGThZgHvXVVnf5N6WQYhZ3hvAicMjPE36q4s5GNKQsVJ",
//     "role": "ADMIN"
//   }
interface User {
  id: number;
  name: string;
  email: string;
  profilePhoto?: string;
  department?: string;
  role?: string;
  address?: string;
  phone?: string;
}

interface MessagePayload {
  content: string;
  conversationId?: string;
  orgId?: string;
}

class ChatApiService {
  /**
   * All REST API calls go through the BFF proxy pattern:
   * Client → /api/proxy?path=/cms/chat/... → Next.js Server (gets token from session) → Spring Boot
   * This ensures accessToken is never exposed to browser
   */

  async createConversation(
    payload: CreateConversationPayload
  ): Promise<ChatConversation> {
    try {
      const response = await apiClient.post<ChatConversation>(
        `${IAM_PATH}/chat/conversations`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }

  async getConversations(
    orgId: number,
    page: number = 0,
    size: number = 50
  ): Promise<{ content: ChatConversation[] }> {
    try {
      const response = await apiClient.get<{ content: ChatConversation[] }>(
        `${IAM_PATH}/chat/conversations?orgId=${orgId}&page=${page}&size=${size}`
        
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  }

  async getMessages(
    conversationId: string,
    orgId: string,
    page: number = 0,
    size: number = 50
  ): Promise<{ content: ChatMessage[] }> {
    try {
      const response = await apiClient.get<{ content: ChatMessage[] }>(
        `${IAM_PATH}/chat/conversations/${conversationId}/messages?orgId=${orgId}&page=${page}&size=${size}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  async sendMessage(
    userId: string,
    content: MessagePayload,
    orgId: string
  ): Promise<ChatMessage> {
    try {
      const response = await apiClient.post<ChatMessage>(
        `${IAM_PATH}/chat/messages?orgId=${orgId}&userId=${userId}`,
        {
          content
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  async getConversationStats(
    conversationId: string,
    orgId: number
  ): Promise<ConversationStats> {
    try {
      const response = await apiClient.get<ConversationStats>(
        `${IAM_PATH}/chat/conversations/${conversationId}/stats?orgId=${orgId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching conversation stats:", error);
      throw error;
    }
  }

  async searchUsers(name: string): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>(
        `${IAM_PATH}/users/get-user-by-name?name=${encodeURIComponent(name)}`
      );
      return response.data;
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  }
}

export const chatApiService = new ChatApiService();
