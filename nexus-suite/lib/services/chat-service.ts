import apiClient from "@/lib/api-client";
import { ChatEventHandler, chatWebSocketService, WebSocketConfig } from "@/lib/chat-websocket";
import type {
    ChatConversation,
    ChatMessage,
    ChatMessageAttachment,
    CreateConversationPayload,
    CreateMessagePayload,
    User,
    WsConversationEvent,
    WsMessageDeletedEvent,
    WsMessagePayload,
    WsPresenceEvent,
    WsStatusUpdateEvent,
    WsTypingEvent
} from "@/types/chat";

const CHAT_V2_PATH = "/iam/chat/v2";

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
      throw error;
    }
  }

  async updateConversation(
    conversationId: number,
    name?: string,
    description?: string,
    avatar?: File,
    orgId?: number,
    participantId?: number
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

      let url = `${this.apiPath}/conversation`;
      const params = new URLSearchParams();
      if (participantId) params.append("participantId", String(participantId));
      if (orgId) params.append("orgId", String(orgId));
      if (params.toString()) url += `?${params.toString()}`;

      const response = await apiClient.put<ChatConversation>(
        url,
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
    files?: File[],
    orgId?: number
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

      const params = new URLSearchParams();
      params.append("participantId", String(payload.participantId));
      if (orgId) {
        params.append("orgId", String(orgId));
      }

      const response = await apiClient.post<ChatMessage>(
        `${this.apiPath}/message?${params.toString()}`,
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
        `${this.apiPath}/message`,
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

  async setAdmin(conversationId: number, participantId: number, adminId: number, isAdmin: boolean, orgId: number): Promise<void> {
    try {
      await apiClient.put(
        `${this.apiPath}/conversation/${conversationId}/participants/${participantId}/admin?adminId=${adminId}&isAdmin=${isAdmin}&orgId=${orgId}`,
        {}
      );
    } catch (error) {
      console.error("[CHAT API] Error setting admin:", error);
      throw error;
    }
  }

  async deleteMessage(conversationId: number, messageId: number, participantId: number, orgId: number, deleteForEveryone: boolean): Promise<void> {
    try {
      const endpoint = deleteForEveryone
        ? `${this.apiPath}/message/${messageId}?participantId=${participantId}&orgId=${orgId}&deleteForEveryone=true`
        : `${this.apiPath}/message/${messageId}/clear?participantId=${participantId}&orgId=${orgId}`;
      await apiClient.delete(endpoint);
    } catch (error) {
      console.error("[CHAT API] Error deleting message:", error);
      throw error;
    }
  }

  async pinMessage(conversationId: number, messageId: number, participantId: number, orgId: number): Promise<void> {
    try {
      await apiClient.post(`${this.apiPath}/message/${messageId}/pin?participantId=${participantId}&orgId=${orgId}`, {});
    } catch (error) {
      console.error("[CHAT API] Error pinning message:", error);
      throw error;
    }
  }

  async unpinMessage(conversationId: number, messageId: number, participantId: number, orgId: number): Promise<void> {
    try {
      await apiClient.post(`${this.apiPath}/message/${messageId}/unpin?participantId=${participantId}&orgId=${orgId}`, {});
    } catch (error) {
      console.error("[CHAT API] Error unpinning message:", error);
      throw error;
    }
  }

  async deleteConversation(conversationId: number, participantId: number, orgId: number): Promise<void> {
    try {
      await apiClient.delete(`${this.apiPath}/conversation/${conversationId}?participantId=${participantId}&orgId=${orgId}`);
    } catch (error) {
      console.error("[CHAT API] Error deleting conversation:", error);
      throw error;
    }
  }

  async clearChatForSelf(conversationId: number, participantId: number, orgId: number): Promise<void> {
    try {
      await apiClient.post(`${this.apiPath}/conversation/${conversationId}/clear?participantId=${participantId}&orgId=${orgId}`, {});
    } catch (error) {
      console.error("[CHAT API] Error clearing chat:", error);
      throw error;
    }
  }

  async downloadChat(conversationId: number, participantId: number, orgId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.apiPath}/conversation/${conversationId}/download?participantId=${participantId}&orgId=${orgId}`, {
        responseType: 'text',
      });
      let text = response.data;
      if (typeof text === 'string') {
        if (text.startsWith('"') && text.endsWith('"')) {
          try {
            text = JSON.parse(text);
          } catch {
            // Not JSON, use as-is
          }
        }
        text = text.replace(/\\n/g, '\n');
      } else {
        text = JSON.stringify(text);
      }
      return new Blob([text], { type: 'text/plain;charset=utf-8' });
    } catch (error) {
      console.error("[CHAT API] Error downloading chat:", error);
      throw error;
    }
  }

  async searchMessages(conversationId: number, participantId: number, orgId: number, query: string): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get(`${this.apiPath}/conversation/${conversationId}/search?participantId=${participantId}&orgId=${orgId}&query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error("[CHAT API] Error searching messages:", error);
      throw error;
    }
  }

  async searchUsers(name: string): Promise<User[]> {
    try {
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

  async getOrgUsers(orgId: number): Promise<User[]> {
    try {
      const response = await apiClient.get<any[]>(
        `/iam/users/chat-contacts?orgId=${orgId}`
      );
      const content = response.data ?? [];
      return content.map((u: any) => ({
        id: u.id,
          name: u.name,
          email: u.email,
          profilePhoto: u.profilePhoto,
          orgId: u.orgId ?? orgId,
          orgName: u.orgName,
          orgType: u.orgType,
          role: u.role,
        }));
    } catch (error) {
      console.error("[CHAT API] Error fetching org users:", error);
      throw error;
    }
  }

  async getPartnerOrgs(orgId: number): Promise<{ orgId: number; orgName: string; users: User[] }[]> {
    try {
      const partnerships = await (await import("@/lib/services/partnerships-service")).getPartnerships({
        status: "ACTIVE",
        pageOffset: 100,
      });
      const content = (partnerships as any).content ?? [];
      const partnerOrgIds = new Set<number>();
      const orgNameMap = new Map<number, string>();
      content.forEach((p: any) => {
        const otherOrgId = p.primaryOrg === orgId ? p.secondaryOrg : p.primaryOrg;
        const otherOrgName = p.primaryOrg === orgId ? p.secondaryOrgName : p.primaryOrgName;
        if (otherOrgId) {
          partnerOrgIds.add(otherOrgId);
          orgNameMap.set(otherOrgId, otherOrgName || `Org ${otherOrgId}`);
        }
      });
      const orgs: { orgId: number; orgName: string; users: User[] }[] = [];
      for (const partnerOrgId of partnerOrgIds) {
        try {
          const users = await this.getOrgUsers(partnerOrgId);
          const filtered = users
            .map((u) => ({ ...u, orgName: orgNameMap.get(partnerOrgId) }))
            .filter((u) => u.id !== undefined);
          orgs.push({
            orgId: partnerOrgId,
            orgName: orgNameMap.get(partnerOrgId) || `Org ${partnerOrgId}`,
            users: filtered,
          });
        } catch {
          // skip
        }
      }
      return orgs;
    } catch (error) {
      console.error("[CHAT API] Error fetching partner orgs:", error);
      throw error;
    }
  }

  // ============ WEBSOCKET METHODS ============

  async connectWebSocket(config: WebSocketConfig): Promise<void> {
    return chatWebSocketService.connect(config);
  }

  disconnectWebSocket(): void {
    chatWebSocketService.disconnect();
  }

  isWebSocketConnected(): boolean {
    return chatWebSocketService.isConnected;
  }

  subscribeToWebSocket(destination: string, callback: ChatEventHandler): () => void {
    return chatWebSocketService.subscribe(destination, callback);
  }

  sendWebSocketMessage(destination: string, body: unknown): void {
    chatWebSocketService.send(destination, body);
  }

  subscribeToPresence(callback: (event: WsPresenceEvent) => void): () => void {
    return this.subscribeToWebSocket("/topic/presence", (data) => {
      const evt = (data ?? {}) as WsPresenceEvent;
      if (evt.userId) {
        callback({
          userId: evt.userId,
          status: evt.status || "OFFLINE",
          at: evt.at,
        });
      }
    });
  }

  subscribeToConversationMessages(
    conversationId: number,
    callback: (message: WsMessagePayload) => void
  ): () => void {
    return this.subscribeToWebSocket(
      `/topic/conversations/${conversationId}`,
      (data) => {
        const evt = (data ?? {}) as WsConversationEvent;
        const message = evt.message ?? evt;
        if (message && (message.chatMessageId || message.chatMessageText || message.content)) {
          callback(message as WsMessagePayload);
        }
      }
    );
  }

  subscribeToTyping(
    conversationId: number,
    callback: (event: WsTypingEvent) => void
  ): () => void {
    return this.subscribeToWebSocket(
      `/topic/conversations/${conversationId}/typing`,
      (data) => {
        const evt = (data ?? {}) as WsTypingEvent;
        if (typeof evt.userId === "number") {
          callback({
            userId: evt.userId,
            isTyping: evt.isTyping ?? false,
          });
        }
      }
    );
  }

  subscribeToStatusUpdates(
    conversationId: number,
    callback: (event: WsStatusUpdateEvent) => void
  ): () => void {
    return this.subscribeToWebSocket(
      `/topic/conversations/${conversationId}`,
      (data) => {
        const evt = (data ?? {}) as WsConversationEvent;
        if (typeof evt.messageId === "number" && evt.status && !evt.message && !evt.conversationId) {
          callback({
            messageId: evt.messageId,
            status: evt.status,
            conversationId: evt.conversationId,
          });
        }
      }
    );
  }

  /**
   * Subscribe to message deletion events
   */
  subscribeToMessageDeleted(
    conversationId: number,
    callback: (event: WsMessageDeletedEvent) => void
  ): () => void {
    return this.subscribeToWebSocket(
      `/topic/conversations/${conversationId}`,
      (data) => {
        const evt = (data ?? {}) as WsConversationEvent & WsMessageDeletedEvent;
        // Handle message deletion event
        if (evt.messageId && evt.deletedAt && (evt.deleteForEveryone !== undefined || evt.deletedBy)) {
          callback({
            messageId: evt.messageId,
            conversationId: evt.conversationId || conversationId,
            deletedBy: evt.deletedBy,
            deleteForEveryone: evt.deleteForEveryone ?? true,
            deletedAt: evt.deletedAt,
          });
        }
      }
    );
  }

  /**
   * Subscribe to pin/unpin events
   */
  subscribeToPinEvents(
    conversationId: number,
    callback: (event: { messageId: number; isPinned: boolean; participantId: number }) => void
  ): () => void {
    return this.subscribeToWebSocket(
      `/topic/conversations/${conversationId}/pin`,
      (data) => {
        const evt = (data ?? {}) as { messageId?: number; isPinned?: boolean; participantId?: number };
        if (evt.messageId && typeof evt.isPinned === "boolean" && evt.participantId) {
          callback({
            messageId: evt.messageId,
            isPinned: evt.isPinned,
            participantId: evt.participantId,
          });
        }
      }
    );
  }

  subscribeToGlobalConversations(
    conversationIds: number[],
    callback: (event: { conversationId: number; lastMessage: string; lastMessageAt: string; senderId: number }) => void
  ): Array<() => void> {
    return conversationIds.map((id) =>
      this.subscribeToWebSocket(`/topic/conversations/${id}`, (data) => {
        const evt = (data ?? {}) as WsConversationEvent;
        const m = evt?.message ?? evt;
        if (!m || !(m.chatMessageText || m.content || m.chatMessageId)) return;
        const convId = evt?.conversationId ?? m?.chatConversationId ?? id;
        const senderId = evt?.participantId ?? m?.chatConversationParticipant?.participantId;
        const text = m?.chatMessageText ?? m?.content;
        const sentAt = m?.sentAt ?? m?.timestamp;
        if (text && sentAt && senderId != null) {
          callback({
            conversationId: convId,
            lastMessage: text,
            lastMessageAt: sentAt,
            senderId,
          });
        }
      })
    );
  }

  sendHeartbeat(userId: number): void {
    this.sendWebSocketMessage("/app/heartbeat", { userId });
  }

  sendTypingIndicator(conversationId: number, userId: number, isTyping: boolean): void {
    this.sendWebSocketMessage(`/app/cms/chat/ws/typing/${conversationId}`, { userId, isTyping });
  }

  acknowledgeMessage(messageId: number): void {
    this.sendWebSocketMessage(`/app/cms/chat/ws/ack/${messageId}`, {});
  }
}

export const chatService = new ChatApiService();