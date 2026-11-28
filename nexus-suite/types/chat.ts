// ============ CHAT TYPES ============

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
    status: 'SENT' | 'DELIVERED' | 'RECEIVED' | 'PARTIALLY_RECEIVED';
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
    chatParticipantType: 'DIRECT' | 'GROUP';
    joinedAt: string;
    lastSeenAt: string;
    chatParticipantStatus: 'JOINED' | 'LEFT';
    chatParticipantCurrentStatus: 'ONLINE' | 'OFFLINE' | 'AWAY';
    lastRead: string;
    lastMessageId?: number;
    updatedAt: string;
    isAdmin?: boolean;
    isActive: boolean;
    // Inter-org fields
    orgId?: number;
    orgName?: string;
    orgType?: string;
}

export interface ChatMessage {
    chatMessageId: number;
    chatMessageText?: string;
    chatMessageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'SYSTEM';
    chatMessageStatus: 'SENT' | 'DELIVERED' | 'RECEIVED' | 'PARTIALLY_RECEIVED';
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
    isDeleted?: boolean;
    deletedForEveryone?: boolean;
    isPinned?: boolean;
    pinnedAt?: string;
    pinnedBy?: number;
    repliedToMessageId?: number;
}

export interface ChatConversation {
    chatConversationId: number;
    chatConversationName: string;
    chatConversationAvatar?: string;
    chatConversationDescription?: string;
    chatConversationType: 'DIRECT' | 'GROUP';
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
    chatConversationType: 'DIRECT' | 'GROUP';
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
    chatMessageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'SYSTEM';
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

// ============ WEBSOCKET EVENT TYPES ============

export interface WsMessagePayload {
    chatMessageId?: number;
    chatMessageText?: string;
    chatMessageType?: ChatMessage['chatMessageType'];
    chatMessageStatus?: ChatMessage['chatMessageStatus'];
    sentAt?: string;
    deliveredAt?: string;
    receivedAt?: string;
    updatedAt?: string;
    chatConversationParticipant?: {
        participantId?: number;
        participantName?: string;
        participantEmail?: string;
        participantAvatar?: string;
    };
    chatMessageAttachmentList?: ChatMessage['chatMessageAttachmentList'];
    messageSeenByList?: ChatMessage['messageSeenByList'];
    // Additional fields that may come from server in conversation events
    content?: string;
    chatConversationId?: number;
    timestamp?: string;
    status?: ChatMessage['chatMessageStatus'];
    messageId?: number;
    conversationId?: number;
    participantId?: number;
}

export interface WsPresenceEvent {
    userId: number;
    status: 'ONLINE' | 'OFFLINE' | 'AWAY';
    at?: string;
}

export interface WsTypingEvent {
    userId: number;
    isTyping: boolean;
}

export interface WsStatusUpdateEvent {
    messageId: number;
    status: ChatMessage['chatMessageStatus'];
    conversationId?: number;
}

export interface WsMessageDeletedEvent {
    messageId: number;
    conversationId: number;
    deletedBy: number;
    deleteForEveryone: boolean;
    deletedAt: string;
}

export interface WsConversationEvent {
    message?: WsMessagePayload;
    conversationId?: number;
    participantId?: number;
    chatMessageId?: number;
    chatMessageText?: string;
    content?: string;
    sentAt?: string;
    timestamp?: string;
    status?: ChatMessage['chatMessageStatus'];
    chatConversationId?: number;
    messageId?: number;
    chatConversationParticipant?: {
        participantId?: number;
    };
}
