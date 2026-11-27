import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ChatConversation, ChatMessage, User, ChatConversationParticipant } from "@/types/chat";

interface ChatState {
  // Conversations
  conversations: ChatConversation[];
  isLoadingConvs: boolean;
  setConversations: (convs: ChatConversation[]) => void;
  addConversation: (conv: ChatConversation) => void;
  updateConversation: (id: number, updates: Partial<ChatConversation>) => void;
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
  actionLoading: { memberId: number; action: "admin" | "remove" } | null;
  setActionLoading: (loading: { memberId: number; action: "admin" | "remove" } | null) => void;
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
  newMessage: "",
  isSending: false,
  isManageGroupOpen: false,
  isSearchInChatOpen: false,
  searchQueryInChat: "",
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
  groupName: "",
  groupDescription: "",
  selectedGroupUsers: [],
  groupSearchQuery: "",
  groupSearchResults: [],
  isGroupSearching: false,
  isCreatingGroup: false,
  creatingUserId: null,
  manageGroupName: "",
  manageGroupDescription: "",
  manageSearchQuery: "",
  manageSearchResults: [],
  isManageSearching: false,
  selectedToAdd: [],
  actionLoading: null,
  isSavingGroupDetails: false,
  isAddingMembers: false,
  searchQuery: "",
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
      addConversation: (conv) => set((state) => ({ conversations: [conv, ...state.conversations] })),
      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) => (c.chatConversationId === id ? { ...c, ...updates } : c)),
        })),
      removeConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.chatConversationId !== id),
        })),
      setLoadingConvs: (loading) => set({ isLoadingConvs: loading }),

      // Active conversation
      setSelectedConvId: (id) => set({ selectedConvId: id }),
      setSelectedConvDetails: (details) => set({ selectedConvDetails: details }),

      // Messages
      setMessages: (msgs) => set({ messages: msgs }),
      addMessage: (msg) =>
        set((state) => ({
          messages: state.messages.some((m) => m.chatMessageId === msg.chatMessageId)
            ? state.messages
            : [...state.messages, msg],
        })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.chatMessageId === id ? { ...m, ...updates } : m)),
        })),
      removeMessage: (id) =>
        set((state) => ({
          messages: state.messages.filter((m) => m.chatMessageId !== id),
        })),
      setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),

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
      setSearchResultsInChat: (results) => set({ searchResultsInChat: results }),
      setIsSearchingInChat: (searching) => set({ isSearchingInChat: searching }),
      setIsDeleteDialogOpen: (open) => set({ isDeleteDialogOpen: open }),
      setIsClearingChat: (clearing) => set({ isClearingChat: clearing }),
      setIsDeletingConversation: (deleting) => set({ isDeletingConversation: deleting }),
      setIsDownloadingChat: (downloading) => set({ isDownloadingChat: downloading }),

      // Message actions
      setHoveredMessageId: (id) => set({ hoveredMessageId: id }),
      setMessageActionMenuId: (id) => set({ messageActionMenuId: id }),
      setMessageToDelete: (msg) => set({ messageToDelete: msg }),
      setIsDeleteMessageDialogOpen: (open) => set({ isDeleteMessageDialogOpen: open }),

      // WebSocket
      setWsConnected: (connected) => set({ wsConnected: connected }),
      setTypingUsers: (users) => set({ typingUsers: users }),
      addTypingUser: (userId) =>
        set((state) => ({
          typingUsers: state.typingUsers.includes(userId) ? state.typingUsers : [...state.typingUsers, userId],
        })),
      removeTypingUser: (userId) =>
        set((state) => ({
          typingUsers: state.typingUsers.filter((id) => id !== userId),
        })),

      // Group creation
      setIsGroupDialogOpen: (open) => set({ isGroupDialogOpen: open }),
      setGroupName: (name) => set({ groupName: name }),
      setGroupDescription: (desc) => set({ groupDescription: desc }),
      setSelectedGroupUsers: (users) => set({ selectedGroupUsers: users }),
      setGroupSearchQuery: (query) => set({ groupSearchQuery: query }),
      setGroupSearchResults: (users) => set({ groupSearchResults: users }),
      setIsGroupSearching: (searching) => set({ isGroupSearching: searching }),
      setIsCreatingGroup: (creating) => set({ isCreatingGroup: creating }),
      setCreatingUserId: (id) => set({ creatingUserId: id }),

      // Group management
      setManageGroupName: (name) => set({ manageGroupName: name }),
      setManageGroupDescription: (desc) => set({ manageGroupDescription: desc }),
      setManageSearchQuery: (query) => set({ manageSearchQuery: query }),
      setManageSearchResults: (users) => set({ manageSearchResults: users }),
      setIsManageSearching: (searching) => set({ isManageSearching: searching }),
      setSelectedToAdd: (users) => set({ selectedToAdd: users }),
      setActionLoading: (loading) => set({ actionLoading: loading }),
      setIsSavingGroupDetails: (saving) => set({ isSavingGroupDetails: saving }),
      setIsAddingMembers: (adding) => set({ isAddingMembers: adding }),

      // User search
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (users) => set({ searchResults: users }),
      setIsSearching: (searching) => set({ isSearching: searching }),
      setIsSearchOpen: (open) => set({ isSearchOpen: open }),

      // Refs
      setFirstUnreadIndex: (index) => set({ firstUnreadIndex: index }),

      // Reset
      resetChatState: () => set(initialState),
    }),
    {
      name: "chat-store",
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
export const useSelectedConvDetails = () => useChatStore((s) => s.selectedConvDetails);
export const useMessages = () => useChatStore((s) => s.messages);
export const useReplyingTo = () => useChatStore((s) => s.replyingTo);
export const useReplyMap = () => useChatStore((s) => s.replyMap);
export const useNewMessage = () => useChatStore((s) => s.newMessage);
export const useIsSending = () => useChatStore((s) => s.isSending);
export const useChatUI = () =>
  useChatStore((s) => ({
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
  }));
export const useChatActions = () =>
  useChatStore((s) => ({
    setSelectedConvId: s.setSelectedConvId,
    setSelectedConvDetails: s.setSelectedConvDetails,
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
  }));