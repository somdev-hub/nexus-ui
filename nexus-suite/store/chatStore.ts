import { chatService } from '@/lib/services';
import type {
    ChatConversation,
    ChatMessage,
    CreateConversationPayload,
    User,
} from '@/types/chat';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface ChatState {
    // Conversations
    conversations: ChatConversation[];
    isLoadingConvs: boolean;
    setConversations: (convs: ChatConversation[]) => void;
    addConversation: (conv: ChatConversation) => void;
    updateConversation: (
        id: number,
        updates: Partial<ChatConversation>
    ) => void;
    removeConversation: (id: number) => void;
    setLoadingConvs: (loading: boolean) => void;

    // Active conversation
    selectedConvId: number | null;
    setSelectedConvId: (id: number | null) => void;
    selectedConvDetails: ChatConversation | null;
    setSelectedConvDetails: (details: ChatConversation | null) => void;

    // Messages
    messages: ChatMessage[];
    isLoadingMessages: boolean;
    setMessages: (msgs: ChatMessage[]) => void;
    addMessage: (msg: ChatMessage) => void;
    updateMessage: (id: number, updates: Partial<ChatMessage>) => void;
    removeMessage: (id: number) => void;
    setLoadingMessages: (loading: boolean) => void;

    // Reply state
    replyingTo: ChatMessage | null;
    setReplyingTo: (msg: ChatMessage | null) => void;
    replyMap: Map<number, number>;
    addReplyMapping: (messageId: number, replyToId: number) => void;

    // Input
    newMessage: string;
    setNewMessage: (text: string) => void;
    isSending: boolean;
    setIsSending: (sending: boolean) => void;

    // UI State
    isManageGroupOpen: boolean;
    setIsManageGroupOpen: (open: boolean) => void;
    isSearchInChatOpen: boolean;
    setIsSearchInChatOpen: (open: boolean) => void;
    searchQueryInChat: string;
    setSearchQueryInChat: (query: string) => void;
    searchResultsInChat: ChatMessage[];
    setSearchResultsInChat: (results: ChatMessage[]) => void;
    isSearchingInChat: boolean;
    setIsSearchingInChat: (searching: boolean) => void;

    isDeleteDialogOpen: boolean;
    setIsDeleteDialogOpen: (open: boolean) => void;
    isClearingChat: boolean;
    setIsClearingChat: (clearing: boolean) => void;
    isDeletingConversation: boolean;
    setIsDeletingConversation: (deleting: boolean) => void;
    isDownloadingChat: boolean;
    setIsDownloadingChat: (downloading: boolean) => void;

    // Message actions
    hoveredMessageId: number | null;
    setHoveredMessageId: (id: number | null) => void;
    messageActionMenuId: number | null;
    setMessageActionMenuId: (id: number | null) => void;
    messageToDelete: ChatMessage | null;
    setMessageToDelete: (msg: ChatMessage | null) => void;
    isDeleteMessageDialogOpen: boolean;
    setIsDeleteMessageDialogOpen: (open: boolean) => void;

    // WebSocket
    wsConnected: boolean;
    setWsConnected: (connected: boolean) => void;
    typingUsers: number[];
    setTypingUsers: (users: number[]) => void;
    addTypingUser: (userId: number) => void;
    removeTypingUser: (userId: number) => void;

    // Group creation
    isGroupDialogOpen: boolean;
    setIsGroupDialogOpen: (open: boolean) => void;
    groupName: string;
    setGroupName: (name: string) => void;
    groupDescription: string;
    setGroupDescription: (desc: string) => void;
    selectedGroupUsers: User[];
    setSelectedGroupUsers: (users: User[]) => void;
    groupSearchQuery: string;
    setGroupSearchQuery: (query: string) => void;
    groupSearchResults: User[];
    setGroupSearchResults: (users: User[]) => void;
    isGroupSearching: boolean;
    setIsGroupSearching: (searching: boolean) => void;
    isCreatingGroup: boolean;
    setIsCreatingGroup: (creating: boolean) => void;
    creatingUserId: number | null;
    setCreatingUserId: (id: number | null) => void;

    // Group management
    manageGroupName: string;
    setManageGroupName: (name: string) => void;
    manageGroupDescription: string;
    setManageGroupDescription: (desc: string) => void;
    manageSearchQuery: string;
    setManageSearchQuery: (query: string) => void;
    manageSearchResults: User[];
    setManageSearchResults: (users: User[]) => void;
    isManageSearching: boolean;
    setIsManageSearching: (searching: boolean) => void;
    selectedToAdd: User[];
    setSelectedToAdd: (users: User[]) => void;
    actionLoading: { memberId: number; action: 'admin' | 'remove' } | null;
    setActionLoading: (
        loading: { memberId: number; action: 'admin' | 'remove' } | null
    ) => void;
    isSavingGroupDetails: boolean;
    setIsSavingGroupDetails: (saving: boolean) => void;
    isAddingMembers: boolean;
    setIsAddingMembers: (adding: boolean) => void;

    // User search
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: User[];
    setSearchResults: (users: User[]) => void;
    isSearching: boolean;
    setIsSearching: (searching: boolean) => void;
    isSearchOpen: boolean;
    setIsSearchOpen: (open: boolean) => void;

    // Refs (not persisted)
    firstUnreadIndex: number;
    setFirstUnreadIndex: (index: number) => void;

    // Reset
    resetChatState: () => void;

    // Async actions
    loadConversations: (userId: number, orgId: number) => Promise<void>;
    loadMessages: (
        convId: number,
        userId: number,
        orgId: number
    ) => Promise<void>;
    loadConversationDetails: (
        convId: number,
        userId: number,
        orgId: number
    ) => Promise<void>;
    createDirectConversation: (
        targetUser: User,
        userId: number,
        orgId: number,
        userName: string | undefined,
        userAvatar: string | undefined
    ) => Promise<ChatConversation | null>;
    createGroupConversation: (
        groupName: string,
        groupDescription: string,
        selectedGroupUsers: User[],
        userId: number,
        orgId: number,
        userName: string | undefined,
        userAvatar: string | undefined
    ) => Promise<ChatConversation | null>;
    sendMessage: (
        text: string,
        convId: number,
        userId: number,
        orgId: number,
        replyingTo: ChatMessage | null
    ) => Promise<void>;
    connectWebSocket: (userId: number, orgId: number) => Promise<void>;
    disconnectWebSocket: () => void;
    setupSubscriptions: (
        convId: number,
        userId: number,
        orgId: number
    ) => () => void;
    sendTypingIndicator: (
        convId: number,
        userId: number,
        isTyping: boolean
    ) => void;
    sendHeartbeat: (userId: number) => void;
    updateConversationDetails: (
        convId: number,
        name: string | undefined,
        description: string | undefined,
        userId: number,
        orgId: number
    ) => Promise<void>;
    addGroupMembers: (
        convId: number,
        userIds: number[],
        userId: number,
        orgId: number
    ) => Promise<void>;
    setGroupAdmin: (
        convId: number,
        memberId: number,
        isAdmin: boolean,
        userId: number,
        orgId: number
    ) => Promise<void>;
    removeGroupMember: (
        convId: number,
        memberId: number,
        userId: number,
        orgId: number
    ) => Promise<void>;
    clearChatForSelf: (
        convId: number,
        userId: number,
        orgId: number
    ) => Promise<void>;
    deleteConversation: (
        convId: number,
        userId: number,
        orgId: number
    ) => Promise<void>;
    downloadChat: (
        convId: number,
        userId: number,
        orgId: number
    ) => Promise<void>;
    searchMessages: (
        convId: number,
        userId: number,
        orgId: number,
        query: string
    ) => Promise<void>;
    pinMessage: (
        convId: number,
        messageId: number,
        userId: number,
        orgId: number,
        isPinned: boolean
    ) => Promise<void>;
    deleteMessage: (
        convId: number,
        messageId: number,
        userId: number,
        orgId: number,
        deleteForEveryone: boolean
    ) => Promise<void>;
    copyMessage: (text: string) => Promise<void>;
}

const initialState = {
    conversations: [],
    isLoadingConvs: true,
    selectedConvId: null,
    selectedConvDetails: null,
    messages: [],
    isLoadingMessages: false,
    replyingTo: null,
    replyMap: new Map<number, number>(),
    newMessage: '',
    isSending: false,
    isManageGroupOpen: false,
    isSearchInChatOpen: false,
    searchQueryInChat: '',
    searchResultsInChat: [],
    isSearchingInChat: false,
    isDeleteDialogOpen: false,
    isClearingChat: false,
    isDeletingConversation: false,
    isDownloadingChat: false,
    hoveredMessageId: null,
    messageActionMenuId: null,
    messageToDelete: null,
    isDeleteMessageDialogOpen: false,
    wsConnected: false,
    typingUsers: [],
    isGroupDialogOpen: false,
    groupName: '',
    groupDescription: '',
    selectedGroupUsers: [],
    groupSearchQuery: '',
    groupSearchResults: [],
    isGroupSearching: false,
    isCreatingGroup: false,
    creatingUserId: null,
    manageGroupName: '',
    manageGroupDescription: '',
    manageSearchQuery: '',
    manageSearchResults: [],
    isManageSearching: false,
    selectedToAdd: [],
    actionLoading: null,
    isSavingGroupDetails: false,
    isAddingMembers: false,
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    isSearchOpen: false,
    firstUnreadIndex: -1,
};

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            ...initialState,

            // Conversations
            setConversations: (convs) => set({ conversations: convs }),
            addConversation: (conv) =>
                set((state) => ({
                    conversations: [conv, ...state.conversations],
                })),
            updateConversation: (id, updates) =>
                set((state) => ({
                    conversations: state.conversations.map((c) =>
                        c.chatConversationId === id ? { ...c, ...updates } : c
                    ),
                })),
            removeConversation: (id) =>
                set((state) => ({
                    conversations: state.conversations.filter(
                        (c) => c.chatConversationId !== id
                    ),
                })),
            setLoadingConvs: (loading) => set({ isLoadingConvs: loading }),

            // Active conversation
            setSelectedConvId: (id) => set({ selectedConvId: id }),
            setSelectedConvDetails: (details) =>
                set({ selectedConvDetails: details }),

            // Messages
            setMessages: (msgs) => set({ messages: msgs }),
            addMessage: (msg) =>
                set((state) => ({
                    messages: state.messages.some(
                        (m) => m.chatMessageId === msg.chatMessageId
                    )
                        ? state.messages
                        : [...state.messages, msg],
                })),
            updateMessage: (id, updates) =>
                set((state) => ({
                    messages: state.messages.map((m) =>
                        m.chatMessageId === id ? { ...m, ...updates } : m
                    ),
                })),
            removeMessage: (id) =>
                set((state) => ({
                    messages: state.messages.filter(
                        (m) => m.chatMessageId !== id
                    ),
                })),
            setLoadingMessages: (loading) =>
                set({ isLoadingMessages: loading }),

            // Reply state
            setReplyingTo: (msg) => set({ replyingTo: msg }),
            addReplyMapping: (messageId, replyToId) =>
                set((state) => {
                    const next = new Map(state.replyMap);
                    next.set(messageId, replyToId);
                    return { replyMap: next };
                }),

            // Input
            setNewMessage: (text) => set({ newMessage: text }),
            setIsSending: (sending) => set({ isSending: sending }),

            // UI State
            setIsManageGroupOpen: (open) => set({ isManageGroupOpen: open }),
            setIsSearchInChatOpen: (open) => set({ isSearchInChatOpen: open }),
            setSearchQueryInChat: (query) => set({ searchQueryInChat: query }),
            setSearchResultsInChat: (results) =>
                set({ searchResultsInChat: results }),
            setIsSearchingInChat: (searching) =>
                set({ isSearchingInChat: searching }),
            setIsDeleteDialogOpen: (open) => set({ isDeleteDialogOpen: open }),
            setIsClearingChat: (clearing) => set({ isClearingChat: clearing }),
            setIsDeletingConversation: (deleting) =>
                set({ isDeletingConversation: deleting }),
            setIsDownloadingChat: (downloading) =>
                set({ isDownloadingChat: downloading }),

            // Message actions
            setHoveredMessageId: (id) => set({ hoveredMessageId: id }),
            setMessageActionMenuId: (id) => set({ messageActionMenuId: id }),
            setMessageToDelete: (msg) => set({ messageToDelete: msg }),
            setIsDeleteMessageDialogOpen: (open) =>
                set({ isDeleteMessageDialogOpen: open }),

            // WebSocket
            setWsConnected: (connected) => set({ wsConnected: connected }),
            setTypingUsers: (users) => set({ typingUsers: users }),
            addTypingUser: (userId) =>
                set((state) => ({
                    typingUsers: state.typingUsers.includes(userId)
                        ? state.typingUsers
                        : [...state.typingUsers, userId],
                })),
            removeTypingUser: (userId) =>
                set((state) => ({
                    typingUsers: state.typingUsers.filter(
                        (id) => id !== userId
                    ),
                })),

            // Group creation
            setIsGroupDialogOpen: (open) => set({ isGroupDialogOpen: open }),
            setGroupName: (name) => set({ groupName: name }),
            setGroupDescription: (desc) => set({ groupDescription: desc }),
            setSelectedGroupUsers: (users) =>
                set({ selectedGroupUsers: users }),
            setGroupSearchQuery: (query) => set({ groupSearchQuery: query }),
            setGroupSearchResults: (users) =>
                set({ groupSearchResults: users }),
            setIsGroupSearching: (searching) =>
                set({ isGroupSearching: searching }),
            setIsCreatingGroup: (creating) =>
                set({ isCreatingGroup: creating }),
            setCreatingUserId: (id) => set({ creatingUserId: id }),

            // Group management
            setManageGroupName: (name) => set({ manageGroupName: name }),
            setManageGroupDescription: (desc) =>
                set({ manageGroupDescription: desc }),
            setManageSearchQuery: (query) => set({ manageSearchQuery: query }),
            setManageSearchResults: (users) =>
                set({ manageSearchResults: users }),
            setIsManageSearching: (searching) =>
                set({ isManageSearching: searching }),
            setSelectedToAdd: (users) => set({ selectedToAdd: users }),
            setActionLoading: (loading) => set({ actionLoading: loading }),
            setIsSavingGroupDetails: (saving) =>
                set({ isSavingGroupDetails: saving }),
            setIsAddingMembers: (adding) => set({ isAddingMembers: adding }),

            // User search
            setSearchQuery: (query) => set({ searchQuery: query }),
            setSearchResults: (users) => set({ searchResults: users }),
            setIsSearching: (searching) => set({ isSearching: searching }),
            setIsSearchOpen: (open) => set({ isSearchOpen: open }),

            // Refs
            setFirstUnreadIndex: (index) => set({ firstUnreadIndex: index }),

            // Async actions
            loadConversations: async (userId: number, orgId: number) => {
                set({ isLoadingConvs: true });
                try {
                    const convs = await chatService.getConversations(
                        userId,
                        orgId
                    );
                    set({ conversations: convs });
                } catch (e) {
                    console.error('Failed to load conversations:', e);
                } finally {
                    set({ isLoadingConvs: false });
                }
            },

            loadMessages: async (
                convId: number,
                userId: number,
                orgId: number
            ) => {
                set({ isLoadingMessages: true });
                try {
                    const msgs = await chatService.getMessages(
                        convId,
                        userId,
                        orgId
                    );
                    set({ messages: [...msgs].reverse() });
                    // Update unread count for this conversation
                    set((state) => ({
                        conversations: state.conversations.map((c) =>
                            c.chatConversationId === convId
                                ? { ...c, unreadCount: 0 }
                                : c
                        ),
                    }));
                } catch (e) {
                    console.error('Failed to load messages:', e);
                } finally {
                    set({ isLoadingMessages: false });
                }
            },

            loadConversationDetails: async (
                convId: number,
                userId: number,
                orgId: number
            ) => {
                try {
                    const details = await chatService.getConversationDetails(
                        convId,
                        userId,
                        orgId
                    );
                    try {
                        const ids =
                            details.chatConversationParticipants?.map(
                                (p) => p.participantId
                            ) ?? [];
                        if (ids.length) {
                            const statuses =
                                await chatService.getPresenceStatuses(ids);
                            details.chatConversationParticipants =
                                details.chatConversationParticipants?.map(
                                    (p) => ({
                                        ...p,
                                        chatParticipantCurrentStatus: statuses[
                                            p.participantId
                                        ]
                                            ? 'ONLINE'
                                            : p.chatParticipantCurrentStatus ||
                                              'OFFLINE',
                                    })
                                );
                        }
                    } catch (e) {
                        console.warn('Failed to fetch presence statuses', e);
                    }
                    set({ selectedConvDetails: details });
                } catch (e) {
                    console.error('Failed to load conversation details:', e);
                    set({ selectedConvDetails: null });
                }
            },

            createDirectConversation: async (
                targetUser,
                userId,
                orgId,
                userName,
                userAvatar
            ) => {
                try {
                    const conv = await chatService.createConversation(
                        {
                            chatConversationType: 'DIRECT',
                            orgId,
                            participantIds: [userId, targetUser.id],
                            participants: [
                                {
                                    participantId: userId,
                                    participantName: userName || 'Me',
                                    participantEmail: '',
                                    isChatCreator: true,
                                    participantMob: '',
                                    participantRole: 'USER',
                                    chatParticipantType: 'MEMBER',
                                    participantAvatar: userAvatar,
                                    orgId,
                                    orgName: undefined,
                                    orgType: undefined,
                                },
                                {
                                    participantId: targetUser.id,
                                    participantName: targetUser.name,
                                    participantEmail: targetUser.email,
                                    isChatCreator: false,
                                    participantMob: targetUser.phone || '',
                                    participantRole: targetUser.role || 'USER',
                                    chatParticipantType: 'MEMBER',
                                    participantAvatar: targetUser.profilePhoto,
                                    orgId: targetUser.orgId,
                                    orgName: targetUser.orgName,
                                    orgType: targetUser.orgType,
                                },
                            ],
                        },
                        orgId,
                        userId
                    );
                    set((state) => ({
                        conversations: [conv, ...state.conversations],
                    }));
                    return conv;
                } catch (e) {
                    console.error('Failed to create direct conversation:', e);
                    return null;
                }
            },

            createGroupConversation: async (
                groupName,
                groupDescription,
                selectedGroupUsers,
                userId,
                orgId,
                userName,
                userAvatar
            ) => {
                try {
                    const participants = [
                        {
                            participantId: userId,
                            participantName: userName || 'Me',
                            participantEmail: '',
                            isChatCreator: true,
                            participantMob: '',
                            participantRole: 'USER',
                            chatParticipantType: 'MEMBER',
                            participantAvatar: userAvatar,
                            orgId,
                            orgName: undefined,
                            orgType: undefined,
                        },
                        ...selectedGroupUsers.map((u) => ({
                            participantId: u.id,
                            participantName: u.name,
                            participantEmail: u.email,
                            isChatCreator: false,
                            participantMob: u.phone || '',
                            participantRole: u.role || 'USER',
                            chatParticipantType: 'MEMBER',
                            participantAvatar: u.profilePhoto,
                            orgId: u.orgId,
                            orgName: u.orgName,
                            orgType: u.orgType,
                        })),
                    ];
                    const conv = await chatService.createConversation(
                        {
                            chatConversationName: groupName.trim(),
                            chatConversationDescription:
                                groupDescription.trim() || undefined,
                            chatConversationType: 'GROUP',
                            orgId,
                            participantIds: [
                                userId,
                                ...selectedGroupUsers.map((u) => u.id),
                            ],
                            participants: participants as NonNullable<
                                CreateConversationPayload['participants']
                            >,
                        },
                        orgId,
                        userId
                    );
                    set((state) => ({
                        conversations: [conv, ...state.conversations],
                    }));
                    return conv;
                } catch (e) {
                    console.error('Failed to create group:', e);
                    return null;
                }
            },

            sendMessage: async (text, convId, userId, orgId, replyingTo) => {
                set({ isSending: true });
                try {
                    const msg = await chatService.sendMessage(
                        {
                            chatConversationId: convId,
                            participantId: userId,
                            chatMessageText: text,
                            chatMessageType: 'TEXT',
                            chatMessageAttachmentList: [],
                            clientMessageId:
                                typeof crypto !== 'undefined' &&
                                crypto.randomUUID
                                    ? crypto.randomUUID()
                                    : String(Date.now()),
                            ...(replyingTo && {
                                chatMessageId: replyingTo.chatMessageId,
                            }),
                        },
                        undefined,
                        orgId
                    );
                    set((state) => ({
                        messages: state.messages.some(
                            (m) => m.chatMessageId === msg.chatMessageId
                        )
                            ? state.messages
                            : [...state.messages, msg],
                    }));
                    if (replyingTo) {
                        set((state) => {
                            const next = new Map(state.replyMap);
                            next.set(
                                msg.chatMessageId,
                                replyingTo.chatMessageId
                            );
                            return { replyMap: next };
                        });
                    }
                    set({ newMessage: '', replyingTo: null });
                    set((state) => {
                        const updated = state.conversations.map((c) =>
                            c.chatConversationId === convId
                                ? {
                                      ...c,
                                      lastMessage:
                                          msg.chatMessageText || 'Message',
                                      lastMessageAt: msg.sentAt,
                                      lastMessageSenderId: userId,
                                  }
                                : c
                        );
                        const idx = updated.findIndex(
                            (c) => c.chatConversationId === convId
                        );
                        if (idx > 0) {
                            const [item] = updated.splice(idx, 1);
                            updated.unshift(item);
                        }
                        return { conversations: updated };
                    });
                } catch (e) {
                    console.error('Failed to send message:', e);
                } finally {
                    set({ isSending: false });
                }
            },

            connectWebSocket: async () => {
                try {
                    await chatService.connectWebSocket({
                        onConnect: () => set({ wsConnected: true }),
                        onDisconnect: () => set({ wsConnected: false }),
                        onError: (err) =>
                            console.error('[CHAT WS] error:', err),
                    });
                    set({ wsConnected: true });
                } catch (e) {
                    set({ wsConnected: false });
                    console.error('[CHAT WS] connect failed:', e);
                }
            },

            disconnectWebSocket: () => {
                chatService.disconnectWebSocket();
                set({ wsConnected: false });
            },

            setupSubscriptions: (convId, userId) => {
                const unsubMsg = chatService.subscribeToConversationMessages(
                    convId,
                    (m) => {
                        if (!m || typeof m.chatMessageId !== 'number') return;
                        const senderParticipantId =
                            m.chatConversationParticipant?.participantId;
                        if (
                            senderParticipantId &&
                            senderParticipantId !== userId
                        ) {
                            chatService.acknowledgeMessage(m.chatMessageId);
                        }
                        const normalized: ChatMessage = {
                            chatMessageId: m.chatMessageId,
                            chatMessageText: m.chatMessageText,
                            chatMessageType: m.chatMessageType || 'TEXT',
                            chatMessageStatus: m.chatMessageStatus || 'SENT',
                            sentAt: m.sentAt,
                            deliveredAt: m.deliveredAt,
                            receivedAt: m.receivedAt,
                            updatedAt: m.updatedAt || m.sentAt,
                            isEdited: false,
                            chatConversationParticipant:
                                m.chatConversationParticipant
                                    ? {
                                          chatConversationParticipantsId: 0,
                                          participantId:
                                              m.chatConversationParticipant
                                                  .participantId,
                                          participantName:
                                              m.chatConversationParticipant
                                                  .participantName,
                                          participantEmail:
                                              m.chatConversationParticipant
                                                  .participantEmail || '',
                                          participantMob: '',
                                          participantRole: '',
                                          participantAvatar:
                                              m.chatConversationParticipant
                                                  .participantAvatar,
                                          isChatCreator: false,
                                          chatParticipantType: 'DIRECT',
                                          joinedAt: '',
                                          lastSeenAt: '',
                                          chatParticipantStatus: 'JOINED',
                                          chatParticipantCurrentStatus:
                                              'OFFLINE',
                                          lastRead: '',
                                          updatedAt: '',
                                          isActive: true,
                                      }
                                    : undefined,
                            chatMessageAttachmentList:
                                m.chatMessageAttachmentList || [],
                            chatMessageIndividualStatuses: [],
                            messageSeenByList: m.messageSeenByList,
                        } as ChatMessage;
                        set((state) => ({
                            messages: state.messages.some(
                                (x) =>
                                    x.chatMessageId === normalized.chatMessageId
                            )
                                ? state.messages
                                : [...state.messages, normalized],
                        }));
                        set((state) => ({
                            conversations: state.conversations.map((c) =>
                                c.chatConversationId === convId
                                    ? {
                                          ...c,
                                          lastMessage:
                                              normalized.chatMessageText ||
                                              String(
                                                  normalized.chatMessageType
                                              ),
                                          lastMessageAt: normalized.sentAt,
                                          lastMessageSenderId:
                                              normalized
                                                  .chatConversationParticipant
                                                  ?.participantId,
                                      }
                                    : c
                            ),
                        }));
                    }
                );

                const unsubTyping = chatService.subscribeToTyping(
                    convId,
                    (evt) => {
                        const typingUserId = evt.userId;
                        if (
                            typeof typingUserId !== 'number' ||
                            typingUserId === userId
                        )
                            return;
                        set((state) => ({
                            typingUsers: evt.isTyping
                                ? state.typingUsers.includes(typingUserId)
                                    ? state.typingUsers
                                    : [...state.typingUsers, typingUserId]
                                : state.typingUsers.filter(
                                      (id) => id !== typingUserId
                                  ),
                        }));
                        if (evt.isTyping) {
                            setTimeout(
                                () =>
                                    set((state) => ({
                                        typingUsers: state.typingUsers.filter(
                                            (id) => id !== typingUserId
                                        ),
                                    })),
                                6000
                            );
                        }
                    }
                );

                const unsubStatus = chatService.subscribeToStatusUpdates(
                    convId,
                    (evt) => {
                        const msgId = evt.messageId;
                        set((state) => {
                            const otherParticipants = (
                                state.selectedConvDetails
                                    ?.chatConversationParticipants ?? []
                            ).filter((p) => p.participantId !== userId);
                            return {
                                messages: state.messages.map((m) => {
                                    if (m.chatMessageId > msgId) return m;
                                    const seenBy =
                                        m.messageSeenByList &&
                                        m.messageSeenByList.length
                                            ? m.messageSeenByList
                                            : otherParticipants.map((p) => ({
                                                  participantId:
                                                      p.participantId,
                                                  participantName:
                                                      p.participantName,
                                                  participantAvatar:
                                                      p.participantAvatar,
                                              }));
                                    return {
                                        ...m,
                                        chatMessageStatus: evt.status,
                                        messageSeenByList: seenBy,
                                    };
                                }),
                            };
                        });
                    }
                );

                const unsubDeleted = chatService.subscribeToMessageDeleted(
                    convId,
                    (evt) => {
                        if (evt.deleteForEveryone) {
                            set((state) => ({
                                messages: state.messages.map((m) =>
                                    m.chatMessageId === evt.messageId
                                        ? {
                                              ...m,
                                              chatMessageText:
                                                  'This message has been deleted',
                                              isDeleted: true,
                                              deletedForEveryone: true,
                                          }
                                        : m
                                ),
                            }));
                        }
                    }
                );

                const unsubPin = chatService.subscribeToPinEvents(
                    convId,
                    (evt) => {
                        set((state) => ({
                            messages: state.messages.map((m) =>
                                m.chatMessageId === evt.messageId
                                    ? { ...m, isPinned: evt.isPinned }
                                    : m
                            ),
                        }));
                    }
                );

                return () => {
                    unsubMsg();
                    unsubTyping();
                    unsubStatus();
                    unsubDeleted();
                    unsubPin();
                };
            },

            sendTypingIndicator: (convId, userId, isTyping) => {
                const { wsConnected } = get();
                if (wsConnected) {
                    chatService.sendTypingIndicator(convId, userId, isTyping);
                }
            },

            sendHeartbeat: (userId) => {
                chatService.sendHeartbeat(userId);
            },

            updateConversationDetails: async (
                convId,
                name,
                description,
                userId,
                orgId
            ) => {
                try {
                    const updated = await chatService.updateConversation(
                        convId,
                        name,
                        description,
                        undefined,
                        orgId,
                        userId
                    );
                    set((state) => ({
                        selectedConvDetails: updated,
                        conversations: state.conversations.map((c) =>
                            c.chatConversationId === convId
                                ? {
                                      ...c,
                                      chatConversationName:
                                          updated.chatConversationName,
                                  }
                                : c
                        ),
                    }));
                } catch (e) {
                    console.error('Failed to update conversation:', e);
                }
            },

            addGroupMembers: async (convId, userIds, userId, orgId) => {
                try {
                    await chatService.addParticipants(
                        convId,
                        userIds,
                        orgId,
                        userId
                    );
                    const details = await chatService.getConversationDetails(
                        convId,
                        userId,
                        orgId
                    );
                    set({ selectedConvDetails: details });
                } catch (e) {
                    console.error('Failed to add group members:', e);
                }
            },

            setGroupAdmin: async (convId, memberId, isAdmin, userId, orgId) => {
                try {
                    await chatService.setAdmin(
                        convId,
                        memberId,
                        userId,
                        isAdmin,
                        orgId
                    );
                    const details = await chatService.getConversationDetails(
                        convId,
                        userId,
                        orgId
                    );
                    set({ selectedConvDetails: details });
                } catch (e) {
                    console.error('Failed to update admin:', e);
                }
            },

            removeGroupMember: async (convId, memberId, userId, orgId) => {
                try {
                    await chatService.removeParticipant(
                        convId,
                        memberId,
                        orgId,
                        userId
                    );
                    const details = await chatService.getConversationDetails(
                        convId,
                        userId,
                        orgId
                    );
                    set({ selectedConvDetails: details });
                } catch (e) {
                    console.error('Failed to remove member:', e);
                }
            },

            clearChatForSelf: async (convId, userId, orgId) => {
                set({ isClearingChat: true });
                try {
                    await chatService.clearChatForSelf(convId, userId, orgId);
                    const msgs = await chatService.getMessages(
                        convId,
                        userId,
                        orgId
                    );
                    set({ messages: [...msgs].reverse() });
                } catch (e) {
                    console.error('Failed to clear chat:', e);
                } finally {
                    set({ isClearingChat: false });
                }
            },

            deleteConversation: async (convId, userId, orgId) => {
                set({ isDeletingConversation: true });
                try {
                    await chatService.deleteConversation(convId, userId, orgId);
                    set((state) => ({
                        conversations: state.conversations.filter(
                            (c) => c.chatConversationId !== convId
                        ),
                        selectedConvId: null,
                        selectedConvDetails: null,
                        messages: [],
                    }));
                } catch (e) {
                    console.error('Failed to delete conversation:', e);
                } finally {
                    set({
                        isDeletingConversation: false,
                        isDeleteDialogOpen: false,
                    });
                }
            },

            downloadChat: async (convId, userId, orgId) => {
                set({ isDownloadingChat: true });
                try {
                    const blob = await chatService.downloadChat(
                        convId,
                        userId,
                        orgId
                    );
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `chat-${convId}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } catch (e) {
                    console.error('Failed to download chat:', e);
                } finally {
                    set({ isDownloadingChat: false });
                }
            },

            searchMessages: async (convId, userId, orgId, query) => {
                set({ isSearchingInChat: true });
                try {
                    const results = await chatService.searchMessages(
                        convId,
                        userId,
                        orgId,
                        query
                    );
                    set({ searchResultsInChat: results });
                } catch (e) {
                    console.error('Search failed:', e);
                } finally {
                    set({ isSearchingInChat: false });
                }
            },

            pinMessage: async (convId, messageId, userId, orgId, isPinned) => {
                try {
                    if (isPinned) {
                        await chatService.unpinMessage(
                            convId,
                            messageId,
                            userId,
                            orgId
                        );
                    } else {
                        await chatService.pinMessage(
                            convId,
                            messageId,
                            userId,
                            orgId
                        );
                    }
                } catch (e) {
                    console.error('Failed to pin/unpin message:', e);
                    throw e; // Re-throw so caller can handle
                }
            },

            deleteMessage: async (
                convId,
                messageId,
                userId,
                orgId,
                deleteForEveryone
            ) => {
                try {
                    await chatService.deleteMessage(
                        convId,
                        messageId,
                        userId,
                        orgId,
                        deleteForEveryone
                    );
                    if (deleteForEveryone) {
                        set((state) => ({
                            messages: state.messages.map((m) =>
                                m.chatMessageId === messageId
                                    ? {
                                          ...m,
                                          chatMessageText:
                                              'This message has been deleted',
                                          isDeleted: true,
                                          deletedForEveryone: true,
                                      }
                                    : m
                            ),
                        }));
                    } else {
                        set((state) => ({
                            messages: state.messages.filter(
                                (m) => m.chatMessageId !== messageId
                            ),
                        }));
                    }
                } catch (e) {
                    console.error('Failed to delete message:', e);
                }
            },

            copyMessage: async (text) => {
                try {
                    if (navigator?.clipboard?.writeText) {
                        await navigator.clipboard.writeText(text);
                    } else {
                        const ta = document.createElement('textarea');
                        ta.value = text;
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                    }
                } catch (e) {
                    console.error('Copy failed:', e);
                }
            },

            // Reset
            resetChatState: () => set(initialState),
        }),
        {
            name: 'chat-store',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                // Only persist UI preferences, not message data
                isManageGroupOpen: state.isManageGroupOpen,
                isSearchInChatOpen: state.isSearchInChatOpen,
                searchQueryInChat: state.searchQueryInChat,
                groupName: state.groupName,
                groupDescription: state.groupDescription,
            }),
        }
    )
);

// Selector hooks for common patterns
export const useConversations = () => useChatStore((s) => s.conversations);
export const useSelectedConvId = () => useChatStore((s) => s.selectedConvId);
export const useSelectedConvDetails = () =>
    useChatStore((s) => s.selectedConvDetails);
export const useMessages = () => useChatStore((s) => s.messages);
export const useReplyingTo = () => useChatStore((s) => s.replyingTo);
export const useReplyMap = () => useChatStore((s) => s.replyMap);
export const useNewMessage = () => useChatStore((s) => s.newMessage);
export const useIsSending = () => useChatStore((s) => s.isSending);
export const useChatUI = () =>
    useChatStore(
        useShallow((s) => ({
            isManageGroupOpen: s.isManageGroupOpen,
            isSearchInChatOpen: s.isSearchInChatOpen,
            isDeleteDialogOpen: s.isDeleteDialogOpen,
            isClearingChat: s.isClearingChat,
            isDeletingConversation: s.isDeletingConversation,
            isDownloadingChat: s.isDownloadingChat,
            hoveredMessageId: s.hoveredMessageId,
            messageActionMenuId: s.messageActionMenuId,
            messageToDelete: s.messageToDelete,
            isDeleteMessageDialogOpen: s.isDeleteMessageDialogOpen,
            wsConnected: s.wsConnected,
            typingUsers: s.typingUsers,
        }))
    );
export const useChatActions = () =>
    useChatStore(
        useShallow((s) => ({
            // Sync actions
            setSelectedConvId: s.setSelectedConvId,
            setSelectedConvDetails: s.setSelectedConvDetails,
            setConversations: s.setConversations,
            updateConversation: s.updateConversation,
            addMessage: s.addMessage,
            updateMessage: s.updateMessage,
            setReplyingTo: s.setReplyingTo,
            addReplyMapping: s.addReplyMapping,
            setNewMessage: s.setNewMessage,
            setIsSending: s.setIsSending,
            setIsManageGroupOpen: s.setIsManageGroupOpen,
            setIsSearchInChatOpen: s.setIsSearchInChatOpen,
            setSearchQueryInChat: s.setSearchQueryInChat,
            setSearchResultsInChat: s.setSearchResultsInChat,
            setIsSearchingInChat: s.setIsSearchingInChat,
            setIsDeleteDialogOpen: s.setIsDeleteDialogOpen,
            setIsClearingChat: s.setIsClearingChat,
            setIsDeletingConversation: s.setIsDeletingConversation,
            setIsDownloadingChat: s.setIsDownloadingChat,
            setHoveredMessageId: s.setHoveredMessageId,
            setMessageActionMenuId: s.setMessageActionMenuId,
            setMessageToDelete: s.setMessageToDelete,
            setIsDeleteMessageDialogOpen: s.setIsDeleteMessageDialogOpen,
            setWsConnected: s.setWsConnected,
            setTypingUsers: s.setTypingUsers,
            addTypingUser: s.addTypingUser,
            removeTypingUser: s.removeTypingUser,
            setFirstUnreadIndex: s.setFirstUnreadIndex,
            // Async actions
            loadConversations: s.loadConversations,
            loadMessages: s.loadMessages,
            loadConversationDetails: s.loadConversationDetails,
            createDirectConversation: s.createDirectConversation,
            createGroupConversation: s.createGroupConversation,
            sendMessage: s.sendMessage,
            connectWebSocket: s.connectWebSocket,
            disconnectWebSocket: s.disconnectWebSocket,
            setupSubscriptions: s.setupSubscriptions,
            sendTypingIndicator: s.sendTypingIndicator,
            sendHeartbeat: s.sendHeartbeat,
            updateConversationDetails: s.updateConversationDetails,
            addGroupMembers: s.addGroupMembers,
            setGroupAdmin: s.setGroupAdmin,
            removeGroupMember: s.removeGroupMember,
            clearChatForSelf: s.clearChatForSelf,
            deleteConversation: s.deleteConversation,
            downloadChat: s.downloadChat,
            searchMessages: s.searchMessages,
            pinMessage: s.pinMessage,
            deleteMessage: s.deleteMessage,
            copyMessage: s.copyMessage,
            resetChatState: s.resetChatState,
            // Group creation state
            setIsGroupDialogOpen: s.setIsGroupDialogOpen,
            setGroupName: s.setGroupName,
            setGroupDescription: s.setGroupDescription,
            setSelectedGroupUsers: s.setSelectedGroupUsers,
            setGroupSearchQuery: s.setGroupSearchQuery,
            setGroupSearchResults: s.setGroupSearchResults,
            setIsGroupSearching: s.setIsGroupSearching,
            setIsCreatingGroup: s.setIsCreatingGroup,
            setCreatingUserId: s.setCreatingUserId,
            // Group management state
            setManageGroupName: s.setManageGroupName,
            setManageGroupDescription: s.setManageGroupDescription,
            setManageSearchQuery: s.setManageSearchQuery,
            setManageSearchResults: s.setManageSearchResults,
            setIsManageSearching: s.setIsManageSearching,
            setSelectedToAdd: s.setSelectedToAdd,
            setActionLoading: s.setActionLoading,
            setIsSavingGroupDetails: s.setIsSavingGroupDetails,
            setIsAddingMembers: s.setIsAddingMembers,
            // User search state
            setSearchQuery: s.setSearchQuery,
            setSearchResults: s.setSearchResults,
            setIsSearching: s.setIsSearching,
            setIsSearchOpen: s.setIsSearchOpen,
        }))
    );
