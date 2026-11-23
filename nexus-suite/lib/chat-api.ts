import apiClient from "@/lib/api-client";

const CHAT_V2_PATH = "/iam/chat/v2";

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
  // Inter-org fields
  orgId?: number;
  orgName?: string;
  orgType?: string;
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
  isInterOrg?: boolean;
  participantOrgIds?: string;
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
  participants?: Array<{
    participantId: number;
    participantName: string;
    participantEmail: string;
    isChatCreator?: boolean;
    participantMob?: string;
    participantRole?: string;
    chatParticipantType?: string;
    participantAvatar?: string;
    orgId?: number;
    orgName?: string;
    orgType?: string;
  }>;
}

export interface CreateMessagePayload {
  chatConversationId: number;
  participantId: number;
  chatMessageId?: number;
  chatMessageText: string;
  chatMessageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  chatMessageAttachmentList: ChatMessageAttachment[];
  clientMessageId?: string;
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
  orgId?: number;
  orgName?: string;
  orgType?: string;
}

export interface PresenceStatusResponse {
  [userId: number]: boolean;
}

// ============ API SERVICE ============

class ChatApiService {
  private readonly apiPath = CHAT_V2_PATH;

  async createConversation(
    payload: Omit<CreateConversationPayload, "chatConversationAvatar">,
    orgId: number,
    participantId: number,
    avatar?: File
  ): Promise<ChatConversation> {
    try {
      const formData = new FormData();

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
          participantAvatar: undefined,
          orgId: undefined,
          orgName: undefined,
          orgType: undefined
        }))
      ).map((p) => ({
        participantId: p.participantId,
        participantName: p.participantName || `User ${p.participantId}`,
        participantEmail: p.participantEmail || `user${p.participantId}@nexus.local`,
        isChatCreator: p.isChatCreator || false,
        participantMob: p.participantMob || "",
        participantRole: p.participantRole || "USER",
        chatParticipantType: p.chatParticipantType || "MEMBER",
        participantAvatar: p.participantAvatar,
        chatParticipantStatus: "JOINED",
        orgId: p.orgId,
        orgName: p.orgName,
        orgType: p.orgType
      }));

      const requestObj = {
        chatConversationName: payload.chatConversationName,
        chatConversationDescription: payload.chatConversationDescription,
        chatConversationType: payload.chatConversationType,
        orgId: orgId,
        isInterOrg: payload.participantIds.some((id, idx) => {
          // Check if participants have different orgs
          const orgs = new Set(payload.participants?.map(p => p.orgId).filter(Boolean));
          return orgs.size > 1;
        }),
        chatConversationParticipants: chatConversationParticipants,
        isActive: true
      };

      formData.append(
        "request",
        new Blob([JSON.stringify(requestObj)], { type: "application/json" })
      );

      if (avatar) {
        formData.append("chatConversationAvatar", avatar);
      }

      const response = await apiClient.post<ChatConversation>(
        `${this.apiPath}/conversation`,
        formData
      );
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: { description?: string; message?: string; serviceName?: string; serviceMethod?: string } }; message?: string };
      const errorMsg = err?.response?.data?.description 
        || err?.response?.data?.message 
        || err?.message 
        || "Unknown error";
      console.error("[CHAT API] Error creating conversation:", JSON.stringify(err?.response?.data), error);
      throw new Error(errorMsg);
    }
  }

  async getConversations(
    participantId: number,
    orgId: number
  ): Promise<ChatConversation[]> {
    try {
      const response = await apiClient.get<ChatConversation[]>(
        `${this.apiPath}/conversations/${participantId}?orgId=${orgId}`
      );
      const conversations = Array.isArray(response.data) ? response.data : [];
      return conversations;
    } catch (error) {
      console.error("[CHAT API] Error fetching conversations:", error);
      throw error;
    }
  }

  async getPresenceStatuses(
    userIds: number[]
  ): Promise<Record<number, boolean>> {
    try {
      if (!userIds.length) return {};
      const params = userIds.map((id) => `userIds=${encodeURIComponent(id)}`).join("&");
      const response = await apiClient.get<Record<number, boolean>>(
        `${this.apiPath}/presence/batch?${params}`
      );
      return response.data || {};
    } catch (error) {
      console.error("[CHAT API] Error fetching presence statuses:", error);
      throw error;
    }
  }

  async getConversationDetails(
    conversationId: number,
    participantId: number,
    orgId: number
  ): Promise<ChatConversation> {
    try {
      const response = await apiClient.get<ChatConversation>(
        `${this.apiPath}/conversation/${conversationId}?participantId=${participantId}&orgId=${orgId}`
      );
      return response.data;
    } catch (error) {
      console.error("[CHAT API] Error fetching conversation details:", error);
      // Re-throw the original error to preserve the full response
      throw error;
    }
  }

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
      return response.data;
    } catch (error) {
      console.error("[CHAT API] Error updating conversation:", error);
      throw error;
    }
  }

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
    } catch (error) {
      console.error("[CHAT API] Error marking conversation as viewed:", error);
      throw error;
    }
  }

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
      return response.data;
    } catch (error) {
      console.error("[CHAT API] Error sending message:", error);
      throw error;
    }
  }

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
      return response.data;
    } catch (error) {
      console.error("[CHAT API] Error uploading multimedia:", error);
      throw error;
    }
  }

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
      return response.data;
    } catch (error) {
      console.error("[CHAT API] Error editing message:", error);
      throw error;
    }
  }

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
      return response.data.messages || [];
    } catch (error) {
      console.error("[CHAT API] Error fetching messages:", error);
      throw error;
    }
  }

  async addParticipants(conversationId: number, participantIds: number[], orgId: number, participantId: number): Promise<ChatConversation> {
    try {
      const body = participantIds.map((id) => ({ participantId: id, participantName: `User ${id}`, participantEmail: "", chatParticipantType: "GROUP" }));
      const response = await apiClient.post<ChatConversation>(
        `${this.apiPath}/conversation/${conversationId}/participants?participantId=${participantId}&orgId=${orgId}`,
        body
      );
      return response.data;
    } catch (error) {
      console.error("[CHAT API] Error adding participants:", error);
      throw error;
    }
  }

  async removeParticipant(conversationId: number, participantIdToRemove: number, orgId: number, participantId: number): Promise<void> {
    try {
      await apiClient.delete(
        `${this.apiPath}/conversation/${conversationId}/participants/${participantIdToRemove}?participantId=${participantId}&orgId=${orgId}`
      );
    } catch (error) {
      console.error("[CHAT API] Error removing participant:", error);
      throw error;
    }
  }

  async searchUsers(name: string): Promise<User[]> {
    try {
      // Use cross-org search endpoint
      const response = await apiClient.get<User[]>(
        `/iam/users/search-cross-org?name=${encodeURIComponent(name)}`
      );
      console.log("[CHAT API] Searched users:", response.data?.length ?? 0, "results");
      return response.data || [];
    } catch (error) {
      console.error("[CHAT API] Error searching users:", error);
      throw error;
    }
  }
}

export const chatApiService = new ChatApiService();