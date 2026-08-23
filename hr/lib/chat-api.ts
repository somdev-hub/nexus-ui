import apiClient from "@/lib/api-client";

const CHAT_V2_PATH = "/iam/chat/v2";

/**
 * Chat API Service v2
 *
 * Implements all endpoints from CHAT_FRONTEND_REFERENCE.md
 * All requests go through BFF proxy: /api/proxy → Next.js Server → Spring Boot IAM/CMS
 *
 * Architecture:
 * - REST endpoints use IAM Gateway (port 8080)
 * - WebSocket connects directly to CMS (port 8086) via separate WS proxy
 * - Multimedia upload via REST, then reference in WebSocket message
 */

// ============ TYPES ============

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

export interface ChatMessageIndividualStatus {
  chatMessageIndividualStatusId: number;
  status: "SENT" | "DELIVERED" | "RECEIVED" | "PARTIALLY_RECEIVED";
  deliveredAt?: string;
  receivedAt?: string;
}

export interface ChatConversationParticipant {
  chatConversationParticipantsId: number;
  participantId: number;
  participantName: string;
  participantEmail: string;
  participantMob: string;
  participantRole: string;
  participantAvatar?: string;
  isChatCreator: boolean;
  chatParticipantType: "DIRECT" | "GROUP";
  joinedAt: string;
  lastSeenAt: string;
  chatParticipantStatus: "JOINED" | "LEFT";
  chatParticipantCurrentStatus: "ONLINE" | "OFFLINE" | "AWAY";
  lastRead: string;
  lastMessageId?: number;
  updatedAt: string;
  isActive: boolean;
}

export interface ChatMessage {
  chatMessageId: number;
  chatMessageText?: string;
  chatMessageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  chatMessageStatus: "SENT" | "DELIVERED" | "RECEIVED" | "PARTIALLY_RECEIVED";
  sentAt: string;
  deliveredAt?: string;
  receivedAt?: string;
  updatedAt: string;
  isEdited: boolean;
  chatConversationParticipant: ChatConversationParticipant;
  chatMessageAttachmentList: ChatMessageAttachment[];
  chatMessageIndividualStatuses: ChatMessageIndividualStatus[];
  messageSeenByList?: Array<{
    participantId: number;
    participantName: string;
    participantAvatar?: string;
  }>;
}

export interface ChatConversation {
  chatConversationId: number;
  chatConversationName: string;
  chatConversationAvatar?: string;
  chatConversationDescription?: string;
  chatConversationType: "DIRECT" | "GROUP";
  createdAt: string;
  lastModifiedAt: string;
  lastMessageAt?: string;
  isActive: boolean;
  totalParticipants: number;
  totalMessages: number;
  orgId: number;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageSenderId?: number;
  lastMessageSenderName?: string;
  otherParticipantId?: number;
  otherParticipantName?: string;
  otherParticipantAvatar?: string;
  chatConversationParticipants?: ChatConversationParticipant[];
  imageAndVideoAttachments?: ChatMessageAttachment[];
  fileAttachments?: ChatMessageAttachment[];
}

export interface CreateConversationPayload {
  chatConversationName?: string;
  chatConversationDescription?: string;
  chatConversationType: "DIRECT" | "GROUP";
  orgId: number;
  participantIds: number[];
  chatConversationAvatar?: File;
  participants?: Array<{
    participantId: number;
    participantName: string;
    participantEmail: string;
    isChatCreator?: boolean;
    participantMob?: string;
    participantRole?: string;
    chatParticipantType?: string;
    participantAvatar?: string;
  }>;
}

export interface CreateMessagePayload {
  chatConversationId: number;
  participantId: number;
  chatMessageId?: number;
  chatMessageText: string;
  chatMessageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  chatMessageAttachmentList: ChatMessageAttachment[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  profilePhoto?: string;
  department?: string;
  role?: string;
  address?: string;
  phone?: string;
}

interface PaginationResponse<T> {
  messages: T[];
  hasMore: boolean;
  nextCursor?: number;
}

export interface PresenceStatusResponse {
  [userId: number]: boolean;
}

// ============ API SERVICE ============

class ChatApiService {
  private readonly apiPath = CHAT_V2_PATH;

  /**
   * CONVERSATIONS
   */

  /**
   * Create a new conversation (DIRECT or GROUP)
   */
  async createConversation(
    payload: Omit<CreateConversationPayload, "chatConversationAvatar">,
    orgId: number,
    participantId: number,
    avatar?: File
  ): Promise<ChatConversation> {
    try {
      const formData = new FormData();

      // Build participant objects from provided data
      const chatConversationParticipants = (
        payload.participants ||
        payload.participantIds.map((id, idx) => ({
          participantId: id,
          participantName: `User ${id}`,
          participantEmail: `user${id}@nexus.local`,
          isChatCreator: idx === 0,
          participantMob: "",
          participantRole: "USER",
          chatParticipantType: "MEMBER",
          participantAvatar: undefined
        }))
      ).map((p) => ({
        participantId: p.participantId,
        participantName: p.participantName || `User ${p.participantId}`,
        participantEmail:
          p.participantEmail || `user${p.participantId}@nexus.local`,
        isChatCreator: p.isChatCreator || false,
        participantMob: p.participantMob || "",
        participantRole: p.participantRole || "USER",
        chatParticipantType: p.chatParticipantType || "MEMBER",
        participantAvatar: p.participantAvatar,
        chatParticipantStatus: "JOINED"
      }));

      // Add request JSON with proper structure
      const requestObj = {
        chatConversationName: payload.chatConversationName,
        chatConversationDescription: payload.chatConversationDescription,
        chatConversationType: payload.chatConversationType,
        orgId: orgId,
        chatConversationParticipants: chatConversationParticipants,
        isActive: true
      };

      console.log("[CHAT API] Creating conversation with payload:", requestObj);

      // Append request as Blob (multipart part) so Spring can deserialize via @RequestPart
      formData.append(
        "request",
        new Blob([JSON.stringify(requestObj)], { type: "application/json" })
      );

      // Add avatar file if provided
      if (avatar) {
        formData.append("chatConversationAvatar", avatar);
      }

      // Let axios auto-detect multipart FormData and set proper Content-Type header
      // with correct boundary - do NOT set Content-Type manually
      const response = await apiClient.post<ChatConversation>(
        `${this.apiPath}/conversation`,
        formData
      );
      console.log(
        "[CHAT API] Created conversation:",
        response.data.chatConversationId
      );
      return response.data;
    } catch (error) {
      console.error("[CHAT API] Error creating conversation:", error);
      throw error;
    }
  }

  /**
   * Get all conversations for a participant
   */
  async getConversations(
    participantId: number,
    orgId: number
  ): Promise<ChatConversation[]> {
    try {
      // Use new v2 API endpoint that returns list directly
      const response = await apiClient.get<ChatConversation[]>(
        `${this.apiPath}/conversations/${participantId}?orgId=${orgId}`
      );
      console.log("[CHAT API] Fetched conversations response:", response.data);
      const conversations = Array.isArray(response.data) ? response.data : [];
      console.log(
        "[CHAT API] Parsed conversations:",
        conversations.length,
        conversations
      );
      return conversations;
    } catch (error) {
      console.error("[CHAT API] Error fetching conversations:", error);
      throw error;
    }
  }

  /**
   * Get online/offline status for a batch of users.
   */
  async getPresenceStatuses(
    userIds: number[]
  ): Promise<PresenceStatusResponse> {
    try {
      if (!userIds.length) return {};

      const params = userIds
        .map((id) => `userIds=${encodeURIComponent(id)}`)
        .join("&");
      const response = await apiClient.get<PresenceStatusResponse>(
        `${this.apiPath}/presence/batch?${params}`
      );
      console.log("[CHAT API] Fetched presence statuses:", response.data);
      return response.data || {};
    } catch (error) {
      console.error("[CHAT API] Error fetching presence statuses:", error);
      throw error;
    }
  }

  /**
   * Get conversation details
   */
  async getConversationDetails(
    conversationId: number,
    participantId: number,
    orgId: number
  ): Promise<ChatConversation> {
    try {
      const response = await apiClient.get<ChatConversation>(
        `${this.apiPath}/conversation/${conversationId}?participantId=${participantId}&orgId=${orgId}`
      );
      console.log("[CHAT API] Fetched conversation details:", conversationId);
      return response.data;
    } catch (error) {
      console.error("[CHAT API] Error fetching conversation details:", error);
      throw error;
    }
  }

  /**
   * Update conversation
   */
  async updateConversation(
    conversationId: number,
    name?: string,
    description?: string,
    avatar?: File,
    orgId?: number
  ): Promise<ChatConversation> {
    try {
      const formData = new FormData();
      const requestObj = {
        chatConversationId: conversationId,
        chatConversationName: name,
        chatConversationDescription: description,
        orgId: orgId
      };
      formData.append(
        "request",
        new Blob([JSON.stringify(requestObj)], { type: "application/json" })
      );

      if (avatar) {
        formData.append("chatConversationAvatar", avatar);
      }

      const response = await apiClient.put<ChatConversation>(
        `${this.apiPath}/conversation`,
        formData
      );
      console.log("[CHAT API] Updated conversation:", conversationId);
      return response.data;
    } catch (error) {
      console.error("[CHAT API] Error updating conversation:", error);
      throw error;
    }
  }

  /**
   * Mark conversation as viewed (set lastRead timestamp)
   */
  async markConversationAsViewed(
    conversationId: number,
    participantId: number,
    orgId: number
  ): Promise<void> {
    try {
      await apiClient.post(
        `${this.apiPath}/view?participantId=${participantId}&conversationId=${conversationId}&orgId=${orgId}`,
        {}
      );
      console.log("[CHAT API] Marked conversation as viewed:", conversationId);
    } catch (error) {
      console.error("[CHAT API] Error marking conversation as viewed:", error);
      throw error;
    }
  }

  /**
   * MESSAGES
   */

  /**
   * Send message via REST (fallback if WebSocket fails)
   */
  async sendMessage(
    payload: CreateMessagePayload,
    files?: File[]
  ): Promise<ChatMessage> {
    try {
      const formData = new FormData();
      formData.append(
        "message",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );

      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append("files", file);
        });
      }

      const response = await apiClient.post<ChatMessage>(
        `${this.apiPath}/message/`,
        formData
      );
      console.log("[CHAT API] Sent message:", response.data.chatMessageId);
      return response.data;
    } catch (error) {
      console.error("[CHAT API] Error sending message:", error);
      throw error;
    }
  }

  /**
   * Upload multimedia files (pre-upload before sending message)
   * Returns attachment metadata to include in message payload
   */
  async uploadMultimedia(
    files: File[],
    participantId: number,
    orgId: number
  ): Promise<ChatMessageAttachment[]> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await apiClient.post<ChatMessageAttachment[]>(
        `${this.apiPath}/message/multimedia?participantId=${participantId}&orgId=${orgId}`,
        formData
      );
      console.log(
        "[CHAT API] Uploaded multimedia:",
        response.data.length,
        "files"
      );
      return response.data;
    } catch (error) {
      console.error("[CHAT API] Error uploading multimedia:", error);
      throw error;
    }
  }

  /**
   * Edit message
   */
  async editMessage(
    conversationId: number,
    messageId: number,
    text: string,
    participantId: number
  ): Promise<ChatMessage> {
    try {
      const payload = {
        chatConversationId: conversationId,
        participantId: participantId,
        chatMessageId: messageId,
        chatMessageText: text,
        chatMessageType: "TEXT",
        chatMessageAttachmentList: []
      };

      const response = await apiClient.put<ChatMessage>(
        `${this.apiPath}/message/`,
        payload
      );
      console.log("[CHAT API] Edited message:", messageId);
      return response.data;
    } catch (error) {
      console.error("[CHAT API] Error editing message:", error);
      throw error;
    }
  }

  /**
   * Get messages with cursor-based pagination
   */
  async getMessages(
    conversationId: number,
    participantId: number,
    orgId: number,
    beforeId?: number,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    try {
      let url = `${this.apiPath}/conversation/messages?conversationId=${conversationId}&participantId=${participantId}&orgId=${orgId}&limit=${limit}`;
      if (beforeId) {
        url += `&beforeId=${beforeId}`;
      }

      const response = await apiClient.get<{
        messages: ChatMessage[];
        nextCursor: number | null;
        hasMore: boolean;
      }>(url);
      console.log(
        "[CHAT API] Fetched messages:",
        response.data.messages?.length || 0
      );
      return response.data.messages || [];
    } catch (error) {
      console.error("[CHAT API] Error fetching messages:", error);
      throw error;
    }
  }

  /**
   * Search users for conversation creation
   */
  async searchUsers(name: string): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>(
        `/iam/users/get-user-by-name?name=${encodeURIComponent(name)}`
      );
      console.log(
        "[CHAT API] Searched users:",
        response.data.length,
        "results"
      );
      return response.data;
    } catch (error) {
      console.error("[CHAT API] Error searching users:", error);
      throw error;
    }
  }
}

export const chatApiService = new ChatApiService();
